import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, MailOpen, MousePointerClick, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EmailLog {
  id: string;
  email_type: string;
  subject_line?: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  metadata: any;
}

interface DonorCommunicationHistoryProps {
  donorEmail: string;
}

const DonorCommunicationHistory = ({ donorEmail }: DonorCommunicationHistoryProps) => {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
  });

  useEffect(() => {
    fetchCommunicationHistory();
  }, [donorEmail]);

  const fetchCommunicationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("email_delivery_log")
        .select("*")
        .eq("recipient_email", donorEmail)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const emailData = data || [];
      setEmails(emailData);
      
      // Calculate stats
      setStats({
        total: emailData.length,
        opened: emailData.filter(e => e.opened_at).length,
        clicked: emailData.filter(e => e.clicked_at).length,
        bounced: emailData.filter(e => e.bounced_at).length,
      });
    } catch (error) {
      console.error("Error fetching communication history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (email: EmailLog) => {
    if (email.bounced_at) {
      return <Badge variant="destructive">Bounced</Badge>;
    }
    if (email.clicked_at) {
      return <Badge className="bg-green-500">Clicked</Badge>;
    }
    if (email.opened_at) {
      return <Badge className="bg-blue-500">Opened</Badge>;
    }
    if (email.sent_at) {
      return <Badge variant="secondary">Sent</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const getStatusIcon = (email: EmailLog) => {
    if (email.bounced_at) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    if (email.clicked_at) {
      return <MousePointerClick className="h-4 w-4 text-green-500" />;
    }
    if (email.opened_at) {
      return <MailOpen className="h-4 w-4 text-blue-500" />;
    }
    return <Mail className="h-4 w-4 text-muted-foreground" />;
  };

  const formatEmailType = (type: string) => {
    return type
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Communication History</CardTitle>
          <CardDescription>Loading email history...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const openRate = stats.total > 0 ? ((stats.opened / stats.total) * 100).toFixed(1) : "0";
  const clickRate = stats.total > 0 ? ((stats.clicked / stats.total) * 100).toFixed(1) : "0";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Communication History</CardTitle>
        <CardDescription>
          Email engagement and delivery tracking
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Engagement Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Sent</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Open Rate</p>
            <p className="text-2xl font-bold">{openRate}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Click Rate</p>
            <p className="text-2xl font-bold">{clickRate}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Bounced</p>
            <p className="text-2xl font-bold text-destructive">{stats.bounced}</p>
          </div>
        </div>

        {/* Email List */}
        {emails.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No emails sent yet
          </p>
        ) : (
          <div className="space-y-3">
            {emails.map((email) => (
              <div
                key={email.id}
                className="flex items-start gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="mt-1">
                  {getStatusIcon(email)}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {formatEmailType(email.email_type)}
                      </p>
                      {email.metadata?.subject && (
                        <p className="text-xs text-muted-foreground">
                          {email.metadata.subject}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(email)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {email.sent_at && (
                      <span>Sent {formatDistanceToNow(new Date(email.sent_at), { addSuffix: true })}</span>
                    )}
                    {email.opened_at && (
                      <span>• Opened {formatDistanceToNow(new Date(email.opened_at), { addSuffix: true })}</span>
                    )}
                    {email.clicked_at && (
                      <span>• Clicked {formatDistanceToNow(new Date(email.clicked_at), { addSuffix: true })}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DonorCommunicationHistory;
