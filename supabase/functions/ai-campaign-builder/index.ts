import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REQUIRED_FACTUAL_KEYS = ["name", "campaign_type_id", "group_id", "goal_amount", "start_date", "end_date"];
// requires_business_info is a boolean, so we gate on its *presence* (answered) rather than truthiness.
const REQUIRED_KEYS = REQUIRED_FACTUAL_KEYS;

// Every field the AI should walk through, in the order to ask. `required: false`
// means the user can skip without blocking save — NOT that the AI may silently omit it.
const ASK_ORDER = [
  "name",
  "campaign_type_id",
  "group_id",
  "goal_amount",
  "start_date",
  "end_date",
  "description",
  "requires_business_info",
];

function isFieldAnswered(key: string, collected: Record<string, any>): boolean {
  if (collected[`${key}_skipped`] === true) return true;
  const v = collected[key];
  if (key === "requires_business_info") return v !== undefined && v !== null;
  return v !== undefined && v !== null && v !== "";
}

function getStillToAskAbout(collected: Record<string, any>): string[] {
  return ASK_ORDER.filter((k) => !isFieldAnswered(k, collected));
}

const SKIP_WORDS = new Set([
  "skip", "skip it", "no", "no thanks", "no thank you", "none", "nope",
  "n/a", "na", "not now", "later", "pass",
]);

function isSkipMessage(text: string): boolean {
  return SKIP_WORDS.has(text.trim().toLowerCase().replace(/[.!?]+$/, ""));
}

// Heuristic: figure out which un-asked optional field the assistant most likely
// just asked about, so we can apply a "skip" deterministically.
function detectFieldFromAssistantText(text: string): string | null {
  const t = text.toLowerCase();
  if (/description/.test(t)) return "description";
  if (/sponsor.*(info|asset|provide)|requires_business_info|business info/.test(t)) return "requires_business_info";
  return null;
}

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

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
    return null;
  }
  return `${y}-${pad(m)}-${pad(d)}`;
}

function inferYear(month: number, day: number, today: Date): number {
  const curYear = today.getUTCFullYear();
  const candidate = new Date(Date.UTC(curYear, month - 1, day));
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return candidate.getTime() < todayUtc.getTime() ? curYear + 1 : curYear;
}

function normalizeDate(input: any, today: Date = new Date()): string | null {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  let m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return buildIso(+m[1], +m[2], +m[3]);

  m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let y = +m[3];
    if (y < 100) y += 2000;
    return buildIso(y, +m[1], +m[2]);
  }

  m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (m) {
    const mo = +m[1], d = +m[2];
    const y = inferYear(mo, d, today);
    return buildIso(y, mo, d);
  }

  const cleaned = raw.toLowerCase().replace(/(\d+)(st|nd|rd|th)/g, "$1").replace(/,/g, " ");
  const parts = cleaned.split(/\s+/).filter(Boolean);

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
  { key: "requires_business_info", label: "Sponsors Provide Info/Assets", type: "boolean", required: true, aiDescription: "Whether sponsors must provide information or assets to participate (e.g. a logo for a banner/shirt, a website link for social media recognition)." },
];

function buildSystemPrompt(
  campaignTypes: { id: string; name: string }[],
  groups: { id: string; group_name: string }[],
  collectedFields: Record<string, any>,
  autoFilledGroupName: string | null,
  todayIso: string,
  campaignId: string | null,
  rosters: { id: number; roster_year: number; current_roster: boolean }[],
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

  const stillToAsk = getStillToAskAbout(collectedFields);
  const stillToAskList = stillToAsk.length > 0
    ? stillToAsk.map((k) => {
        const def = FIELD_DEFS.find((f) => f.key === k);
        const tag = def?.required ? "REQUIRED" : "optional — user may skip";
        return `  - ${k} (${tag})`;
      }).join("\n")
    : "  (every field has a value or has been skipped — ready to save!)";

  const autoFillNote = autoFilledGroupName
    ? `\n## Auto-Selected Group\nThe organization only has one group, so it has been auto-selected: "${autoFilledGroupName}". Briefly confirm this in your next message (e.g. "Got it — this is for ${autoFilledGroupName}.") and move on to the next missing field.\n`
    : "";

  // POST-DRAFT MODE
  if (campaignId) {
    const hasImage = !!collectedFields.image_url;
    const rosterAttrAddressed = collectedFields.enable_roster_attribution !== undefined;
    const singleRoster = rosters.length === 1 ? rosters[0] : null;
    // If there's only one roster, auto-pick it as soon as attribution is enabled (no need to ask).
    const rosterPicked =
      !collectedFields.enable_roster_attribution ||
      !!collectedFields.roster_id ||
      rosters.length === 0 ||
      !!singleRoster;
    const directionsAddressed = collectedFields.group_directions_addressed === true;

    const rostersList = rosters.length > 0
      ? rosters.map((r) => `  - "${r.roster_year}${r.current_roster ? " (Current)" : ""}" → id: ${r.id}`).join("\n")
      : "  (no rosters available for this group)";

    let nextStep: string;
    if (!hasImage && !collectedFields.image_skipped) {
      nextStep = `**Next step: campaign image.** Briefly ask if the user wants to upload a campaign image (a hero photo for the campaign page). Keep it to one short sentence — the UI shows an upload widget below your message. Do NOT call any tool for this step yet; the upload widget will report back when done or skipped.`;
    } else if (!rosterAttrAddressed) {
      if (rosters.length === 0) {
        nextStep = `**Next step: skip roster attribution.** This group has no rosters, so individual member tracking isn't available. Briefly let the user know and call update_campaign_fields with enable_roster_attribution=false to move on.`;
      } else if (singleRoster) {
        nextStep = `**Next step: roster attribution.** Roster attribution gives each roster member an individual fundraising goal and a personalized URL so they can track their own contributions to the campaign. This group has exactly one roster: **${singleRoster.roster_year}${singleRoster.current_roster ? " (Current)" : ""}** (id: ${singleRoster.id}). Ask in one short sentence: "Want to enable individual goals and personalized URLs for each roster member?" The UI will show Yes/No buttons. If they say yes, call update_campaign_fields with BOTH enable_roster_attribution=true AND roster_id=${singleRoster.id} in the same tool call — do NOT ask them to pick a roster.`;
      } else {
        nextStep = `**Next step: roster attribution.** Roster attribution gives each roster member an individual fundraising goal and a personalized URL so they can track their own contributions to the campaign. Ask in one short sentence: "Want to enable individual goals and personalized URLs for each roster member?" The UI will show Yes/No buttons.`;
      }
    } else if (collectedFields.enable_roster_attribution && !rosterPicked) {
      nextStep = `**Next step: pick a roster.** Ask which roster to use for attribution. The UI will show the available rosters as numbered buttons. Available rosters:\n${rostersList}`;
    } else if (!directionsAddressed) {
      nextStep = `**Next step: participant directions.** Ask if they'd like to add internal-only instructions for their team (e.g., "Each player should sell 10 items by Nov 15"). One short sentence. They can type directions or say "skip". When they reply, call the update_campaign_fields tool with group_directions (or set group_directions_addressed=true if skipped).`;
    } else {
      nextStep = `**All done!** Confirm everything is set up and let the user know they can open the campaign editor to add items, customize the pitch, and publish. Do NOT call any tool. Be brief and celebratory.`;
    }

    return `You are a campaign creation assistant for Sponsorly. The user just created a draft campaign and you're now helping them fill in a few more details.

Today is **${todayIso}**.

## Saved Draft
${alreadyCollected}

## Available Rosters (for the campaign's group)
${rostersList}

## Post-Draft Tool
Use the "update_campaign_fields" tool to record:
- image_url (string): set when user uploads an image (the UI handles the upload and sends a synthetic message — you parse the URL from it)
- image_skipped (boolean): set to true if user skips image
- enable_roster_attribution (boolean): true/false based on user's answer
- roster_id (number): the roster id when they pick one
- group_directions (string): the participant directions text
- group_directions_addressed (boolean): set to true when they answer (even if skipping)

## Current Step
${nextStep}

## Rules
- Ask ONE thing at a time. Keep messages to 1 short sentence.
- Do NOT list options as text when the UI will show buttons.
- When the user provides a value, IMMEDIATELY call update_campaign_fields with it, then briefly confirm.
- Never re-ask about a step that's already been addressed (look at "Saved Draft" above).`;
  }

  // PRE-DRAFT MODE (collecting required fields)
  return `You are a campaign creation assistant for Sponsorly, a fundraising platform for schools and nonprofits.

Today's date is **${todayIso}**. Use this when interpreting relative dates ("next Friday", "in 2 weeks") or inferring missing years.

Your job is to help the user set up a new fundraising campaign by collecting the required information through natural conversation.

## Available Campaign Types
${typesList}

## Available Groups
${groupsList}

## Campaign Fields
${fieldDescriptions}

## Already Collected
${alreadyCollected}

## Still Missing (Required — must be answered before save)
${missingList}

## Still To Ask About (every field — required OR optional — that hasn't been answered or skipped)
${stillToAskList}
${autoFillNote}
## Rules
1. Ask about ONE field at a time, in the order shown in "## Still To Ask About". Be conversational and brief (1-2 sentences).
2. When the user provides information, call the "update_campaign_fields" tool with the extracted values.
3. For campaign_type_id: match the user's description to the closest campaign type and use its ID.
4. For group_id: match the user's description to the closest group and use its ID.
5. For goal_amount: convert dollar amounts to cents (e.g. $500 → 50000).
6. For start_date and end_date: accept ANY natural format the user provides — "May 1", "5/1", "5/1/2026", "next Friday", "May 1st", "in 2 weeks", etc. ALWAYS interpret M/D or M/D/YYYY as US-style **month/day/year**. If the user omits the year, assume the current year (${todayIso.slice(0, 4)}) — but if that date has already passed, roll forward to next year. ALWAYS pass the date to the tool in **YYYY-MM-DD** format. After setting a date, briefly confirm it back in friendly format (e.g. "Got it — starting **May 1, 2026**.").
7. Do NOT make up values. Only extract what the user explicitly says.
8. Do NOT write copy, taglines, or marketing content. Just collect the factual details.
9. **Walk through every field in "## Still To Ask About" — never skip one.** For each field:
   - If it's REQUIRED, the user must answer (no skipping).
   - If it's optional, tell them they can say "skip" if they don't want to provide it.
   - For **description**, ask something like: "Want to add a short description of the campaign? You can say skip." (free text — no buttons)
   - For **requires_business_info**, ask: "Will sponsors need to provide information or assets to participate? (e.g. a logo for a banner/shirt, a website link for social media recognition)" — the UI will show Yes/No buttons. Set it via update_campaign_fields based on their answer. **Do NOT combine this question with the "save as draft" confirmation.**
10. Only AFTER "## Still To Ask About" is empty (every field answered or skipped), in a SEPARATE follow-up turn, ask ONE short confirmation: "Ready to save this as a draft?" — the UI will show Yes/No buttons. When the user confirms (yes / ok / sure / save / create / go / sounds good / let's do it), IMMEDIATELY call the **create_campaign_draft** tool. Do NOT just acknowledge — you MUST call the tool to actually create the draft. After the tool runs, the conversation continues into post-draft setup automatically.
11. Keep responses short and focused — no more than 2-3 sentences.
12. When the next missing field is "campaign_type_id" or "group_id", keep your question VERY brief (e.g. "What type of campaign is this?" or "Which team is this for?"). The UI will show selectable buttons — do NOT list the options in your text.
13. When the user picks or describes a campaign type, you MUST call **update_campaign_fields** with the matching campaign_type_id in the SAME response where you confirm the choice (e.g. "Great, I'll set this up as a **Merchandise Sale**."). The same applies to group selection — call update_campaign_fields with group_id in the same turn. Do NOT just acknowledge in text — the tool call is REQUIRED to record the selection. If you skip the tool call, the field will not be saved and the user will be re-asked.
14. **NEVER invent, guess, or fabricate UUIDs.** ONLY use IDs that appear verbatim in the "## Available Groups" and "## Available Campaign Types" lists above. If the user has not yet specified a group or campaign type, leave that field empty and ask them — do NOT fill the slot with a placeholder UUID, a made-up ID, or any value not in the lists. Setting only one field per tool call is fine; do not pad the call with guessed values for other fields.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { messages, collectedFields, campaignTypes, groups, activeGroupId, campaignId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const types: { id: string; name: string }[] = campaignTypes || [];
    const grps: { id: string; group_name: string }[] = groups || [];
    let updatedFields: Record<string, any> = { ...(collectedFields || {}) };

    let autoFilledGroupName: string | null = null;
    if (!updatedFields.group_id && activeGroupId && grps.find((g: any) => g.id === activeGroupId)) {
      updatedFields.group_id = activeGroupId;
      autoFilledGroupName = grps.find((g: any) => g.id === activeGroupId)!.group_name;
    } else if (!updatedFields.group_id && grps.length === 1) {
      updatedFields.group_id = grps[0].id;
      autoFilledGroupName = grps[0].group_name;
    }

    // Server-side deterministic mapping: if the user's last message exactly matches
    // a campaign type name or group name, record it directly. This is a safety net
    // for when the model acknowledges the choice in text but forgets the tool call.
    const lastUserMsg = [...messages]
      .reverse()
      .find((m: any) => m.role === "user")
      ?.content?.trim()
      .toLowerCase();
    if (lastUserMsg) {
      if (!updatedFields.campaign_type_id) {
        const matchedType = types.find((t) => t.name.toLowerCase() === lastUserMsg);
        if (matchedType) updatedFields.campaign_type_id = matchedType.id;
      }
      if (!updatedFields.group_id) {
        const matchedGroup = grps.find((g) => g.group_name.toLowerCase() === lastUserMsg);
        if (matchedGroup) updatedFields.group_id = matchedGroup.id;
      }
    }

    // Deterministic "skip" handling for optional fields (pre-draft only).
    // If the latest user message is a skip-word AND the previous assistant message
    // asked about a known optional field, mark it as skipped server-side so the
    // AI can move on without looping or silently dropping the field.
    if (!campaignId && lastUserMsg && isSkipMessage(lastUserMsg)) {
      const lastAssistantMsg = [...messages]
        .reverse()
        .find((m: any) => m.role === "assistant")
        ?.content as string | undefined;
      if (lastAssistantMsg) {
        const askedField = detectFieldFromAssistantText(lastAssistantMsg);
        // Only auto-skip optional fields. Required fields can't be skipped.
        if (askedField) {
          const def = FIELD_DEFS.find((f) => f.key === askedField);
          if (def && !def.required) {
            updatedFields[`${askedField}_skipped`] = true;
          }
        }
      }
    }
    let rosters: { id: number; roster_year: number; current_roster: boolean }[] = [];
    if (campaignId && updatedFields.group_id) {
      const { data: rData } = await adminSb
        .from("rosters")
        .select("id, roster_year, current_roster")
        .eq("group_id", updatedFields.group_id)
        .order("roster_year", { ascending: false });
      rosters = rData || [];
    }

    const today = new Date();
    const todayIso = `${today.getUTCFullYear()}-${pad(today.getUTCMonth() + 1)}-${pad(today.getUTCDate())}`;
    const systemPrompt = buildSystemPrompt(types, grps, updatedFields, autoFilledGroupName, todayIso, campaignId || null, rosters);

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
              name: { type: "string" },
              campaign_type_id: { type: "string" },
              group_id: { type: "string" },
              description: { type: "string" },
              goal_amount: { type: "number" },
              start_date: { type: "string" },
              end_date: { type: "string" },
              requires_business_info: { type: "boolean" },
              // Post-draft fields:
              image_url: { type: "string", description: "URL of uploaded campaign image" },
              image_skipped: { type: "boolean", description: "True if user chose to skip image upload" },
              enable_roster_attribution: { type: "boolean" },
              roster_id: { type: "number" },
              group_directions: { type: "string" },
              group_directions_addressed: { type: "boolean", description: "True once the user has answered the directions question (even if skipped)" },
            },
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_campaign_draft",
          description:
            "Create the campaign draft in the database. Call this ONLY after all required fields are collected AND the user has explicitly confirmed they want to save the draft (e.g. said yes/ok/save/create). Do not call before user confirmation.",
          parameters: { type: "object", properties: {}, additionalProperties: false },
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
    if (!choice) throw new Error("No response from AI");

    let assistantMessage = choice.message?.content || "";
    const persistFields: Record<string, any> = {};
    let createdCampaignId: string | null = null;
    let createDraftError: string | null = null;
    const toolResults: { id: string; content: string }[] = [];

    if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.function?.name === "update_campaign_fields") {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            for (const [key, value] of Object.entries(args)) {
              if (value === undefined || value === null || value === "") continue;

              if (key === "start_date" || key === "end_date") {
                const normalized = normalizeDate(value, today);
                if (!normalized) {
                  console.warn(`Could not normalize ${key}:`, value);
                  continue;
                }
                updatedFields[key] = normalized;
                persistFields[key] = normalized;
              } else {
                updatedFields[key] = value;
                persistFields[key] = value;
              }
            }
            // Drop hallucinated UUIDs that don't match any known group/type
            if (updatedFields.group_id && !grps.find((g) => g.id === updatedFields.group_id)) {
              console.warn("Dropping invalid group_id from tool call:", updatedFields.group_id);
              delete updatedFields.group_id;
              delete persistFields.group_id;
            }
            if (updatedFields.campaign_type_id && !types.find((t) => t.id === updatedFields.campaign_type_id)) {
              console.warn("Dropping invalid campaign_type_id from tool call:", updatedFields.campaign_type_id);
              delete updatedFields.campaign_type_id;
              delete persistFields.campaign_type_id;
            }
            toolResults.push({ id: toolCall.id, content: JSON.stringify({ success: true, updatedFields }) });
          } catch (e) {
            console.error("Failed to parse tool call arguments:", e);
            toolResults.push({ id: toolCall.id, content: JSON.stringify({ success: false, error: "parse_error" }) });
          }
        } else if (toolCall.function?.name === "create_campaign_draft" && !campaignId) {
          // Defensive guard: ensure group_id and campaign_type_id reference real records
          if (!grps.find((g) => g.id === updatedFields.group_id)) {
            createDraftError = "The selected group is invalid. Please pick a group from the list before saving.";
            delete updatedFields.group_id;
            toolResults.push({ id: toolCall.id, content: JSON.stringify({ success: false, error: createDraftError }) });
          } else if (!types.find((t) => t.id === updatedFields.campaign_type_id)) {
            createDraftError = "The selected campaign type is invalid. Please pick a campaign type from the list before saving.";
            delete updatedFields.campaign_type_id;
            toolResults.push({ id: toolCall.id, content: JSON.stringify({ success: false, error: createDraftError }) });
          } else {
          // Validate required fields are present before attempting insert
          const missingNow = REQUIRED_KEYS.filter((k) => !updatedFields[k] || updatedFields[k] === "");
          if (missingNow.length > 0) {
            createDraftError = `Missing required fields: ${missingNow.join(", ")}`;
            toolResults.push({ id: toolCall.id, content: JSON.stringify({ success: false, error: createDraftError }) });
          } else {
            const insertData: Record<string, any> = {
              name: updatedFields.name,
              campaign_type_id: updatedFields.campaign_type_id,
              group_id: updatedFields.group_id,
              goal_amount: updatedFields.goal_amount,
              start_date: updatedFields.start_date,
              end_date: updatedFields.end_date,
              status: false,
              publication_status: "draft",
            };
            if (updatedFields.description) insertData.description = updatedFields.description;
            if (updatedFields.requires_business_info !== undefined) {
              insertData.requires_business_info = updatedFields.requires_business_info;
            }

            const { data: newCampaign, error: insertErr } = await adminSb
              .from("campaigns")
              .insert(insertData)
              .select("id")
              .single();

            if (insertErr) {
              console.error("create_campaign_draft insert error:", insertErr);
              if (insertErr.message?.includes("slug") || insertErr.code === "23505") {
                createDraftError = "A campaign with a similar name already exists. Try a slightly different name.";
              } else {
                createDraftError = insertErr.message || "Failed to create draft.";
              }
              toolResults.push({ id: toolCall.id, content: JSON.stringify({ success: false, error: createDraftError }) });
            } else {
              createdCampaignId = newCampaign.id;
              toolResults.push({ id: toolCall.id, content: JSON.stringify({ success: true, campaignId: createdCampaignId }) });
            }
          }
          }
        } else {
          toolResults.push({ id: toolCall.id, content: JSON.stringify({ success: false, error: "unknown_tool" }) });
        }
      }

      if (updatedFields.start_date && updatedFields.end_date && updatedFields.end_date < updatedFields.start_date) {
        console.warn("end_date before start_date; dropping end_date");
        delete updatedFields.end_date;
        delete persistFields.end_date;
      }

      // POST-DRAFT: persist directly to the campaigns row
      if (campaignId) {
        const dbUpdate: Record<string, any> = {};
        if (persistFields.image_url) dbUpdate.image_url = persistFields.image_url;
        if (persistFields.enable_roster_attribution !== undefined) dbUpdate.enable_roster_attribution = persistFields.enable_roster_attribution;
        if (persistFields.roster_id !== undefined) dbUpdate.roster_id = persistFields.roster_id;
        if (persistFields.group_directions !== undefined) dbUpdate.group_directions = persistFields.group_directions;

        if (Object.keys(dbUpdate).length > 0) {
          const { error: updErr } = await adminSb.from("campaigns").update(dbUpdate).eq("id", campaignId);
          if (updErr) console.error("Failed to persist post-draft fields:", updErr);
        }

        // If roster attribution was enabled and a roster picked, generate links
        if (persistFields.enable_roster_attribution === true && updatedFields.roster_id) {
          try {
            await adminSb.functions.invoke("generate-roster-member-links", {
              body: { campaignId, rosterId: Number(updatedFields.roster_id) },
            });
          } catch (e) {
            console.error("Failed to generate roster member links:", e);
          }
        }
      }

      // Force a follow-up when draft was just created (so AI starts post-draft convo)
      // OR when there's no assistant text yet
      const needsFollowUp = !assistantMessage || createdCampaignId !== null || createDraftError !== null;

      if (needsFollowUp) {
        // If we just created the draft, fetch rosters and rebuild the prompt in post-draft mode
        let followUpSystemPrompt = systemPrompt;
        if (createdCampaignId) {
          const { data: rData } = await adminSb
            .from("rosters")
            .select("id, roster_year, current_roster")
            .eq("group_id", updatedFields.group_id)
            .order("roster_year", { ascending: false });
          rosters = rData || [];
          followUpSystemPrompt = buildSystemPrompt(types, grps, updatedFields, autoFilledGroupName, todayIso, createdCampaignId, rosters);
        }

        const followUpMessages = [
          { role: "system", content: followUpSystemPrompt },
          ...messages,
          choice.message,
          ...toolResults.map((tr) => ({
            role: "tool",
            tool_call_id: tr.id,
            content: tr.content,
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
          const followUpText = followUpData.choices?.[0]?.message?.content;
          if (followUpText) assistantMessage = followUpText;
        }
        if (!assistantMessage) {
          if (createDraftError) {
            assistantMessage = createDraftError;
          } else if (createdCampaignId) {
            assistantMessage = "Draft saved! 🎉 Would you like to upload a campaign image?";
          } else {
            assistantMessage = "Got it!";
          }
        }
      }
    }

    // If a draft was just created in this turn, treat it as the active campaign for phase/suggestions
    const effectiveCampaignId = campaignId || createdCampaignId;

    // Compute readiness + phase
    const missingRequired = REQUIRED_KEYS.filter(
      (k) => !updatedFields[k] || updatedFields[k] === ""
    );
    const businessInfoAnswered = updatedFields.requires_business_info !== undefined;
    const readyToCreate = missingRequired.length === 0 && businessInfoAnswered;

    let phase: "collecting" | "ready_to_create" | "post_draft" | "complete" = "collecting";
    if (effectiveCampaignId) {
      const imageDone = !!updatedFields.image_url || !!updatedFields.image_skipped;
      const rosterDone = updatedFields.enable_roster_attribution !== undefined &&
        (!updatedFields.enable_roster_attribution || !!updatedFields.roster_id || rosters.length === 0);
      const directionsDone = updatedFields.group_directions_addressed === true;
      phase = imageDone && rosterDone && directionsDone ? "complete" : "post_draft";
    } else if (readyToCreate) {
      phase = "ready_to_create";
    }

    // Build suggestions for next step
    let suggestions:
      | { type?: string; field: string; label: string; options: { label: string; value: string }[] }
      | null = null;

    if (effectiveCampaignId) {
      const imageDone = !!updatedFields.image_url || !!updatedFields.image_skipped;
      const rosterAttrAddressed = updatedFields.enable_roster_attribution !== undefined;
      const rosterPicked = !updatedFields.enable_roster_attribution || !!updatedFields.roster_id || rosters.length === 0;
      const directionsDone = updatedFields.group_directions_addressed === true;

      if (!imageDone) {
        suggestions = {
          type: "image_upload",
          field: "image_url",
          label: "Campaign image",
          options: [],
        };
      } else if (!rosterAttrAddressed) {
        suggestions = {
          type: "choice",
          field: "enable_roster_attribution",
          label: "Enable roster attribution?",
          options: [
            { label: "Yes, enable individual goals & URLs", value: "true" },
            { label: "No, skip this", value: "false" },
          ],
        };
      } else if (updatedFields.enable_roster_attribution && !rosterPicked && rosters.length > 0) {
        suggestions = {
          type: "choice",
          field: "roster_id",
          label: "Select roster",
          options: rosters.map((r) => ({
            label: `${r.roster_year}${r.current_roster ? " (Current)" : ""}`,
            value: r.id.toString(),
          })),
        };
      } else if (!directionsDone) {
        suggestions = {
          type: "choice",
          field: "group_directions",
          label: "Participant directions",
          options: [{ label: "Skip — no directions", value: "skip" }],
        };
      }
    } else if (phase === "ready_to_create") {
      suggestions = {
        type: "choice",
        field: "confirm_create_draft",
        label: "Save as draft?",
        options: [
          { label: "Yes, save as draft", value: "yes" },
          { label: "Not yet, let me change something", value: "no" },
        ],
      };
    } else {
      const nextMissing = missingRequired[0];
      if (nextMissing === "campaign_type_id" && types.length > 0) {
        suggestions = {
          type: "choice",
          field: "campaign_type_id",
          label: "Campaign type",
          options: types.map((t) => ({ label: t.name, value: t.id })),
        };
      } else if (nextMissing === "group_id" && grps.length > 1) {
        suggestions = {
          type: "choice",
          field: "group_id",
          label: "Group",
          options: grps.map((g) => ({ label: g.group_name, value: g.id })),
        };
      } else if (!nextMissing && !businessInfoAnswered) {
        // All factual fields collected, but the sponsor-info question hasn't been answered yet.
        suggestions = {
          type: "choice",
          field: "requires_business_info",
          label: "Will sponsors provide info/assets to participate?",
          options: [
            { label: "Yes, sponsors must provide info", value: "true" },
            { label: "No, not required", value: "false" },
          ],
        };
      }
    }

    return new Response(
      JSON.stringify({
        assistantMessage,
        updatedFields,
        missingRequired,
        readyToCreate,
        phase,
        suggestions,
        createdCampaignId,
        createDraftError,
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
