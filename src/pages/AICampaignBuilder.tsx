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

const ITEM_FIELD_ORDER: { key: string; placeholder: string }[] = [
  { key: "name", placeholder: "Type the {noun} name..." },
  { key: "cost", placeholder: "Enter price in dollars..." },
  { key: "quantity_offered", placeholder: "How many are available?" },
  { key: "image", placeholder: "Upload an image or skip..." },
  { key: "description", placeholder: "Add a short description or skip..." },
  { key: "max_items_purchased", placeholder: "Limit per buyer, or skip..." },
  { key: "size", placeholder: "Size or tier label, or skip..." },
  { key: "is_recurring", placeholder: "Yes or no..." },
  { key: "recurring_interval", placeholder: "Monthly or yearly..." },
];

function getChatPlaceholder(
  phase: Phase,
  currentItemDraft: Record<string, any>,
  itemNoun: string,
  messages: ChatMessage[],
): string {
  // If the last assistant turn surfaced clickable choice chips, nudge the user
  // to pick one rather than implying they need to type a free-text reply.
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  if (
    lastAssistant?.suggestions?.type === "choice" &&
    (lastAssistant.suggestions.options?.length ?? 0) > 0
  ) {
    return "Pick an option above, or type your own answer...";
  }

  if (phase === "complete") return "Anything else?";
  if (phase === "post_draft") return "Answer the question above...";
  if (phase === "collecting_items") {
    const next = ITEM_FIELD_ORDER.find(
      (f) =>
        currentItemDraft[`${f.key}_skipped`] !== true &&
        (currentItemDraft[f.key] === undefined ||
          currentItemDraft[f.key] === null ||
          currentItemDraft[f.key] === ""),
    );
    if (!next) return "Type your answer...";
    return next.placeholder.replace("{noun}", itemNoun);
  }
  return "Describe your fundraiser...";
}


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
  const [campaignSlug, setCampaignSlug] = useState<string | null>(null);
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
      greeting = `Hi! I'm here to help you set up a new fundraiser for **${knownGroup.group_name}**. What kind of fundraiser are you planning?`;
    } else {
      greeting = "Hi! I'm here to help you set up a new fundraiser. Tell me about what you're planning — what kind of fundraiser is it, and which group or team is it for?";
    }

    setCollectedFields(prefill);
    setMessages([
      {
        role: "assistant",
        content: greeting,
        suggestions: campaignTypes.length > 0 ? {
          type: "choice",
          field: "campaign_type_id",
          label: "Fundraiser type",
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

      // 30s timeout — the edge function should always respond within this window.
      // If it doesn't, surface an error instead of leaving the UI stuck on "Thinking..."
      const invokePromise = supabase.functions.invoke("ai-campaign-builder", {
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

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI request timed out after 30s")), 30000),
      );

      const { data, error } = (await Promise.race([invokePromise, timeoutPromise])) as Awaited<typeof invokePromise>;

      if (error) throw new Error(error.message || "Failed to get AI response");
      if (!data) throw new Error("Empty response from AI");

      if (data.error) {
        toast({ title: "AI Error", description: data.error, variant: "destructive" });
        // Append a recovery message so the user has a clear next action.
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Hmm, I lost my train of thought — could you repeat your last answer?",
            suggestions: { type: "choice", field: "__retry__", label: "Recover", options: [{ label: "Retry", value: "__retry__" }] },
          },
        ]);
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
          content: `✅ **Primary details saved!** Your draft **${name}** is ready.\n\nBefore we add items, I just need three quick things: a **fundraiser image**, whether to enable **roster tracking** (each player gets their own personalized fundraising URL to track their individual contributions), and any **participant directions**. Let's start with the image — want to upload one?`,
          suggestions: {
            type: "image_upload",
            field: "image_url",
            label: "Fundraiser image",
            options: [],
          },
        };
        setMessages((prev) => [...prev, transition]);
      }

      // Honor a typed/clicked final action ONLY when the builder is truly complete
      // (defense-in-depth: the server should only emit finalAction in the "complete"
      // phase, but we guard here too so a stale early signal can't trigger publish
      // before items have been added).
      const serverPhase = (data.phase as Phase) || "collecting";
      if (serverPhase === "complete") {
        if (data.finalAction === "publish") {
          setTimeout(() => setShowPublishDialog(true), 150);
        } else if (data.finalAction === "open_editor") {
          const targetId = data.createdCampaignId || campaignId;
          if (targetId) {
            navigate(`/dashboard/fundraisers/${targetId}/edit`);
          }
        }
      }
    } catch (err: any) {
      console.error("AI campaign builder error:", err);
      toast({
        title: "Connection issue",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      // Append a visible recovery message with a Retry chip so the user can resend.
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Hmm, I lost my train of thought — could you repeat your last answer? (Or click Retry below.)",
          suggestions: { type: "choice", field: "__retry__", label: "Recover", options: [{ label: "Retry", value: "__retry__" }] },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (userMessage: string) => {
    // Retry chip: re-send the last user message instead of treating "__retry__" as text.
    if (userMessage === "__retry__" || userMessage === "Retry") {
      const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
      if (lastUserIdx !== -1) {
        const idx = messages.length - 1 - lastUserIdx;
        const lastUser = messages[idx];
        // Trim any trailing recovery assistant messages, then re-send.
        const trimmed = messages.slice(0, idx + 1);
        setMessages(trimmed);
        await callAi(trimmed);
        return;
      }
    }
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
    await callAi(newMessages, undefined, mergedDraft);
  };

  const handleItemImageSkipped = async () => {
    const mergedDraft = { ...currentItemDraft, image_skipped: true };
    setCurrentItemDraft(mergedDraft);
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: "Skip item image" },
    ];
    setMessages(newMessages);
    await callAi(newMessages, undefined, mergedDraft);
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
        .select("id, slug")
        .single();

      if (error) {
        if (error.message?.includes("slug") || error.code === "23505") {
          toast({
            title: "Name conflict",
            description: "A fundraiser with a similar name already exists. Try a slightly different name.",
            variant: "destructive",
          });
          setIsCreating(false);
          return;
        }
        throw error;
      }

      const newId = data.id;
      setCampaignId(newId);
      setCampaignSlug((data as any).slug ?? null);
      setPhase("post_draft");

      toast({
        title: "Draft saved!",
        description: "A few quick setup questions before adding items.",
        duration: 3000,
      });

      // Kick off the post-draft conversation
      const transition: ChatMessage = {
        role: "assistant",
        content: `✅ **Primary details saved!** Your draft **${collectedFields.name}** is ready.\n\nBefore we add items, I just need three quick things: a **fundraiser image**, whether to enable **roster tracking** (each player gets their own personalized fundraising URL to track their individual contributions), and any **participant directions**. Let's start with the image — want to upload one?`,
        suggestions: {
          type: "image_upload",
          field: "image_url",
          label: "Fundraiser image",
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
    if (campaignId) navigate(`/dashboard/fundraisers/${campaignId}/edit`);
  };

  const handlePreview = async () => {
    let slug = campaignSlug;
    if (!slug && campaignId) {
      const { data } = await supabase
        .from("campaigns")
        .select("slug")
        .eq("id", campaignId)
        .single();
      slug = (data as any)?.slug ?? null;
      if (slug) setCampaignSlug(slug);
    }
    if (slug) window.open(`/c/${slug}`, "_blank");
  };

  const handlePublishClick = () => {
    if (campaignId) setShowPublishDialog(true);
  };

  return (
    <DashboardPageLayout segments={[{ label: "Fundraisers", path: "/dashboard/fundraisers" }, { label: "AI Builder" }]}>
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
            onPreview={handlePreview}
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
            onItemImageUploaded={handleItemImageUploaded}
            onItemImageSkipped={handleItemImageSkipped}
            placeholder={getChatPlaceholder(phase, currentItemDraft, itemNoun, messages)}
          />
        </div>
      </div>

      {campaignId && collectedFields.group_id && (
        <CampaignPublicationControl
          campaignId={campaignId}
          campaignName={collectedFields.name || "Fundraiser"}
          groupId={collectedFields.group_id}
          currentStatus={campaignStatus}
          enableRosterAttribution={collectedFields.enable_roster_attribution || false}
          onStatusChange={() => {
            setCampaignStatus("published");
            setShowPublishDialog(false);
            navigate(`/dashboard/fundraisers/${campaignId}/edit`);
          }}
          triggerOpen={showPublishDialog}
          onClose={() => setShowPublishDialog(false)}
          hideButton
        />
      )}
    </DashboardPageLayout>
  );
}
