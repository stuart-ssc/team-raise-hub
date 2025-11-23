import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RetryRequest {
  emailIds?: string[]; // For manual batch retry
  manual?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { emailIds, manual = false }: RetryRequest = await req.json();

    let query = supabase
      .from("email_delivery_log")
      .select("*")
      .eq("status", "failed")
      .eq("retry_eligible", true)
      .lt("retry_count", supabase.rpc("max_retries"));

    // Manual retry: specific email IDs or all eligible
    if (manual && emailIds && emailIds.length > 0) {
      query = query.in("id", emailIds);
    } else if (!manual) {
      // Automatic retry: only those due for retry
      query = query.lte("next_retry_at", new Date().toISOString());
    }

    const { data: emailsToRetry, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching emails to retry:", fetchError);
      throw fetchError;
    }

    if (!emailsToRetry || emailsToRetry.length === 0) {
      console.log("No emails eligible for retry");
      return new Response(
        JSON.stringify({ message: "No emails to retry", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${emailsToRetry.length} emails for retry`);

    let successCount = 0;
    let failCount = 0;

    // Process retries
    for (const email of emailsToRetry) {
      try {
        console.log(`Retrying email ${email.id} (attempt ${email.retry_count + 1}/${email.max_retries})`);

        // Call send-annual-tax-summary function
        const { data: sendData, error: sendError } = await supabase.functions.invoke(
          "send-annual-tax-summary",
          {
            body: {
              donorEmail: email.recipient_email,
              year: email.year,
              isRetry: true,
            },
          }
        );

        const newRetryCount = email.retry_count + 1;
        const maxReached = newRetryCount >= email.max_retries;

        if (sendError || (sendData && sendData.error)) {
          // Retry failed - update with exponential backoff
          const hoursToWait = Math.pow(4, newRetryCount); // 1hr, 4hr, 16hr
          const nextRetryAt = new Date();
          nextRetryAt.setHours(nextRetryAt.getHours() + hoursToWait);

          await supabase
            .from("email_delivery_log")
            .update({
              retry_count: newRetryCount,
              last_retry_at: new Date().toISOString(),
              next_retry_at: maxReached ? null : nextRetryAt.toISOString(),
              retry_eligible: !maxReached,
              error_message: `Retry ${newRetryCount} failed: ${sendError?.message || sendData?.error}`,
              updated_at: new Date().toISOString(),
            })
            .eq("id", email.id);

          failCount++;
          console.log(`Retry failed for ${email.id}. ${maxReached ? "Max retries reached." : `Next retry: ${nextRetryAt.toISOString()}`}`);
        } else {
          // Retry succeeded - mark as sent
          await supabase
            .from("email_delivery_log")
            .update({
              status: "sent",
              retry_count: newRetryCount,
              last_retry_at: new Date().toISOString(),
              sent_at: new Date().toISOString(),
              retry_eligible: false,
              next_retry_at: null,
              error_message: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", email.id);

          successCount++;
          console.log(`Successfully retried email ${email.id}`);
        }
      } catch (error: any) {
        console.error(`Error processing retry for email ${email.id}:`, error);
        failCount++;
      }
    }

    console.log(`Retry batch complete: ${successCount} succeeded, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        message: "Retry processing complete",
        processed: emailsToRetry.length,
        succeeded: successCount,
        failed: failCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in retry-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
