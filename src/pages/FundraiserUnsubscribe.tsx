import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function FundraiserUnsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Missing unsubscribe token.");
      return;
    }
    const run = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "fundraiser-outreach-unsubscribe",
          { body: { token } },
        );
        if (error) throw error;
        setState("done");
        setMessage(
          (data as any)?.message ||
            "You have been unsubscribed from this fundraiser.",
        );
      } catch (e: any) {
        setState("error");
        setMessage(e?.message || "Could not process your request.");
      }
    };
    void run();
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Unsubscribe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "loading" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing your request…
            </div>
          )}
          {state === "done" && (
            <div className="flex items-start gap-2 text-foreground">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <p>{message}</p>
            </div>
          )}
          {state === "error" && (
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <p>{message}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Powered by Sponsorly
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
