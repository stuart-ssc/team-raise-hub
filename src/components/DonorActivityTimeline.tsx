import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Mail, TrendingUp, User, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: string;
  activity_type: string;
  activity_data: any;
  created_at: string;
}

interface DonorActivityTimelineProps {
  donorId: string;
  hideHeader?: boolean;
}

const DonorActivityTimeline = ({ donorId, hideHeader }: DonorActivityTimelineProps) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [donorId]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("donor_activity_log")
        .select("*")
        .eq("donor_id", donorId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "donation":
        return <DollarSign className="h-4 w-4" />;
      case "email_sent":
      case "email_opened":
      case "email_clicked":
        return <Mail className="h-4 w-4" />;
      case "segment_change":
        return <TrendingUp className="h-4 w-4" />;
      case "profile_update":
        return <User className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "donation":
        return "bg-green-500";
      case "email_sent":
        return "bg-blue-500";
      case "email_opened":
        return "bg-purple-500";
      case "email_clicked":
        return "bg-orange-500";
      case "segment_change":
        return "bg-yellow-500";
      case "profile_update":
        return "bg-gray-500";
      default:
        return "bg-muted";
    }
  };

  const formatActivityMessage = (activity: ActivityLog) => {
    const data = activity.activity_data;
    
    switch (activity.activity_type) {
      case "donation":
        return `Donated $${(data.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to ${data.campaign_name || "campaign"}`;
      case "email_sent":
        return `Received email: "${data.subject || "Unknown subject"}"`;
      case "email_opened":
        return `Opened email: "${data.subject || "Unknown subject"}"`;
      case "email_clicked":
        return `Clicked link in email: "${data.subject || "Unknown subject"}"`;
      case "segment_change":
        return `Segment changed from "${data.old_segment || "none"}" to "${data.new_segment || "unknown"}"`;
      case "profile_update":
        return `Profile information updated`;
      default:
        return `Activity: ${activity.activity_type}`;
    }
  };

  if (loading) {
    if (hideHeader) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>Loading activity history...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const body = activities.length === 0 ? (
    <p className="text-sm text-muted-foreground text-center py-8">
      No activity recorded yet
    </p>
  ) : (
    <div className="relative space-y-4">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

      {activities.map((activity) => (
        <div key={activity.id} className="relative flex gap-4 pb-4">
          {/* Timeline dot */}
          <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getActivityColor(activity.activity_type)} text-white`}>
            {getActivityIcon(activity.activity_type)}
          </div>

          {/* Activity content */}
          <div className="flex-1 space-y-1 pt-1">
            <p className="text-sm font-medium leading-none">
              {formatActivityMessage(activity)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </p>
          </div>

          <Badge variant="outline" className="h-fit shrink-0">
            {activity.activity_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
          </Badge>
        </div>
      ))}
    </div>
  );

  if (hideHeader) {
    return body;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>
          Recent interactions and engagement history
        </CardDescription>
      </CardHeader>
      <CardContent>
        {body}
      </CardContent>
    </Card>
  );
};

export default DonorActivityTimeline;
