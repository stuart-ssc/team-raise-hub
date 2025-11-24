import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface BusinessCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: any | null;
  organizationId?: string;
  onSuccess: () => void;
}

interface Sequence {
  email_template_key: string;
  subject_line: string;
  email_body: string;
  send_delay_days: number;
}

const TEMPLATE_OPTIONS = [
  { value: "partnership-appreciation", label: "Partnership Appreciation" },
  { value: "partnership-check-in", label: "Partnership Check-In" },
  { value: "re-engagement", label: "Re-engagement" },
  { value: "urgent-reactivation", label: "Urgent Reactivation" },
  { value: "expansion-opportunity", label: "Expansion Opportunity" },
  { value: "stakeholder-cultivation", label: "Stakeholder Cultivation" },
];

const CAMPAIGN_TYPES = [
  { value: "health_check", label: "Health Check", description: "Regular check-ins with healthy partnerships" },
  { value: "expansion", label: "Expansion", description: "Grow partnerships with high potential" },
  { value: "at_risk", label: "At Risk", description: "Re-engage partnerships showing decline" },
  { value: "re_engagement", label: "Re-engagement", description: "Urgent reactivation of dormant partnerships" },
];

export function BusinessCampaignDialog({
  open,
  onOpenChange,
  campaign,
  organizationId,
  onSuccess,
}: BusinessCampaignDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [campaignType, setCampaignType] = useState("");
  const [healthStatuses, setHealthStatuses] = useState<string[]>([]);
  const [expansionLevels, setExpansionLevels] = useState<string[]>([]);
  const [minPriorityScore, setMinPriorityScore] = useState("");
  const [minDaysSinceActivity, setMinDaysSinceActivity] = useState("");
  const [sequences, setSequences] = useState<Sequence[]>([
    {
      email_template_key: "",
      subject_line: "",
      email_body: "",
      send_delay_days: 0,
    },
  ]);

  useEffect(() => {
    if (campaign) {
      setName(campaign.name);
      setCampaignType(campaign.campaign_type);
      const config = campaign.trigger_config || {};
      setHealthStatuses(config.health_status || []);
      setExpansionLevels(config.expansion_potential || []);
      setMinPriorityScore(config.priority_score_min?.toString() || "");
      setMinDaysSinceActivity(config.days_since_activity_min?.toString() || "");

      // Fetch sequences
      fetchSequences(campaign.id);
    } else {
      // Reset for new campaign
      setName("");
      setCampaignType("");
      setHealthStatuses([]);
      setExpansionLevels([]);
      setMinPriorityScore("");
      setMinDaysSinceActivity("");
      setSequences([
        {
          email_template_key: "",
          subject_line: "",
          email_body: "",
          send_delay_days: 0,
        },
      ]);
    }
  }, [campaign, open]);

  const fetchSequences = async (campaignId: string) => {
    const { data, error } = await supabase
      .from("business_nurture_sequences")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("sequence_order");

    if (!error && data) {
      setSequences(
        data.map((seq) => ({
          email_template_key: seq.email_template_key,
          subject_line: seq.subject_line,
          email_body: seq.email_body,
          send_delay_days: seq.send_delay_days,
        }))
      );
    }
  };

  const handleHealthStatusToggle = (status: string) => {
    setHealthStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleExpansionToggle = (level: string) => {
    setExpansionLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const addSequence = () => {
    setSequences([
      ...sequences,
      {
        email_template_key: "",
        subject_line: "",
        email_body: "",
        send_delay_days: 0,
      },
    ]);
  };

  const removeSequence = (index: number) => {
    setSequences(sequences.filter((_, i) => i !== index));
  };

  const updateSequence = (index: number, field: keyof Sequence, value: any) => {
    const newSequences = [...sequences];
    newSequences[index] = { ...newSequences[index], [field]: value };
    setSequences(newSequences);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;

    try {
      setLoading(true);

      const triggerConfig = {
        health_status: healthStatuses.length > 0 ? healthStatuses : undefined,
        expansion_potential: expansionLevels.length > 0 ? expansionLevels : undefined,
        priority_score_min: minPriorityScore ? parseInt(minPriorityScore) : undefined,
        days_since_activity_min: minDaysSinceActivity ? parseInt(minDaysSinceActivity) : undefined,
      };

      if (campaign) {
        // Update existing campaign
        const { error } = await supabase
          .from("business_nurture_campaigns")
          .update({
            name,
            campaign_type: campaignType,
            trigger_config: triggerConfig,
          })
          .eq("id", campaign.id);

        if (error) throw error;

        // Delete old sequences
        await supabase
          .from("business_nurture_sequences")
          .delete()
          .eq("campaign_id", campaign.id);

        // Insert new sequences
        const sequencesData = sequences.map((seq, index) => ({
          campaign_id: campaign.id,
          sequence_order: index + 1,
          ...seq,
        }));

        const { error: seqError } = await supabase
          .from("business_nurture_sequences")
          .insert(sequencesData);

        if (seqError) throw seqError;

        toast.success("Campaign updated successfully");
      } else {
        // Create new campaign
        const { data: newCampaign, error } = await supabase
          .from("business_nurture_campaigns")
          .insert({
            name,
            campaign_type: campaignType,
            organization_id: organizationId,
            trigger_config: triggerConfig,
            status: "draft",
          })
          .select()
          .single();

        if (error) throw error;

        // Insert sequences
        const sequencesData = sequences.map((seq, index) => ({
          campaign_id: newCampaign.id,
          sequence_order: index + 1,
          ...seq,
        }));

        const { error: seqError } = await supabase
          .from("business_nurture_sequences")
          .insert(sequencesData);

        if (seqError) throw seqError;

        toast.success("Campaign created successfully");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving campaign:", error);
      toast.error(error.message || "Failed to save campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? "Edit" : "Create"} Campaign</DialogTitle>
          <DialogDescription>
            Set up an automated email campaign for business partnership cultivation
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Q1 Partnership Health Check"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Campaign Type</Label>
            <Select value={campaignType} onValueChange={setCampaignType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select campaign type" />
              </SelectTrigger>
              <SelectContent>
                {CAMPAIGN_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Trigger Conditions</Label>
            <Card className="p-4 space-y-4">
              <div>
                <Label className="text-sm mb-2 block">Partnership Health Status</Label>
                <div className="flex flex-wrap gap-2">
                  {["excellent", "good", "needs_attention", "at_risk", "critical"].map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={healthStatuses.includes(status)}
                        onCheckedChange={() => handleHealthStatusToggle(status)}
                      />
                      <span className="text-sm capitalize">{status.replace("_", " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm mb-2 block">Expansion Potential</Label>
                <div className="flex gap-2">
                  {["high", "medium", "low"].map((level) => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={expansionLevels.includes(level)}
                        onCheckedChange={() => handleExpansionToggle(level)}
                      />
                      <span className="text-sm capitalize">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minPriority" className="text-sm">
                    Min Priority Score
                  </Label>
                  <Input
                    id="minPriority"
                    type="number"
                    value={minPriorityScore}
                    onChange={(e) => setMinPriorityScore(e.target.value)}
                    placeholder="0-100"
                  />
                </div>
                <div>
                  <Label htmlFor="minDays" className="text-sm">
                    Min Days Since Activity
                  </Label>
                  <Input
                    id="minDays"
                    type="number"
                    value={minDaysSinceActivity}
                    onChange={(e) => setMinDaysSinceActivity(e.target.value)}
                    placeholder="e.g., 90"
                  />
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Email Sequences</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSequence}>
                <Plus className="w-4 h-4 mr-1" />
                Add Email
              </Button>
            </div>

            {sequences.map((sequence, index) => (
              <Card key={index} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Email {index + 1}</Label>
                  {sequences.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSequence(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Template</Label>
                  <Select
                    value={sequence.email_template_key}
                    onValueChange={(value) => updateSequence(index, "email_template_key", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_OPTIONS.map((template) => (
                        <SelectItem key={template.value} value={template.value}>
                          {template.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Subject Line</Label>
                  <Input
                    value={sequence.subject_line}
                    onChange={(e) => updateSequence(index, "subject_line", e.target.value)}
                    placeholder="Email subject line"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Send Delay (days after previous)</Label>
                  <Input
                    type="number"
                    value={sequence.send_delay_days}
                    onChange={(e) =>
                      updateSequence(index, "send_delay_days", parseInt(e.target.value) || 0)
                    }
                    placeholder="0"
                    required
                  />
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : campaign ? "Update" : "Create"} Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
