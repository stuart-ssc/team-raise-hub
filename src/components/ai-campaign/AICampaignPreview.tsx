import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Check, Minus, AlertCircle, Rocket, Loader2, ExternalLink, ImageIcon, Users, FileText } from "lucide-react";
import { allFields, formatFieldValue, getMissingRequiredFields } from "@/lib/ai/campaignSchema";

type Phase = "collecting" | "ready_to_create" | "post_draft" | "complete";

interface AICampaignPreviewProps {
  collectedFields: Record<string, any>;
  campaignTypes: { id: string; name: string }[];
  groups: { id: string; group_name: string }[];
  readyToCreate: boolean;
  isCreating: boolean;
  onCreateDraft: () => void;
  phase?: Phase;
  campaignId?: string | null;
  onOpenEditor?: () => void;
}

export default function AICampaignPreview({
  collectedFields,
  campaignTypes,
  groups,
  readyToCreate,
  isCreating,
  onCreateDraft,
  phase = "collecting",
  campaignId,
  onOpenEditor,
}: AICampaignPreviewProps) {
  const missingRequired = getMissingRequiredFields(collectedFields);
  const filledCount = allFields.filter(
    (f) =>
      collectedFields[f.key] !== undefined &&
      collectedFields[f.key] !== null &&
      collectedFields[f.key] !== ""
  ).length;
  const progressPercent = Math.round((filledCount / allFields.length) * 100);

  const resolvedTypeName = campaignTypes.find((t) => t.id === collectedFields.campaign_type_id)?.name;
  const resolvedGroupName = groups.find((g) => g.id === collectedFields.group_id)?.group_name;

  const isPostDraft = phase === "post_draft" || phase === "complete";

  const postDraftItems = [
    {
      key: "image_url",
      label: "Campaign image",
      icon: ImageIcon,
      done: !!collectedFields.image_url || !!collectedFields.image_skipped,
      value: collectedFields.image_url
        ? "Uploaded"
        : collectedFields.image_skipped
          ? "Skipped"
          : null,
      preview: collectedFields.image_url,
    },
    {
      key: "roster_attribution",
      label: "Roster attribution",
      icon: Users,
      done: collectedFields.enable_roster_attribution !== undefined,
      value:
        collectedFields.enable_roster_attribution === true
          ? collectedFields.roster_id
            ? "Enabled"
            : "Enabled (pick roster)"
          : collectedFields.enable_roster_attribution === false
            ? "Disabled"
            : null,
    },
    {
      key: "group_directions",
      label: "Participant directions",
      icon: FileText,
      done: collectedFields.group_directions_addressed === true,
      value: collectedFields.group_directions
        ? "Added"
        : collectedFields.group_directions_addressed
          ? "Skipped"
          : null,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Campaign Preview</h3>
        {campaignId && (
          <Badge variant="outline" className="text-[10px]">Draft saved</Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Cover image preview */}
        {collectedFields.image_url && (
          <div className="rounded-lg overflow-hidden border">
            <img
              src={collectedFields.image_url}
              alt="Campaign cover"
              className="w-full h-40 object-cover"
            />
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold">
            {collectedFields.name || (
              <span className="text-muted-foreground italic">Untitled Campaign</span>
            )}
          </h2>
          {collectedFields.description && (
            <p className="text-sm text-muted-foreground mt-1">{collectedFields.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {resolvedTypeName && <Badge variant="secondary">{resolvedTypeName}</Badge>}
          {resolvedGroupName && <Badge variant="outline">{resolvedGroupName}</Badge>}
        </div>

        {!isPostDraft && (
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Completion
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex items-center gap-3">
                <Progress value={progressPercent} className="h-2 flex-1" />
                <span className="text-xs font-medium text-muted-foreground w-8 text-right">
                  {progressPercent}%
                </span>
              </div>
              {missingRequired.length > 0 && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {missingRequired.length} required field{missingRequired.length > 1 ? "s" : ""} remaining
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {allFields.map((field) => {
                const value = collectedFields[field.key];
                const hasValue = value !== undefined && value !== null && value !== "";
                let displayValue = "";
                if (hasValue) {
                  if (field.key === "campaign_type_id") displayValue = resolvedTypeName || value;
                  else if (field.key === "group_id") displayValue = resolvedGroupName || value;
                  else displayValue = formatFieldValue(field.key, value);
                }

                return (
                  <div key={field.key} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      {hasValue ? (
                        <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      ) : field.required ? (
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      ) : (
                        <Minus className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className="text-sm">{field.label}</span>
                      {field.required && <span className="text-[10px] text-muted-foreground">*</span>}
                    </div>
                    <span
                      className={`text-sm text-right max-w-[50%] truncate ${
                        hasValue
                          ? "font-medium"
                          : field.required
                            ? "text-amber-500 text-xs"
                            : "text-muted-foreground/40 text-xs"
                      }`}
                    >
                      {hasValue ? displayValue : field.required ? "Needed" : "---"}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {isPostDraft && (
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Setup Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="space-y-2">
                {postDraftItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        {item.done ? (
                          <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        ) : (
                          <Icon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                        )}
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <span
                        className={`text-sm text-right max-w-[50%] truncate ${
                          item.done ? "font-medium" : "text-muted-foreground/40 text-xs"
                        }`}
                      >
                        {item.value || "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="p-4 border-t">
        {phase === "complete" ? (
          <Button onClick={onOpenEditor} className="w-full gap-2" size="lg">
            <ExternalLink className="h-4 w-4" />
            Open Campaign Editor
          </Button>
        ) : isPostDraft ? (
          <Button
            onClick={onOpenEditor}
            variant="outline"
            className="w-full gap-2"
            size="lg"
          >
            <ExternalLink className="h-4 w-4" />
            Skip ahead to editor
          </Button>
        ) : (
          <>
            <Button
              onClick={onCreateDraft}
              disabled={!readyToCreate || isCreating}
              className="w-full gap-2"
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Draft...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Create Draft Campaign
                </>
              )}
            </Button>
            {!readyToCreate && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Fill in all required fields to create your draft
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
