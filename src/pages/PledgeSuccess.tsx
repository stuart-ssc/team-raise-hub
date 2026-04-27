import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SponsorlyLogo from "@/components/SponsorlyLogo";
import { NoIndex } from "@/components/seo/NoIndex";

export default function PledgeSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<'verifying' | 'ok' | 'error'>('verifying');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-pledge-setup", {
          body: { session_id: sessionId },
        });
        if (error) throw error;
        setDetails(data);
        setStatus('ok');
      } catch (e) {
        console.error(e);
        setStatus('error');
      }
    })();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NoIndex />
      <header className="border-b p-4">
        <SponsorlyLogo />
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status === 'verifying' ? (
                <><Loader2 className="h-6 w-6 animate-spin" /> Confirming your pledge…</>
              ) : status === 'ok' ? (
                <><CheckCircle className="h-6 w-6 text-green-600" /> Your pledge is confirmed</>
              ) : (
                "We couldn't confirm your pledge"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            {status === 'ok' && (
              <>
                <div className="flex items-start gap-2 rounded-md border bg-amber-50 border-amber-200 p-3 text-amber-900">
                  <Clock className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Your card hasn't been charged yet.</p>
                    <p>We'll charge it after the event once results are recorded.</p>
                  </div>
                </div>
                <p>
                  We've sent a confirmation email with full details and a link you can use to cancel any time before charge.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/">Done</Link>
                </Button>
              </>
            )}
            {status === 'error' && (
              <p>If you completed checkout, you should still receive a confirmation email shortly. Please contact the organization if you have questions.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}