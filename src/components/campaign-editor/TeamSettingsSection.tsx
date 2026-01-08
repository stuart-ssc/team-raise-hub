import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TeamSettingsData {
  groupId: string;
  groupDirections: string;
  enableRosterAttribution: boolean;
  rosterId: string;
}

interface TeamSettingsSectionProps {
  data: TeamSettingsData;
  onUpdate: (updates: Partial<TeamSettingsData>) => void;
  campaignId?: string;
  isPublished?: boolean;
}

interface Roster {
  id: number;
  roster_year: number;
  current_roster: boolean;
}

export function TeamSettingsSection({ data, onUpdate, campaignId, isPublished }: TeamSettingsSectionProps) {
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [generatingLinks, setGeneratingLinks] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRosters = async () => {
      if (!data.groupId) {
        setRosters([]);
        return;
      }

      const { data: rostersData } = await supabase
        .from("rosters")
        .select("id, roster_year, current_roster")
        .eq("group_id", data.groupId)
        .order("roster_year", { ascending: false });

      setRosters(rostersData || []);
    };

    fetchRosters();
  }, [data.groupId]);

  const handleRosterAttributionChange = async (enabled: boolean) => {
    onUpdate({ enableRosterAttribution: enabled });

    // Only do link operations if campaign is already published
    if (!campaignId || !isPublished) return;

    setGeneratingLinks(true);
    try {
      if (enabled) {
        // Generate links for all roster members
        const { data: result, error } = await supabase.functions.invoke('generate-roster-member-links', {
          body: { campaignId, rosterId: data.rosterId ? parseInt(data.rosterId) : undefined }
        });

        if (error) throw error;

        const linkCount = result?.links?.length || 0;
        if (linkCount > 0) {
          toast({
            title: "Personal links created",
            description: `Created ${linkCount} personal fundraising links`,
          });
        }
      } else {
        // Delete all roster member links for this campaign
        const { error } = await supabase
          .from('roster_member_campaign_links')
          .delete()
          .eq('campaign_id', campaignId);

        if (error) throw error;

        toast({
          title: "Personal links removed",
          description: "Personal fundraising links have been removed. Old URLs will redirect to the main campaign page.",
        });
      }
    } catch (error) {
      console.error('Error managing roster links:', error);
      toast({
        title: "Error",
        description: "Failed to update personal fundraising links",
        variant: "destructive",
      });
    } finally {
      setGeneratingLinks(false);
    }
  };

  const handleRosterChange = async (newRosterId: string) => {
    onUpdate({ rosterId: newRosterId });

    // Regenerate links if campaign is published and roster attribution is enabled
    if (campaignId && isPublished && data.enableRosterAttribution) {
      setGeneratingLinks(true);
      try {
        // Delete old links
        await supabase
          .from('roster_member_campaign_links')
          .delete()
          .eq('campaign_id', campaignId);

        // Generate new links for new roster
        const { data: result, error } = await supabase.functions.invoke('generate-roster-member-links', {
          body: { campaignId, rosterId: parseInt(newRosterId) }
        });

        if (error) throw error;

        const linkCount = result?.links?.length || 0;
        toast({
          title: "Personal links updated",
          description: `Created ${linkCount} personal fundraising links for the new roster`,
        });
      } catch (error) {
        console.error('Error regenerating roster links:', error);
        toast({
          title: "Error",
          description: "Failed to regenerate personal fundraising links",
          variant: "destructive",
        });
      } finally {
        setGeneratingLinks(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="groupDirections">Participant Directions</Label>
          <Badge variant="secondary" className="text-xs">Internal Only</Badge>
        </div>
        <Textarea
          id="groupDirections"
          placeholder="Enter instructions for your team (e.g., 'Each player should aim to sell 10 items by November 15th')"
          rows={3}
          value={data.groupDirections}
          onChange={(e) => onUpdate({ groupDirections: e.target.value })}
        />
        <p className="text-sm text-muted-foreground">
          These instructions are only visible to your team members, not to donors.
        </p>
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Enable Roster Attribution</Label>
            <p className="text-sm text-muted-foreground">
              Allow roster members to get credit for donations
            </p>
          </div>
          <div className="flex items-center gap-2">
            {generatingLinks && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              checked={data.enableRosterAttribution}
              onCheckedChange={handleRosterAttributionChange}
              disabled={generatingLinks}
            />
          </div>
        </div>

        {data.enableRosterAttribution && (
          <>
            <div className="space-y-2">
              <Label>Select Roster</Label>
              <Select 
                value={data.rosterId} 
                onValueChange={handleRosterChange}
                disabled={generatingLinks}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select roster" />
                </SelectTrigger>
                <SelectContent>
                  {rosters.map((roster) => (
                    <SelectItem key={roster.id} value={roster.id.toString()}>
                      {roster.roster_year} {roster.current_roster && "(Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {rosters.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No rosters found for this group. Create a roster first.
                </p>
              )}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Each roster member will get a unique shareable link. When donors use that link, the donation will be attributed to that member.
                {isPublished && " Links are automatically created when you enable this setting."}
              </AlertDescription>
            </Alert>
          </>
        )}
      </div>
    </div>
  );
}