import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TeamSettingsData {
  groupId: string;
  groupDirections: string;
  enableRosterAttribution: boolean;
  rosterId: string;
}

interface TeamSettingsSectionProps {
  data: TeamSettingsData;
  onUpdate: (updates: Partial<TeamSettingsData>) => void;
}

interface Roster {
  id: number;
  roster_year: number;
  current_roster: boolean;
}

export function TeamSettingsSection({ data, onUpdate }: TeamSettingsSectionProps) {
  const [rosters, setRosters] = useState<Roster[]>([]);

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
          <Switch
            checked={data.enableRosterAttribution}
            onCheckedChange={(checked) => onUpdate({ enableRosterAttribution: checked })}
          />
        </div>

        {data.enableRosterAttribution && (
          <>
            <div className="space-y-2">
              <Label>Select Roster</Label>
              <Select 
                value={data.rosterId} 
                onValueChange={(v) => onUpdate({ rosterId: v })}
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
              </AlertDescription>
            </Alert>
          </>
        )}
      </div>
    </div>
  );
}
