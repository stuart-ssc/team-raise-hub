const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REQUIRED_KEYS = ["name", "campaign_type_id", "group_id", "goal_amount", "start_date", "end_date"];

const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function buildIso(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null; // invalid (e.g. Feb 31)
  }
  return `${y}-${pad(m)}-${pad(d)}`;
}

function inferYear(month: number, day: number, today: Date): number {
  const curYear = today.getUTCFullYear();
  const candidate = new Date(Date.UTC(curYear, month - 1, day));
  // strip today's time
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return candidate.getTime() < todayUtc.getTime() ? curYear + 1 : curYear;
}

/**
 * Normalize a variety of date inputs to YYYY-MM-DD (US mm/dd convention).
 * Returns null if unparseable.
 */
function normalizeDate(input: any, today: Date = new Date()): string | null {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  // 1. Already ISO YYYY-MM-DD
  let m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return buildIso(+m[1], +m[2], +m[3]);

  // 2. M/D/YYYY or M-D-YYYY (US)
  m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let y = +m[3];
    if (y < 100) y += 2000;
    return buildIso(y, +m[1], +m[2]);
  }

  // 3. M/D or M-D (no year — infer)
  m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (m) {
    const mo = +m[1], d = +m[2];
    const y = inferYear(mo, d, today);
    return buildIso(y, mo, d);
  }

  // 4. Verbal: "May 1", "May 1st", "May 1, 2026", "1 May 2026", "May 1st 2026"
  const cleaned = raw.toLowerCase().replace(/(\d+)(st|nd|rd|th)/g, "$1").replace(/,/g, " ");
  const parts = cleaned.split(/\s+/).filter(Boolean);

  // Try "month day [year]"
  if (parts.length >= 2 && MONTHS[parts[0]]) {
    const mo = MONTHS[parts[0]];
    const d = parseInt(parts[1], 10);
    if (!isNaN(d)) {
      const y = parts[2] && /^\d{2,4}$/.test(parts[2])
        ? (parts[2].length === 2 ? 2000 + +parts[2] : +parts[2])
        : inferYear(mo, d, today);
      return buildIso(y, mo, d);
    }
  }

  // Try "day month [year]"
  if (parts.length >= 2 && MONTHS[parts[1]]) {
    const d = parseInt(parts[0], 10);
    const mo = MONTHS[parts[1]];
    if (!isNaN(d)) {
      const y = parts[2] && /^\d{2,4}$/.test(parts[2])
        ? (parts[2].length === 2 ? 2000 + +parts[2] : +parts[2])
        : inferYear(mo, d, today);
      return buildIso(y, mo, d);
    }
  }

  // 5. Last resort: native Date parser (handles "next Friday", ISO datetime, etc.)
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return buildIso(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, parsed.getUTCDate());
  }

  return null;
}

interface FieldDef {
  key: string;
  label: string;
  type: string;
  required: boolean;
  aiDescription: string;
}

const FIELD_DEFS: FieldDef[] = [
  { key: "name", label: "Campaign Name", type: "string", required: true, aiDescription: "The name/title of the campaign." },
  { key: "campaign_type_id", label: "Campaign Type", type: "select", required: true, aiDescription: "The campaign type ID from the provided list." },
  { key: "group_id", label: "Group", type: "select", required: true, aiDescription: "The group ID from the provided list." },
  { key: "description", label: "Description", type: "string", required: false, aiDescription: "Brief description of the campaign." },
  { key: "goal_amount", label: "Goal Amount (cents)", type: "number", required: true, aiDescription: "Fundraising goal in cents (e.g. 50000 = $500)." },
  { key: "start_date", label: "Start Date", type: "date", required: true, aiDescription: "Start date in YYYY-MM-DD format." },
  { key: "end_date", label: "End Date", type: "date", required: true, aiDescription: "End date in YYYY-MM-DD format." },
  { key: "requires_business_info", label: "Requires Business Info", type: "boolean", required: false, aiDescription: "Whether to collect business info at checkout." },
];

function buildSystemPrompt(
  campaignTypes: { id: string; name: string }[],
  groups: { id: string; group_name: string }[],
  collectedFields: Record<string, any>,
  autoFilledGroupName: string | null,
  todayIso: string
): string {
  const typesList = campaignTypes.map((t) => `  - "${t.name}" → id: ${t.id}`).join("\n");
  const groupsList = groups.map((g) => `  - "${g.group_name}" → id: ${g.id}`).join("\n");

  const fieldDescriptions = FIELD_DEFS.map(
    (f) =>
      `  - ${f.key} (${f.required ? "REQUIRED" : "optional"}, ${f.type}): ${f.aiDescription}`
  ).join("\n");

  const alreadyCollected = Object.entries(collectedFields)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `  - ${k}: ${JSON.stringify(v)}`)
    .join("\n") || "  (none yet)";

  const missingRequired = REQUIRED_KEYS.filter(
    (k) => !collectedFields[k] || collectedFields[k] === ""
  );
  const missingList = missingRequired.length > 0
    ? missingRequired.map((k) => `  - ${k}`).join("\n")
    : "  (all required fields collected!)";

  const autoFillNote = autoFilledGroupName
    ? `\n## Auto-Selected Group\nThe organization only has one group, so it has been auto-selected: "${autoFilledGroupName}". Briefly confirm this in your next message (e.g. "Got it — this is for ${autoFilledGroupName}.") and move on to the next missing field.\n`
    : "";

  return `You are a campaign creation assistant for Sponsorly, a fundraising platform for schools and nonprofits.

Your job is to help the user set up a new fundraising campaign by collecting the required information through natural conversation.

## Available Campaign Types
${typesList}

## Available Groups
${groupsList}

## Campaign Fields
${fieldDescriptions}

## Already Collected
${alreadyCollected}

## Still Missing (Required)
${missingList}
${autoFillNote}
## Rules
1. Ask about ONE missing required field at a time. Be conversational and brief (1-2 sentences).
2. When the user provides information, call the "update_campaign_fields" tool with the extracted values.
3. For campaign_type_id: match the user's description to the closest campaign type and use its ID.
4. For group_id: match the user's description to the closest group and use its ID.
5. For goal_amount: convert dollar amounts to cents (e.g. $500 → 50000).
6. Do NOT make up values. Only extract what the user explicitly says.
7. Do NOT write copy, taglines, or marketing content. Just collect the factual details.
8. If all required fields are collected, continue asking about any remaining optional fields (description, requires_business_info) one at a time. The user can answer or say "skip". Once ALL fields have been addressed, confirm the campaign is ready to create.
9. Keep responses short and focused — no more than 2-3 sentences.
10. When the next missing field is "campaign_type_id" or "group_id", keep your question VERY brief (e.g. "What type of campaign is this?" or "Which team is this for?"). The UI will show selectable buttons — do NOT list the options in your text.
11. When you match a campaign type from the user's description, CONFIRM it explicitly in your response (e.g. "Great, I'll set this up as a **Merchandise Sale**.") before moving to the next field. Never silently set the campaign type.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { messages, collectedFields, campaignTypes, groups, activeGroupId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const types: { id: string; name: string }[] = campaignTypes || [];
    const grps: { id: string; group_name: string }[] = groups || [];
    let updatedFields: Record<string, any> = { ...(collectedFields || {}) };

    // Auto-fill group if activeGroupId provided, or if only one exists
    let autoFilledGroupName: string | null = null;
    if (!updatedFields.group_id && activeGroupId && grps.find((g: any) => g.id === activeGroupId)) {
      updatedFields.group_id = activeGroupId;
      autoFilledGroupName = grps.find((g: any) => g.id === activeGroupId)!.group_name;
    } else if (!updatedFields.group_id && grps.length === 1) {
      updatedFields.group_id = grps[0].id;
      autoFilledGroupName = grps[0].group_name;
    }

    const systemPrompt = buildSystemPrompt(types, grps, updatedFields, autoFilledGroupName);

    const tools = [
      {
        type: "function",
        function: {
          name: "update_campaign_fields",
          description:
            "Update one or more campaign fields based on what the user just said. Only include fields that the user explicitly provided values for.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Campaign name" },
              campaign_type_id: { type: "string", description: "Campaign type UUID" },
              group_id: { type: "string", description: "Group UUID" },
              description: { type: "string", description: "Campaign description" },
              goal_amount: { type: "number", description: "Goal amount in cents" },
              start_date: { type: "string", description: "Start date YYYY-MM-DD" },
              end_date: { type: "string", description: "End date YYYY-MM-DD" },
              requires_business_info: { type: "boolean", description: "Collect business info at checkout" },
            },
            additionalProperties: false,
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in your Lovable workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    if (!choice) {
      throw new Error("No response from AI");
    }

    let assistantMessage = choice.message?.content || "";

    // Process tool calls if any
    if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.function?.name === "update_campaign_fields") {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            for (const [key, value] of Object.entries(args)) {
              if (value !== undefined && value !== null && value !== "") {
                updatedFields[key] = value;
              }
            }
          } catch (e) {
            console.error("Failed to parse tool call arguments:", e);
          }
        }
      }

      // If there was a tool call but no text content, make a follow-up call
      if (!assistantMessage) {
        const followUpMessages = [
          { role: "system", content: systemPrompt },
          ...messages,
          choice.message,
          ...choice.message.tool_calls.map((tc: any) => ({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({ success: true, updatedFields }),
          })),
        ];

        const followUp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: followUpMessages,
          }),
        });

        if (followUp.ok) {
          const followUpData = await followUp.json();
          assistantMessage = followUpData.choices?.[0]?.message?.content || "Got it! What else would you like to add?";
        } else {
          assistantMessage = "Got it! What else would you like to add?";
        }
      }
    }

    // Server-side readiness computation
    const missingRequired = REQUIRED_KEYS.filter(
      (k) => !updatedFields[k] || updatedFields[k] === ""
    );
    const readyToCreate = missingRequired.length === 0;

    // Build suggestions for the next missing select field
    let suggestions: { field: string; label: string; options: { label: string; value: string }[] } | null = null;
    const nextMissing = missingRequired[0];
    if (nextMissing === "campaign_type_id" && types.length > 0) {
      suggestions = {
        field: "campaign_type_id",
        label: "Campaign type",
        options: types.map((t) => ({ label: t.name, value: t.id })),
      };
    } else if (nextMissing === "group_id" && grps.length > 1) {
      suggestions = {
        field: "group_id",
        label: "Group",
        options: grps.map((g) => ({ label: g.group_name, value: g.id })),
      };
    }

    return new Response(
      JSON.stringify({
        assistantMessage,
        updatedFields,
        missingRequired,
        readyToCreate,
        suggestions,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-campaign-builder error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
