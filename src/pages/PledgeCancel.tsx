import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SponsorlyLogo from "@/components/SponsorlyLogo";
import { NoIndex } from "@/components/seo/NoIndex";

export default function PledgeCancel() {
  const [params] = useSearchParams();
  const pledgeId = params.get("pledgeId");
  const token = params.get("token");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = async () => {
    if (!pledgeId || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.functions.invoke("cancel-pledge", {
        body: { pledge_id: pledgeId, token },
      });
      if (error) throw error;
      setDone(true);
    } catch (e: any) {
      setError(e?.message || "Could not cancel pledge.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NoIndex />
      <header className="border-b p-4">
        <SponsorlyLogo />
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>
              {done ? (
                <span className="flex items-center gap-2"><CheckCircle className="h-6 w-6 text-green-600" /> Pledge canceled</span>
              ) : (
                "Cancel your pledge?"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            {!pledgeId || !token ? (
              <p>This cancellation link is invalid. Please use the link from your confirmation email.</p>
            ) : done ? (
              <p>Your pledge has been canceled. Your card will not be charged.</p>
            ) : (
              <>
                <p>You can cancel this pledge any time before charge. Your card will not be charged.</p>
                {error && <p className="text-destructive">{error}</p>}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => window.history.back()} disabled={submitting}>
                    Keep my pledge
                  </Button>
                  <Button variant="destructive" onClick={cancel} disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Yes, cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}