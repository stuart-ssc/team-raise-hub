import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import AIChatPanel, { ChatMessage } from "@/components/ai-campaign/AIChatPanel";
import AICampaignPreview from "@/components/ai-campaign/AICampaignPreview";
import { CampaignPublicationControl } from "@/components/CampaignPublicationControl";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import { useToast } from "@/hooks/use-toast";

type Phase = "collecting" | "ready_to_create" | "collecting_items" | "post_draft" | "complete";

export default function AICampaignBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { organizationUser } = useOrganizationUser();
  const { activeGroup, groups: activeGroups } = useActiveGroup();

  const knownGroup = activeGroup || (activeGroups.length === 1 ? activeGroups[0] : null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [collectedFields, setCollectedFields] = useState<Record<string, any>>({});
  const [initialMessageSet, setInitialMessageSet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [readyToCreate, setReadyToCreate] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("collecting");
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState<string>("draft");

  // Items collection state (mirrors edge function)
  const [currentItemDraft, setCurrentItemDraft] = useState<Record<string, any>>({});
  const [itemsAdded, setItemsAdded] = useState<number>(0);
  const [awaitingAddAnother, setAwaitingAddAnother] = useState<boolean>(false);
  const [itemNoun, setItemNoun] = useState<string>("item");

  const [campaignTypes, setCampaignTypes] = useState<{ id: string; name: string }[]>([]);
  const [groups, setGroups] = useState<{ id: string; group_name: string }[]>([]);

  useEffect(() => {
    if (initialMessageSet) return;
    if (campaignTypes.length === 0) return;
    if (activeGroups.length === 0 && !activeGroup) return;

    const prefill: Record<string, any> = {};
    let greeting: string;

    if (knownGroup) {
      prefill.group_id = knownGroup.id;
      greeting = `Hi! I'm here to help you set up a new campaign for **${knownGroup.group_name}**. What kind of fundraiser are you planning?`;
    } else {
      greeting = "Hi! I'm here to help you set up a new campaign. Tell me about what you're planning — what kind of fundraiser is it, and which group or team is it for?";
    }

    setCollectedFields(prefill);
    setMessages([
      {
        role: "assistant",
        content: greeting,
        suggestions: campaignTypes.length > 0 ? {
          type: "choice",
          field: "campaign_type_id",
          label: "Campaign type",
          options: campaignTypes.map((t) => ({ label: t.name, value: t.id })),
        } : null,
      },
    ]);
    setInitialMessageSet(true);
  }, [campaignTypes, knownGroup, initialMessageSet]);

  useEffect(() => {
    const loadData = async () => {
      const { data: types } = await supabase
        .from("campaign_type")
        .select("id, name")
        .order("name");
      if (types) setCampaignTypes(types);

      if (organizationUser?.organization_id) {
        const { data: orgGroups } = await supabase
          .from("groups")
          .select("id, group_name")
          .eq("organization_id", organizationUser.organization_id)
          .eq("status", true)
          .order("group_name");
        if (orgGroups) setGroups(orgGroups);
      }
    };
    loadData();
  }, [organizationUser?.organization_id]);

  const callAi = async (
    newMessages: ChatMessage[],
    overrideFields?: Record<string, any>,
    overrideItemDraft?: Record<string, any>,
  ) => {
    setIsLoading(true);
    try {
      const apiMessages = newMessages.map((m) => ({ role: m.role, content: m.content }));
      const fieldsToSend = overrideFields ?? collectedFields;
      const itemDraftToSend = overrideItemDraft ?? currentItemDraft;

      const { data, error } = await supabase.functions.invoke("ai-campaign-builder", {
        body: JSON.stringify({
          messages: apiMessages,
          collectedFields: fieldsToSend,
          campaignTypes,
          groups,
          activeGroupId: knownGroup?.id || null,
          campaignId,
          currentItemDraft: itemDraftToSend,
          itemsAdded,
          awaitingAddAnother,
          phase,
        }),
      });

      if (error) throw new Error(error.message || "Failed to get AI response");

      if (data.error) {
        toast({ title: "AI Error", description: data.error, variant: "destructive" });
        return;
      }

      const parts: string[] = Array.isArray(data.assistantMessages) && data.assistantMessages.length > 0
        ? data.assistantMessages
        : [data.assistantMessage].filter(Boolean);

      setMessages((prev) => [
        ...prev,
        ...parts.map((content, idx) => ({
          role: "assistant" as const,
          content,
          suggestions: idx === parts.length - 1 ? (data.suggestions ?? null) : null,
        })),
      ]);
      setCollectedFields(data.updatedFields || fieldsToSend);
      setReadyToCreate(data.readyToCreate || false);
      setPhase((data.phase as Phase) || "collecting");

      // Sync items-collection state from edge function
      if (data.currentItemDraft !== undefined) setCurrentItemDraft(data.currentItemDraft || {});
      if (typeof data.itemsAdded === "number") setItemsAdded(data.itemsAdded);
      if (typeof data.awaitingAddAnother === "boolean") setAwaitingAddAnother(data.awaitingAddAnother);
      if (data.itemNoun) setItemNoun(data.itemNoun);

      if (data.savedItemId) {
        toast({
          title: `${itemNoun.charAt(0).toUpperCase() + itemNoun.slice(1)} added`,
          description: `You now have ${data.itemsAdded ?? itemsAdded + 1} ${itemNoun}${(data.itemsAdded ?? itemsAdded + 1) === 1 ? "" : "s"}.`,
          duration: 3000,
        });
      }

      // If the AI just created the draft via the create_campaign_draft tool, capture the new id
      if (data.createdCampaignId && !campaignId) {
        setCampaignId(data.createdCampaignId);
        toast({
          title: "Draft saved!",
          description: "A few quick setup questions before adding items.",
          duration: 3000,
        });
        const name = data.updatedFields?.name || collectedFields.name || "your campaign";
        const transition: ChatMessage = {
          role: "assistant",
          content: `✅ **Primary details saved!** Your draft **${name}** is ready.\n\nBefore we add items, I just need three quick things: a **campaign image**, whether this is a **peer-to-peer fundraiser**, and any **participant directions**. Let's start with the image — want to upload one?`,
          suggestions: {
            type: "image_upload",
            field: "image_url",
            label: "Campaign image",
            options: [],
          },
        };
        setMessages((prev) => [...prev, transition]);
      }

      // Honor a typed/clicked final action when the builder is complete
      if (data.finalAction === "publish") {
        setTimeout(() => setShowPublishDialog(true), 150);
      } else if (data.finalAction === "open_editor") {
        const targetId = data.createdCampaignId || campaignId;
        if (targetId) {
          setTimeout(() => navigate(`/dashboard/campaigns/${targetId}/edit`), 300);
        }
      }
    } catch (err: any) {
      console.error("AI campaign builder error:", err);
      toast({
        title: "Error",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (userMessage: string) => {
    const userMsg: ChatMessage = { role: "user", content: userMessage };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    await callAi(newMessages);
  };

  const handleImageUploaded = async (url: string) => {
    // Optimistically merge so the next AI call sees the URL
    const merged = { ...collectedFields, image_url: url };
    setCollectedFields(merged);
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: `Image uploaded: ${url}` },
    ];
    setMessages(newMessages);
    await callAi(newMessages, merged);
  };

  const handleImageSkipped = async () => {
    const merged = { ...collectedFields, image_skipped: true };
    setCollectedFields(merged);
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: "Skip image for now" },
    ];
    setMessages(newMessages);
    await callAi(newMessages, merged);
  };

  const handleItemImageUploaded = async (url: string) => {
    const mergedDraft = { ...currentItemDraft, image: url };
    setCurrentItemDraft(mergedDraft);
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: `Item image uploaded: ${url}` },
    ];
    setMessages(newMessages);
    await callAi(newMessages);
  };

  const handleItemImageSkipped = async () => {
    const mergedDraft = { ...currentItemDraft, image_skipped: true };
    setCurrentItemDraft(mergedDraft);
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: "Skip item image" },
    ];
    setMessages(newMessages);
    await callAi(newMessages);
  };

  const handleCreateDraft = async () => {
    if (!readyToCreate || isCreating || campaignId) return;
    setIsCreating(true);

    try {
      const campaignData: Record<string, any> = {
        name: collectedFields.name,
        campaign_type_id: collectedFields.campaign_type_id,
        group_id: collectedFields.group_id,
        status: false,
        publication_status: "draft",
      };

      if (collectedFields.description) campaignData.description = collectedFields.description;
      if (collectedFields.goal_amount) campaignData.goal_amount = collectedFields.goal_amount;
      if (collectedFields.start_date) campaignData.start_date = collectedFields.start_date;
      if (collectedFields.end_date) campaignData.end_date = collectedFields.end_date;
      if (collectedFields.requires_business_info !== undefined) {
        campaignData.requires_business_info = collectedFields.requires_business_info;
      }

      const { data, error } = await supabase
        .from("campaigns")
        .insert(campaignData as any)
        .select("id")
        .single();

      if (error) {
        if (error.message?.includes("slug") || error.code === "23505") {
          toast({
            title: "Name conflict",
            description: "A campaign with a similar name already exists. Try a slightly different name.",
            variant: "destructive",
          });
          setIsCreating(false);
          return;
        }
        throw error;
      }

      const newId = data.id;
      setCampaignId(newId);
      setPhase("post_draft");

      toast({
        title: "Draft saved!",
        description: "A few quick setup questions before adding items.",
        duration: 3000,
      });

      // Kick off the post-draft conversation
      const transition: ChatMessage = {
        role: "assistant",
        content: `✅ **Primary details saved!** Your draft **${collectedFields.name}** is ready.\n\nBefore we add items, I just need three quick things: a **campaign image**, whether this is a **peer-to-peer fundraiser**, and any **participant directions**. Let's start with the image — want to upload one?`,
        suggestions: {
          type: "image_upload",
          field: "image_url",
          label: "Campaign image",
          options: [],
        },
      };
      setMessages((prev) => [...prev, transition]);
    } catch (err: any) {
      console.error("Create draft error:", err);
      toast({
        title: "Error creating draft",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEditor = () => {
    if (campaignId) navigate(`/dashboard/campaigns/${campaignId}/edit`);
  };

  const handlePublishClick = () => {
    if (campaignId) setShowPublishDialog(true);
  };

  return (
    <DashboardPageLayout segments={[{ label: "Campaigns", path: "/dashboard/campaigns" }, { label: "AI Builder" }]}>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-10rem)] gap-0 border rounded-lg overflow-hidden bg-background">
        <div className="lg:w-3/5 w-full lg:border-r border-b lg:border-b-0 overflow-hidden flex flex-col min-h-[300px] lg:min-h-0">
          <AICampaignPreview
            collectedFields={collectedFields}
            campaignTypes={campaignTypes}
            groups={groups}
            readyToCreate={readyToCreate}
            isCreating={isCreating}
            onCreateDraft={handleCreateDraft}
            phase={phase}
            campaignId={campaignId}
            onOpenEditor={handleOpenEditor}
            onPublishClick={handlePublishClick}
            itemsAdded={itemsAdded}
            itemNoun={itemNoun}
          />
        </div>

        <div className="lg:w-2/5 w-full overflow-hidden flex flex-col flex-1 lg:flex-none">
          <AIChatPanel
            messages={messages}
            isLoading={isLoading}
            onSend={handleSend}
            campaignId={campaignId}
            onImageUploaded={handleImageUploaded}
            onImageSkipped={handleImageSkipped}
          />
        </div>
      </div>

      {campaignId && collectedFields.group_id && (
        <CampaignPublicationControl
          campaignId={campaignId}
          campaignName={collectedFields.name || "Campaign"}
          groupId={collectedFields.group_id}
          currentStatus={campaignStatus}
          enableRosterAttribution={collectedFields.enable_roster_attribution || false}
          onStatusChange={() => {
            setCampaignStatus("published");
            setShowPublishDialog(false);
            navigate(`/dashboard/campaigns/${campaignId}/edit`);
          }}
          triggerOpen={showPublishDialog}
          onClose={() => setShowPublishDialog(false)}
          hideButton
        />
      )}
    </DashboardPageLayout>
  );
}
