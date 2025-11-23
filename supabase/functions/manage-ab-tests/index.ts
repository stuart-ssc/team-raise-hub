import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ManageTestRequest {
  action: "create" | "update" | "activate" | "complete" | "get_variant" | "calculate_winner";
  testId?: string;
  testData?: any;
  email?: string; // For variant selection
}

// Chi-square test for statistical significance
function calculateChiSquare(
  controlConverted: number,
  controlTotal: number,
  variantConverted: number,
  variantTotal: number
): { chiSquare: number; pValue: number; significant: boolean } {
  const totalConverted = controlConverted + variantConverted;
  const totalNonConverted = (controlTotal - controlConverted) + (variantTotal - variantConverted);
  const total = controlTotal + variantTotal;

  const expectedControlConverted = (controlTotal * totalConverted) / total;
  const expectedVariantConverted = (variantTotal * totalConverted) / total;
  const expectedControlNonConverted = (controlTotal * totalNonConverted) / total;
  const expectedVariantNonConverted = (variantTotal * totalNonConverted) / total;

  const chiSquare =
    Math.pow(controlConverted - expectedControlConverted, 2) / expectedControlConverted +
    Math.pow(variantConverted - expectedVariantConverted, 2) / expectedVariantConverted +
    Math.pow((controlTotal - controlConverted) - expectedControlNonConverted, 2) / expectedControlNonConverted +
    Math.pow((variantTotal - variantConverted) - expectedVariantNonConverted, 2) / expectedVariantNonConverted;

  // Approximation for p-value with df=1, critical value at p=0.05 is 3.841
  const significant = chiSquare > 3.841;
  const pValue = significant ? 0.05 : 0.1; // Simplified

  return { chiSquare, pValue, significant };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, testId, testData, email }: ManageTestRequest = await req.json();

    switch (action) {
      case "create": {
        // Create new A/B test with variants
        const { data: test, error: testError } = await supabase
          .from("email_ab_tests")
          .insert({
            name: testData.name,
            description: testData.description,
            email_type: testData.email_type || "annual_tax_summary",
            minimum_sample_size: testData.minimum_sample_size || 100,
            status: "draft",
          })
          .select()
          .single();

        if (testError) throw testError;

        // Create variants
        const variants = testData.variants.map((v: any, index: number) => ({
          test_id: test.id,
          name: v.name,
          subject_line: v.subject_line,
          template_data: v.template_data || {},
          is_control: index === 0,
          split_percentage: 50,
        }));

        const { error: variantsError } = await supabase
          .from("email_ab_variants")
          .insert(variants);

        if (variantsError) throw variantsError;

        return new Response(
          JSON.stringify({ success: true, test }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "activate": {
        // Activate test
        const { error } = await supabase
          .from("email_ab_tests")
          .update({
            status: "active",
            start_date: new Date().toISOString(),
          })
          .eq("id", testId);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_variant": {
        // Get active test and select variant for this email (50/50 split)
        const { data: activeTests, error: testsError } = await supabase
          .from("email_ab_tests")
          .select("*, email_ab_variants(*)")
          .eq("status", "active")
          .eq("email_type", "annual_tax_summary")
          .single();

        if (testsError || !activeTests) {
          return new Response(
            JSON.stringify({ variant: null }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Simple 50/50 split based on email hash
        const emailHash = email?.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
        const variantIndex = emailHash % 2;
        const variant = activeTests.email_ab_variants[variantIndex];

        return new Response(
          JSON.stringify({ 
            variant,
            test_id: activeTests.id,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "calculate_winner": {
        // Get test results and calculate winner
        const { data: results, error: resultsError } = await supabase.rpc(
          "get_ab_test_results",
          { test_uuid: testId }
        );

        if (resultsError || !results || results.length !== 2) {
          throw new Error("Unable to fetch test results");
        }

        const control = results.find((r: any) => r.is_control);
        const variant = results.find((r: any) => !r.is_control);

        if (!control || !variant) {
          throw new Error("Missing control or variant data");
        }

        const totalSamples = Number(control.emails_sent) + Number(variant.emails_sent);
        
        const { data: test } = await supabase
          .from("email_ab_tests")
          .select("minimum_sample_size")
          .eq("id", testId)
          .single();

        const minSampleSize = test?.minimum_sample_size || 100;

        if (totalSamples < minSampleSize) {
          return new Response(
            JSON.stringify({
              message: "Insufficient sample size",
              current_sample: totalSamples,
              required_sample: minSampleSize,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Calculate chi-square for open rate
        const openStats = calculateChiSquare(
          Number(control.emails_opened),
          Number(control.emails_sent),
          Number(variant.emails_opened),
          Number(variant.emails_sent)
        );

        // Calculate chi-square for click rate
        const clickStats = calculateChiSquare(
          Number(control.emails_clicked),
          Number(control.emails_sent),
          Number(variant.emails_clicked),
          Number(variant.emails_sent)
        );

        // Determine winner based on combined metrics
        let winner = null;
        let reason = "No statistically significant difference";

        if (openStats.significant || clickStats.significant) {
          const controlScore = Number(control.open_rate) + Number(control.click_rate) * 2;
          const variantScore = Number(variant.open_rate) + Number(variant.click_rate) * 2;

          winner = variantScore > controlScore ? variant.variant_id : control.variant_id;
          reason = variantScore > controlScore 
            ? "Variant performs better with statistical significance"
            : "Control performs better with statistical significance";
        }

        // Update test with winner if found
        if (winner) {
          await supabase
            .from("email_ab_tests")
            .update({
              winner_variant_id: winner,
              status: "completed",
              end_date: new Date().toISOString(),
            })
            .eq("id", testId);
        }

        return new Response(
          JSON.stringify({
            winner,
            reason,
            statistics: {
              open_test: openStats,
              click_test: clickStats,
            },
            results: {
              control,
              variant,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    console.error("Error in manage-ab-tests:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
