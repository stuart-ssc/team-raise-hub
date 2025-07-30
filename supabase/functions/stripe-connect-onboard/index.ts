import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-CONNECT-ONBOARD] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not configured");
      throw new Error("Stripe integration not configured. Please contact your administrator to set up the Stripe secret key.");
    }
    logStep("Stripe key found and configured");

    // Initialize Supabase with service role for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    const { groupId, action } = await req.json();
    
    if (!groupId) {
      throw new Error("Group ID is required");
    }

    // Verify user has permission to manage this group's Stripe settings
    // First, get the user's role and school association
    const { data: userInfo, error: userError2 } = await supabaseService
      .from("school_user")
      .select(`
        id,
        school_id,
        group_id,
        user_type:user_type_id (
          name
        )
      `)
      .eq("user_id", user.id)
      .single();

    if (userError2 || !userInfo) {
      throw new Error("User not found in any school");
    }

    // Get the target group information
    const { data: targetGroup, error: groupError } = await supabaseService
      .from("groups")
      .select("id, group_name, stripe_account_id, stripe_account_enabled, school_id")
      .eq("id", groupId)
      .single();

    if (groupError || !targetGroup) {
      throw new Error("Group not found");
    }

    // Check permissions:
    // 1. User must be in the same school as the group
    // 2. User must be either assigned to this specific group OR be a school-level admin
    const sameSchool = userInfo.school_id === targetGroup.school_id;
    const assignedToGroup = userInfo.group_id === groupId;
    const isSchoolAdmin = ['Principal', 'Athletic Director'].includes(userInfo.user_type.name);
    
    if (!sameSchool || (!assignedToGroup && !isSchoolAdmin)) {
      throw new Error("You don't have permission to manage Stripe settings for this group");
    }

    const userPermission = {
      user_type: userInfo.user_type,
      group: targetGroup
    };

    const allowedRoles = ['Principal', 'Athletic Director', 'Coach', 'Club Sponsor', 'Booster Leader'];
    if (!allowedRoles.includes(userPermission.user_type.name)) {
      throw new Error("Insufficient permissions to manage Stripe Connect");
    }

    logStep("Permission verified", { role: userPermission.user_type.name, groupId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    if (action === "create") {
      // Create new Stripe Express account
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: userPermission.group.group_name,
        },
      });

      logStep("Stripe account created", { accountId: account.id });

      // Update group with Stripe account ID
      const { error: updateError } = await supabaseService
        .from("groups")
        .update({
          stripe_account_id: account.id,
          stripe_account_enabled: false, // Will be enabled after onboarding
        })
        .eq("id", groupId);

      if (updateError) {
        logStep("Database update failed", { error: updateError });
        throw new Error("Failed to save Stripe account information");
      }

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${req.headers.get("origin")}/dashboard/groups`,
        return_url: `${req.headers.get("origin")}/dashboard/groups?stripe_success=true`,
        type: "account_onboarding",
      });

      logStep("Account link created", { url: accountLink.url });

      return new Response(JSON.stringify({
        onboardingUrl: accountLink.url,
        accountId: account.id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (action === "dashboard") {
      // Create login link for existing account
      if (!userPermission.group.stripe_account_id) {
        logStep("No Stripe account found", { groupId, groupName: userPermission.group.group_name });
        throw new Error("No Stripe account found for this group");
      }

      logStep("Creating dashboard login link", { 
        accountId: userPermission.group.stripe_account_id,
        groupId,
        groupName: userPermission.group.group_name 
      });

      // First verify the account exists
      try {
        const account = await stripe.accounts.retrieve(userPermission.group.stripe_account_id);
        logStep("Account retrieved successfully", { accountId: account.id, type: account.type });
      } catch (stripeError) {
        logStep("Error retrieving Stripe account", { 
          accountId: userPermission.group.stripe_account_id,
          error: stripeError 
        });
        throw new Error(`Stripe account ${userPermission.group.stripe_account_id} not found or inaccessible`);
      }

      const loginLink = await stripe.accounts.createLoginLink(
        userPermission.group.stripe_account_id
      );

      logStep("Dashboard link created successfully", { url: loginLink.url });

      return new Response(JSON.stringify({
        dashboardUrl: loginLink.url,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (action === "check_status") {
      // Check account status and update database
      if (!userPermission.group.stripe_account_id) {
        return new Response(JSON.stringify({
          connected: false,
          charges_enabled: false,
          details_submitted: false,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const account = await stripe.accounts.retrieve(userPermission.group.stripe_account_id);
      
      logStep("Account status checked", { 
        accountId: account.id,
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted 
      });

      // Update group status if account is now enabled
      if (account.charges_enabled && !userPermission.group.stripe_account_enabled) {
        await supabaseService
          .from("groups")
          .update({ stripe_account_enabled: true })
          .eq("id", groupId);
        
        logStep("Group Stripe status updated to enabled");
      }

      return new Response(JSON.stringify({
        connected: true,
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        requirements: account.requirements,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else {
      throw new Error("Invalid action. Must be 'create', 'dashboard', or 'check_status'");
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});