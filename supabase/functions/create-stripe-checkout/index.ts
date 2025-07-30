import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-STRIPE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Initialize Supabase with service role for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user if authenticated (optional for guest checkout)
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseService.auth.getUser(token);
      user = userData.user;
      logStep("User authenticated", { userId: user?.id, email: user?.email });
    } else {
      logStep("Guest checkout");
    }

    const { campaignSlug, items, customerInfo } = await req.json();
    logStep("Request data received", { campaignSlug, itemCount: items?.length });

    if (!campaignSlug || !items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Missing required fields: campaignSlug, items");
    }

    // Fetch campaign data with group and Stripe Connect info
    const { data: campaignData, error: campaignError } = await supabaseService
      .from("campaigns")
      .select(`
        id,
        name,
        slug,
        group_id,
        groups!inner (
          id,
          group_name,
          school_id,
          stripe_account_id,
          stripe_account_enabled,
          schools!inner (
            school_name,
            "Primary Color"
          )
        )
      `)
      .eq("slug", campaignSlug)
      .eq("status", true)
      .single();

    if (campaignError || !campaignData) {
      throw new Error("Campaign not found or inactive");
    }

    if (!campaignData.groups.stripe_account_enabled || !campaignData.groups.stripe_account_id) {
      throw new Error("Stripe Connect not enabled for this organization");
    }

    logStep("Campaign found", { campaignId: campaignData.id, stripeAccountId: campaignData.groups.stripe_account_id });

    // Fetch and validate campaign items
    const itemIds = items.map(item => item.id);
    const { data: campaignItems, error: itemsError } = await supabaseService
      .from("campaign_items")
      .select("*")
      .eq("campaign_id", campaignData.id)
      .in("id", itemIds);

    if (itemsError || !campaignItems) {
      throw new Error("Failed to fetch campaign items");
    }

    // Validate items and calculate totals
    let totalAmount = 0;
    const validatedItems = [];

    for (const requestedItem of items) {
      const campaignItem = campaignItems.find(ci => ci.id === requestedItem.id);
      if (!campaignItem) {
        throw new Error(`Item not found: ${requestedItem.id}`);
      }

      const quantity = parseInt(requestedItem.quantity);
      if (quantity <= 0) {
        throw new Error(`Invalid quantity for item: ${campaignItem.name}`);
      }

      if (campaignItem.quantity_available && quantity > campaignItem.quantity_available) {
        throw new Error(`Insufficient quantity for item: ${campaignItem.name}`);
      }

      if (campaignItem.max_items_purchased && quantity > campaignItem.max_items_purchased) {
        throw new Error(`Exceeds maximum purchase limit for item: ${campaignItem.name}`);
      }

      const itemTotal = parseFloat(campaignItem.cost) * quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        id: campaignItem.id,
        name: campaignItem.name,
        cost: parseFloat(campaignItem.cost),
        quantity: quantity,
        total: itemTotal
      });
    }

    logStep("Items validated", { totalAmount, itemCount: validatedItems.length });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Calculate application fee (2.5% platform fee)
    const applicationFeeAmount = Math.round(totalAmount * 100 * 0.025); // 2.5% in cents

    // Create line items for Stripe
    const lineItems = validatedItems.map(item => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.cost * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    logStep("Creating Stripe checkout session", { 
      connectedAccountId: campaignData.groups.stripe_account_id,
      applicationFeeAmount,
      totalAmountCents: Math.round(totalAmount * 100)
    });

    // Create checkout session with Stripe Connect
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: user?.email || customerInfo?.email,
      success_url: `${req.headers.get("origin")}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/c/${campaignSlug}`,
      metadata: {
        campaign_id: campaignData.id,
        user_id: user?.id || "guest",
        items: JSON.stringify(validatedItems)
      },
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
      },
    }, {
      stripeAccount: campaignData.groups.stripe_account_id,
    });

    logStep("Stripe session created", { sessionId: session.id });

    // Create order record in database
    const { error: orderError } = await supabaseService
      .from("orders")
      .insert({
        user_id: user?.id || null,
        campaign_id: campaignData.id,
        stripe_session_id: session.id,
        total_amount: totalAmount,
        currency: "usd",
        status: "pending",
        customer_email: user?.email || customerInfo?.email || null,
        customer_name: customerInfo?.name || null,
        items: validatedItems,
        application_fee_amount: applicationFeeAmount / 100, // Store in dollars
      });

    if (orderError) {
      logStep("Order creation failed", { error: orderError });
      throw new Error("Failed to create order record");
    }

    logStep("Order created successfully");

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});