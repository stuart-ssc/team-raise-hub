import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import AIChatPanel, { ChatMessage } from "@/components/ai-campaign/AIChatPanel";
import AICampaignPreview from "@/components/ai-campaign/AICampaignPreview";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import { useToast } from "@/hooks/use-toast";

export default function AICampaignBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { organizationUser } = useOrganizationUser();
  const { groups: activeGroups } = useActiveGroup();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm here to help you set up a new campaign. Tell me about what you're planning — what kind of fundraiser is it, and which group or team is it for?",
    },
  ]);
  const [collectedFields, setCollectedFields] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [readyToCreate, setReadyToCreate] = useState(false);

  // Load reference data
  const [campaignTypes, setCampaignTypes] = useState<{ id: string; name: string }[]>([]);
  const [groups, setGroups] = useState<{ id: string; group_name: string }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      // Load campaign types
      const { data: types } = await supabase
        .from("campaign_type")
        .select("id, name")
        .order("name");
      if (types) setCampaignTypes(types);

      // Load groups for the user's organization
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

  const handleSend = async (userMessage: string) => {
    const userMsg: ChatMessage = { role: "user", content: userMessage };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Build conversation history for the API (exclude the initial greeting for cleaner context)
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("ai-campaign-builder", {
        body: JSON.stringify({
          messages: apiMessages,
          collectedFields,
          campaignTypes,
          groups,
        }),
      });

      if (error) {
        throw new Error(error.message || "Failed to get AI response");
      }

      if (data.error) {
        toast({
          title: "AI Error",
          description: data.error,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.assistantMessage,
          suggestions: data.suggestions ?? null,
        },
      ]);
      setCollectedFields(data.updatedFields || collectedFields);
      setReadyToCreate(data.readyToCreate || false);
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

  const handleCreateDraft = async () => {
    if (!readyToCreate || isCreating) return;
    setIsCreating(true);

    try {
      // Build the campaign insert object
      const campaignData: Record<string, any> = {
        name: collectedFields.name,
        campaign_type_id: collectedFields.campaign_type_id,
        group_id: collectedFields.group_id,
        status: false, // Draft
        publication_status: "draft",
      };

      // Add optional fields if provided
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
        // Handle slug collision
        if (error.message?.includes("slug") || error.code === "23505") {
          toast({
            title: "Name conflict",
            description:
              "A campaign with a similar name already exists. Try a slightly different name.",
            variant: "destructive",
          });
          setIsCreating(false);
          return;
        }
        throw error;
      }

      toast({
        title: "Campaign draft created!",
        description: "Opening the campaign editor to add items and finalize details.",
      });

      navigate(`/dashboard/campaigns/${data.id}/edit`);
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

  return (
    <DashboardPageLayout segments={[{ label: "Campaigns", path: "/dashboard/campaigns" }, { label: "AI Builder" }]}>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-10rem)] gap-0 border rounded-lg overflow-hidden bg-background">
        {/* Preview Panel (Left on desktop, top on mobile) */}
        <div className="lg:w-3/5 w-full lg:border-r border-b lg:border-b-0 overflow-hidden flex flex-col min-h-[300px] lg:min-h-0">
          <AICampaignPreview
            collectedFields={collectedFields}
            campaignTypes={campaignTypes}
            groups={groups}
            readyToCreate={readyToCreate}
            isCreating={isCreating}
            onCreateDraft={handleCreateDraft}
          />
        </div>

        {/* Chat Panel (Right on desktop, bottom on mobile) */}
        <div className="lg:w-2/5 w-full overflow-hidden flex flex-col flex-1 lg:flex-none">
          <AIChatPanel
            messages={messages}
            isLoading={isLoading}
            onSend={handleSend}
          />
        </div>
      </div>
    </DashboardPageLayout>
  );
}
