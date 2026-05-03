import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";

interface CampaignData {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  groupId: string;
  campaignTypeId: string;
  endDate?: string;
  pledgeEventDate?: string;
  heroAccentWord?: string;
}

interface BasicDetailsSectionProps {
  data: CampaignData;
  onUpdate: (updates: Partial<CampaignData>) => void;
  campaignImageFile: File | null;
  onImageFileChange: (file: File | null) => void;
  slugExists: boolean;
  onSlugExistsChange: (exists: boolean) => void;
  isEditing: boolean;
}

interface Group {
  id: string;
  group_name: string;
}

interface CampaignType {
  id: string;
  name: string;
}

export function BasicDetailsSection({
  data,
  onUpdate,
  campaignImageFile,
  onImageFileChange,
  slugExists,
  onSlugExistsChange,
  isEditing,
}: BasicDetailsSectionProps) {
  const { organizationUser } = useOrganizationUser();
  const [groups, setGroups] = useState<Group[]>([]);
  const [campaignTypes, setCampaignTypes] = useState<CampaignType[]>([]);
  const [checkingSlug, setCheckingSlug] = useState(false);
  // Tracks whether end_date was set automatically by us (so we don't clobber a manual edit).
  const endDateAutoSetRef = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationUser) return;

      // Fetch groups based on permission
      let groupQuery = supabase.from("groups").select("id, group_name").eq("status", true);
      
      const permissionLevel = organizationUser.user_type.permission_level;
      if (permissionLevel === 'organization_admin') {
        groupQuery = groupQuery.eq('organization_id', organizationUser.organization_id);
      } else if (permissionLevel === 'program_manager' && organizationUser.group_id) {
        groupQuery = groupQuery.eq('id', organizationUser.group_id);
      }

      const { data: groupsData } = await groupQuery;
      setGroups(groupsData || []);

      // Auto-set group if only one available
      if (groupsData?.length === 1 && !data.groupId) {
        onUpdate({ groupId: groupsData[0].id });
      }

      // Fetch campaign types
      const { data: typesData } = await supabase
        .from("campaign_type")
        .select("id, name")
        .order("name");
      setCampaignTypes(typesData || []);
    };

    fetchData();
  }, [organizationUser]);

  // Auto-suggest end_date = pledge_event_date - 1 day when type is Pledge.
  useEffect(() => {
    const typeName = campaignTypes.find((t) => t.id === data.campaignTypeId)?.name?.toLowerCase() || "";
    const isPledge = typeName.includes("pledge");
    if (!isPledge) return;
    if (!data.pledgeEventDate) return;

    // Compute the day before the event, treating values as plain dates (YYYY-MM-DD)
    // to avoid timezone drift.
    const [y, m, d] = data.pledgeEventDate.split("-").map((n) => parseInt(n, 10));
    if (!y || !m || !d) return;
    const eventUtc = new Date(Date.UTC(y, m - 1, d));
    eventUtc.setUTCDate(eventUtc.getUTCDate() - 1);
    const suggested = eventUtc.toISOString().slice(0, 10);

    // Only auto-fill if end_date is empty OR was previously set by us.
    if (!data.endDate || endDateAutoSetRef.current) {
      if (data.endDate !== suggested) {
        endDateAutoSetRef.current = true;
        onUpdate({ endDate: suggested } as any);
      }
    }
    // Intentionally exclude data.endDate from deps — we only react to event-date / type changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.pledgeEventDate, data.campaignTypeId, campaignTypes]);

  const generateSlugFromName = (name: string): string => {
    return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const checkSlugExists = async (slug: string) => {
    if (!slug) {
      onSlugExistsChange(false);
      return;
    }

    setCheckingSlug(true);
    try {
      let query = supabase.from("campaigns").select("id").eq("slug", slug);
      if (isEditing && data.groupId) {
        // Exclude current campaign when editing
        const urlId = window.location.pathname.split('/').pop();
        if (urlId) {
          query = query.neq("id", urlId);
        }
      }
      
      const { data: existingData } = await query;
      onSlugExistsChange((existingData?.length || 0) > 0);
    } finally {
      setCheckingSlug(false);
    }
  };

  const handleNameChange = (name: string) => {
    onUpdate({ name });
    
    // Auto-generate slug for new campaigns
    if (!isEditing) {
      const slug = generateSlugFromName(name);
      onUpdate({ name, slug });
      checkSlugExists(slug);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Fundraiser Name *</Label>
        <Input
          id="name"
          placeholder="Enter fundraiser name"
          value={data.name}
          onChange={(e) => handleNameChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">URL Slug *</Label>
        <Input
          id="slug"
          placeholder="fundraiser-url-slug"
          value={data.slug}
          className={slugExists ? "border-destructive" : ""}
          onChange={(e) => {
            const slug = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            onUpdate({ slug });
            checkSlugExists(slug);
          }}
        />
        <p className="text-sm text-muted-foreground">
          Must be unique. This will be your fundraiser URL.
          {checkingSlug && <span className="ml-2">Checking...</span>}
          {slugExists && <span className="ml-2 text-destructive">This slug is already taken</span>}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter fundraiser description"
          rows={3}
          value={data.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="heroAccentWord">Hero Accent Word</Label>
        <Input
          id="heroAccentWord"
          placeholder="e.g. Sponsor"
          value={data.heroAccentWord || ""}
          onChange={(e) => onUpdate({ heroAccentWord: e.target.value })}
        />
        <p className="text-sm text-muted-foreground">
          Highlighted word styled in your brand color within the landing page headline.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Fundraiser Image</Label>
        <div className="space-y-2">
          {(campaignImageFile || data.imageUrl) && (
            <div className="flex items-start gap-3">
              <img
                src={campaignImageFile ? URL.createObjectURL(campaignImageFile) : data.imageUrl}
                alt="Fundraiser preview"
                className="h-20 w-20 rounded-md border object-cover"
              />
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <span className="truncate max-w-[260px]">
                  {campaignImageFile
                    ? `Selected: ${campaignImageFile.name}`
                    : `Current: ${data.imageUrl.split('/').pop()}`}
                </span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 self-start"
                  onClick={() => document.getElementById('campaign-image-upload')?.click()}
                >
                  Replace image
                </Button>
              </div>
            </div>
          )}
          <div 
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
            onClick={() => document.getElementById('campaign-image-upload')?.click()}
          >
            <Input
              id="campaign-image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImageFileChange(file);
                }
              }}
            />
            <div className="space-y-2">
              <div className="text-muted-foreground">
                {campaignImageFile ? (
                  <span>Selected: {campaignImageFile.name}</span>
                ) : data.imageUrl ? (
                  <span>Click to replace image</span>
                ) : (
                  <span>Click to upload an image</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                PNG, JPG, JPEG up to 10MB
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {groups.length > 1 && (
          <div className="space-y-2">
            <Label>Group *</Label>
            <Select value={data.groupId} onValueChange={(v) => onUpdate({ groupId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.group_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className={`space-y-2 ${groups.length <= 1 ? 'col-span-2' : ''}`}>
          <Label>Fundraiser Type *</Label>
          <Select value={data.campaignTypeId} onValueChange={(v) => onUpdate({ campaignTypeId: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {campaignTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
