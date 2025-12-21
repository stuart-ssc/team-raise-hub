import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { 
  UserPlus, 
  UserMinus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Shield,
  FileText
} from "lucide-react";

interface ActivityLog {
  id: string;
  activity_type: string;
  activity_data: any;
  created_at: string;
}

interface BusinessActivityTimelineProps {
  businessId: string;
}

export const BusinessActivityTimeline = ({ businessId }: BusinessActivityTimelineProps) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [businessId]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('business_activity_log')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activity log:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'donor_linked':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'donor_unlinked':
        return <UserMinus className="h-4 w-4 text-red-500" />;
      case 'donation_received':
        return <DollarSign className="h-4 w-4 text-primary" />;
      case 'engagement_score_changed':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'segment_changed':
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
      case 'primary_contact_changed':
        return <Shield className="h-4 w-4 text-amber-500" />;
      case 'business_updated':
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatActivityMessage = (activity: ActivityLog) => {
    const data = activity.activity_data;
    
    switch (activity.activity_type) {
      case 'donor_linked':
        return (
          <>
            <span className="font-medium">{data.donor_name}</span> was linked as{' '}
            <span className="text-muted-foreground">{data.role || 'Employee'}</span>
            {data.is_primary_contact && <span className="ml-1 text-amber-600">(Primary Contact)</span>}
          </>
        );
      case 'donor_unlinked':
        return (
          <>
            <span className="font-medium">{data.donor_name}</span> was unlinked
            {data.was_primary_contact && <span className="ml-1 text-muted-foreground">(was Primary Contact)</span>}
          </>
        );
      case 'donation_received':
        return (
          <>
            <span className="font-medium">{data.donor_name}</span> donated{' '}
            <span className="font-semibold text-primary">${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            {data.campaign_name && <span className="text-muted-foreground"> to {data.campaign_name}</span>}
          </>
        );
      case 'engagement_score_changed':
        const scoreDiff = (data.new_score || 0) - (data.old_score || 0);
        const isIncrease = scoreDiff > 0;
        return (
          <>
            Engagement score {isIncrease ? 'increased' : 'decreased'} from{' '}
            <span className="font-medium">{data.old_score}</span> to{' '}
            <span className="font-medium">{data.new_score}</span>
            {isIncrease ? (
              <TrendingUp className="inline h-3 w-3 ml-1 text-green-500" />
            ) : (
              <TrendingDown className="inline h-3 w-3 ml-1 text-red-500" />
            )}
          </>
        );
      case 'segment_changed':
        return (
          <>
            Moved from <span className="font-medium">{data.old_segment || 'new'}</span> to{' '}
            <span className="font-medium">{data.new_segment}</span> segment
          </>
        );
      case 'primary_contact_changed':
        return (
          <>
            <span className="font-medium">{data.donor_name}</span> is now the{' '}
            <span className="text-amber-600">Primary Contact</span>
          </>
        );
      case 'business_updated':
        return <>Business information was updated</>;
      default:
        return <>{activity.activity_type.replace(/_/g, ' ')}</>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No activity recorded yet. Activity will appear here as employees are linked, donations are made, and engagement scores change.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
              <div className="flex items-start justify-center mt-0.5">
                <div className="p-1.5 rounded-full bg-muted">
                  {getActivityIcon(activity.activity_type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  {formatActivityMessage(activity)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
