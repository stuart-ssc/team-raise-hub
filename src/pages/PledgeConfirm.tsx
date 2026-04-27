import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SponsorlyLogo from "@/components/SponsorlyLogo";
import { NoIndex } from "@/components/seo/NoIndex";

export default function PledgeConfirm() {
  const [params] = useSearchParams();
  const pledgeId = params.get("pledgeId");
  const token = params.get("token");
  const done = params.get("done") === "1";
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'done' | 'error'>(
    done ? 'done' : 'loading'
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (done) return;
    if (!pledgeId || !token) {
      setStatus('error');
      setMessage("Missing pledge or token.");
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("confirm-pledge-payment", {
          body: {
            pledge_id: pledgeId,
            token,
            return_url: `${window.location.origin}/pledge/confirm?done=1`,
          },
        });
        if (error) throw error;
        if (data?.redirectUrl) {
          setStatus('redirecting');
          window.location.href = data.redirectUrl;
        } else {
          setStatus('error');
          setMessage(data?.message || "Could not start confirmation.");
        }
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message || "Confirmation failed.");
      }
    })();
  }, [pledgeId, token, done]);

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
              {status === 'loading' || status === 'redirecting' ? (
                <><Loader2 className="h-6 w-6 animate-spin" /> Preparing secure confirmation…</>
              ) : status === 'done' ? (
                <><CheckCircle className="h-6 w-6 text-green-600" /> Confirmation complete</>
              ) : (
                <><AlertTriangle className="h-6 w-6 text-destructive" /> Confirmation failed</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            {status === 'loading' && <p>You'll be redirected to a secure Stripe page to confirm your card.</p>}
            {status === 'done' && (
              <p>Thanks! We've received confirmation. Your charge will appear on your statement shortly.</p>
            )}
            {status === 'error' && (
              <p>{message || "Please contact the organization for help."}</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}