import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Building2, ChevronDown } from "lucide-react";
import { BusinessWithInsights, MatchResult } from "@/lib/campaignMatching";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BusinessMatchPreviewProps {
  business: BusinessWithInsights & { matchResult: MatchResult };
  selected: boolean;
  onSelect: (selected: boolean) => void;
  showMatchDetails?: boolean;
}

export function BusinessMatchPreview({
  business,
  selected,
  onSelect,
  showMatchDetails = true,
}: BusinessMatchPreviewProps) {
  const { matchResult } = business;
  const isEnrolled = business.enrollment_status === "active";
  const wasEnrolled = business.enrollment_count && business.enrollment_count > 0;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          disabled={isEnrolled}
          className="mt-1"
        />
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={business.logo_url || undefined} alt={business.business_name} />
          <AvatarFallback>
            <Building2 className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <h4 className="font-semibold text-sm truncate">{business.business_name}</h4>
              {business.business_email && (
                <p className="text-xs text-muted-foreground truncate">{business.business_email}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {showMatchDetails && (
                <Badge variant={matchResult.matches ? "default" : "secondary"} className="text-xs">
                  {matchResult.score}% Match
                </Badge>
              )}
              {isEnrolled && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                  Enrolled
                </Badge>
              )}
              {!isEnrolled && wasEnrolled && (
                <Badge variant="outline" className="text-xs">
                  Previously Enrolled
                </Badge>
              )}
            </div>
          </div>

          {showMatchDetails && (
            <Collapsible>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1">
                  {matchResult.reasons.map((_, index) => (
                    <div key={index} className="w-2 h-2 rounded-full bg-primary" />
                  ))}
                  {matchResult.warnings.map((_, index) => (
                    <div key={index} className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  ))}
                </div>
                <CollapsibleTrigger className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  View Details <ChevronDown className="h-3 w-3" />
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="space-y-1">
                {matchResult.reasons.map((reason, index) => (
                  <p key={index} className="text-xs text-muted-foreground">
                    {reason}
                  </p>
                ))}
                {matchResult.warnings.map((warning, index) => (
                  <p key={index} className="text-xs text-muted-foreground">
                    {warning}
                  </p>
                ))}
                {isEnrolled && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ⓘ Already enrolled with status: {business.enrollment_status}
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {!showMatchDetails && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{business.engagement_segment || "Unknown"} segment</span>
              {business.linked_donors_count !== null && (
                <>
                  <span>•</span>
                  <span>{business.linked_donors_count} contacts</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
