import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REQUIRED_FACTUAL_KEYS = ["name", "campaign_type_id", "group_id", "goal_amount", "start_date", "end_date"];
// requires_business_info is a boolean, so we gate on its *presence* (answered) rather than truthiness.
const REQUIRED_KEYS = REQUIRED_FACTUAL_KEYS;

// =====================================================================
// Campaign Item field definitions (mirrors src/lib/ai/campaignSchema.ts)
// =====================================================================
interface ItemFieldDef {
  key: string;
  label: string;
  prompt: string;
  type: "string" | "longtext" | "number" | "boolean" | "choice";
  required: boolean;
  options?: { label: string; value: string }[];
  dependsOn?: { key: string; equals: any };
}

const ITEM_FIELDS: ItemFieldDef[] = [
  { key: "name", label: "Name", prompt: "What's the name of your {ordinal} {itemNoun}? ({examples})", type: "string", required: true },
  { key: "cost", label: "Price (dollars)", prompt: "How much does it cost? (in dollars, e.g. 25)", type: "number", required: true },
  { key: "quantity_offered", label: "Quantity offered", prompt: "How many are you offering in total?", type: "number", required: true },
  { key: "image", label: "Image", prompt: "Want to upload an image for this {itemNoun}? You can also skip.", type: "string", required: false },
  { key: "description", label: "Description", prompt: "Add a short description, or say skip.", type: "longtext", required: false },
  { key: "max_items_purchased", label: "Limit per buyer", prompt: "Limit per buyer? (a number, or skip for no limit)", type: "number", required: false },
  { key: "size", label: "Size / tier label", prompt: "Any size or tier label? (e.g. 'Large', 'Gold tier' — skip if none)", type: "string", required: false },
  { key: "is_recurring", label: "Recurring", prompt: "Should this be a recurring charge?", type: "boolean", required: false },
  { key: "recurring_interval", label: "Recurring interval", prompt: "How often should it recur?", type: "choice", required: false, options: [{ label: "Monthly", value: "month" }, { label: "Yearly", value: "year" }], dependsOn: { key: "is_recurring", equals: true } },
];

function itemNounForType(typeName?: string | null): string {
  const t = (typeName || "").toLowerCase();
  if (t.includes("sponsor")) return "sponsorship item";
  if (t.includes("merch")) return "item";
  if (t.includes("event")) return "ticket";
  if (t.includes("donation")) return "donation tier";
  return "item";
}

function itemExamplesForType(typeName?: string | null): string {
  const t = (typeName || "").toLowerCase();
  if (t.includes("sponsor")) return "e.g. Large Banner, Event Sponsor, Platinum Sponsor";
  if (t.includes("merch")) return "e.g. T-Shirt, Hoodie, Mug";
  if (t.includes("event")) return "e.g. General Admission, VIP Ticket, Table for 8";
  if (t.includes("donation")) return "e.g. Friend, Supporter, Champion";
  return "e.g. Item Name";
}

function isItemFieldAnswered(key: string, draft: Record<string, any>): boolean {
  if (draft[`${key}_skipped`] === true) return true;
  const v = draft[key];
  if (key === "is_recurring") return v !== undefined && v !== null;
  return v !== undefined && v !== null && v !== "";
}

function getNextItemField(draft: Record<string, any>): ItemFieldDef | null {
  for (const f of ITEM_FIELDS) {
    if (f.dependsOn) {
      const depVal = draft[f.dependsOn.key];
      if (depVal !== f.dependsOn.equals) continue;
    }
    if (!isItemFieldAnswered(f.key, draft)) return f;
  }
  return null;
}

function isItemReadyToSave(draft: Record<string, any>): boolean {
  return ITEM_FIELDS.filter((f) => f.required).every((f) => isItemFieldAnswered(f.key, draft));
}

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
  "fee_model",
];

function isFieldAnswered(key: string, collected: Record<string, any>): boolean {
  if (collected[`${key}_skipped`] === true) return true;
  const v = collected[key];
  if (key === "requires_business_info") return v !== undefined && v !== null;
  return v !== undefined && v !== null && v !== "";
}

// Preset sponsor-asset templates the user can quickly add.
const SPONSOR_ASSET_PRESETS: Record<string, { asset_name: string; asset_description: string; file_types: string[]; dimensions_hint: string; max_file_size_mb: number }> = {
  logo: {
    asset_name: "Company Logo",
    asset_description: "Your company logo for recognition in campaign materials",
    file_types: ["image/png", "image/jpeg", "image/svg+xml"],
    dimensions_hint: "400x400px minimum, transparent background preferred",
    max_file_size_mb: 10,
  },
  banner: {
    asset_name: "Banner Ad",
    asset_description: "Banner advertisement for program materials",
    file_types: ["image/png", "image/jpeg"],
    dimensions_hint: "300x250px or 728x90px",
    max_file_size_mb: 10,
  },
  fullpage: {
    asset_name: "Full Page Ad",
    asset_description: "Full page advertisement for printed materials",
    file_types: ["application/pdf", "image/png", "image/jpeg"],
    dimensions_hint: "8.5x11 inches, 300 DPI minimum",
    max_file_size_mb: 10,
  },
  website: {
    asset_name: "Website URL",
    asset_description: "Link to your website for online recognition",
    file_types: [],
    dimensions_hint: "",
    max_file_size_mb: 1,
  },
};

// Match a free-text reply to one of the preset assets (or return null).
function matchAssetPreset(text: string): { key: string; preset: typeof SPONSOR_ASSET_PRESETS[string] } | null {
  const t = text.toLowerCase().trim();
  if (/\b(logo|company logo)\b/.test(t)) return { key: "logo", preset: SPONSOR_ASSET_PRESETS.logo };
  if (/\bbanner( ad)?\b/.test(t)) return { key: "banner", preset: SPONSOR_ASSET_PRESETS.banner };
  if (/\bfull[- ]?page( ad)?\b/.test(t)) return { key: "fullpage", preset: SPONSOR_ASSET_PRESETS.fullpage };
  if (/\b(website|url|link)\b/.test(t)) return { key: "website", preset: SPONSOR_ASSET_PRESETS.website };
  return null;
}

// Phrases that mean "I'm done adding assets".
function isDoneAssetsMessage(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[.!?]+$/, "");
  return /^(done|i'?m done|that'?s it|finished|finish|no more|nothing else|nope|no)$/.test(t);
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

// Heuristic: figure out which field the assistant most likely just asked about,
// so we can apply skips OR free-text answers deterministically.
function detectFieldFromAssistantText(text: string): string | null {
  const t = text.toLowerCase();
  // Order matters: more-specific patterns first.
  if (/fee model|platform fee|who covers .*fee|donor.*cover.*fee|absorb.*fee|cover the fee|fee_model/.test(t)) {
    return "fee_model";
  }
  if (/sponsor.*(info|asset|provide)|requires_business_info|business info|provide information or assets/.test(t)) {
    return "requires_business_info";
  }
  // Date detection — check end_date BEFORE start_date because "end" is more specific.
  if (/\bend date\b|when (do|does|should|will) .*(end|finish|close|wrap)|ending on|when .*\bend\b|campaign .*\bend\b|end of (the )?campaign/.test(t)) {
    return "end_date";
  }
  if (/\bstart date\b|when (do|does|should|will) .*(start|begin|kick off|launch)|starting on|when .*\bstart\b|campaign .*\bstart\b/.test(t)) {
    return "start_date";
  }
  if (/description|describe|short description|tell .* about the campaign/.test(t)) {
    return "description";
  }
  return null;
}

// Parse a yes/no-style user reply. Returns true/false or null if unclear.
function parseYesNo(text: string): boolean | null {
  const t = text.trim().toLowerCase().replace(/[.!?]+$/, "");
  if (/^(yes|yep|yeah|yup|sure|ok|okay|y|true|1|yes please|definitely|absolutely|sounds good)$/.test(t)) return true;
  if (/^(no|nope|nah|n|false|0|not really|don'?t|do not)$/.test(t)) return false;
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

  // "end of <month>" / "end of <month> <year>" → last day of that month
  const endOfMonth = cleaned.match(/^end of (?:the )?(\w+)(?:\s+(\d{2,4}))?$/);
  if (endOfMonth && MONTHS[endOfMonth[1]]) {
    const mo = MONTHS[endOfMonth[1]];
    let y: number;
    if (endOfMonth[2]) {
      y = endOfMonth[2].length === 2 ? 2000 + +endOfMonth[2] : +endOfMonth[2];
    } else {
      y = inferYear(mo, 28, today); // use 28 to safely infer year, then take last day
    }
    const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    return buildIso(y, mo, lastDay);
  }

  // "beginning of <month>" / "start of <month>" → first day
  const startOfMonth = cleaned.match(/^(?:beginning|start) of (?:the )?(\w+)(?:\s+(\d{2,4}))?$/);
  if (startOfMonth && MONTHS[startOfMonth[1]]) {
    const mo = MONTHS[startOfMonth[1]];
    let y: number;
    if (startOfMonth[2]) {
      y = startOfMonth[2].length === 2 ? 2000 + +startOfMonth[2] : +startOfMonth[2];
    } else {
      y = inferYear(mo, 1, today);
    }
    return buildIso(y, mo, 1);
  }

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

  // Just a month name → first day of that month
  if (parts.length === 1 && MONTHS[parts[0]]) {
    const mo = MONTHS[parts[0]];
    const y = inferYear(mo, 1, today);
    return buildIso(y, mo, 1);
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
  { key: "name", label: "Fundraiser Name", type: "string", required: true, aiDescription: "The name/title of the campaign." },
  { key: "campaign_type_id", label: "Fundraiser Type", type: "select", required: true, aiDescription: "The campaign type ID from the provided list." },
  { key: "group_id", label: "Group", type: "select", required: true, aiDescription: "The group ID from the provided list." },
  { key: "description", label: "Description", type: "string", required: false, aiDescription: "Brief description of the campaign." },
  { key: "goal_amount", label: "Goal Amount (dollars)", type: "number", required: true, aiDescription: "Fundraising goal in WHOLE DOLLARS (e.g. 10000 = $10,000.00). Do NOT convert to cents." },
  { key: "start_date", label: "Start Date", type: "date", required: true, aiDescription: "Start date in YYYY-MM-DD format." },
  { key: "end_date", label: "End Date", type: "date", required: true, aiDescription: "End date in YYYY-MM-DD format." },
  { key: "requires_business_info", label: "Sponsors Provide Info/Assets", type: "boolean", required: true, aiDescription: "Whether sponsors must provide information or assets to participate (e.g. a logo for a banner/shirt, a website link for social media recognition)." },
  { key: "fee_model", label: "Platform Fee Model", type: "select", required: true, aiDescription: "Who pays the 10% Sponsorly platform fee. Must be exactly 'donor_covers' (donor pays the fee on top of the item price) or 'org_absorbs' (organization absorbs the fee out of the item price the donor sees)." },
  // Pledge-only fields. Required for Pledge campaigns; ignored otherwise.
  { key: "pledge_unit_label", label: "Pledge Unit", type: "string", required: false, aiDescription: "Singular unit supporters pledge per (e.g. 'lap', 'mile', 'book'). REQUIRED for Pledge campaigns." },
  { key: "pledge_scope", label: "Pledge Scope", type: "select", required: false, aiDescription: "'team' = one shared total. 'participant' = each roster member tracked separately. REQUIRED for Pledge campaigns." },
  { key: "pledge_event_date", label: "Pledge Event Date", type: "date", required: false, aiDescription: "Date the activity happens (charging window opens this day). YYYY-MM-DD. REQUIRED for Pledge campaigns." },
  { key: "pledge_min_per_unit", label: "Min per Unit", type: "number", required: false, aiDescription: "Optional minimum dollar amount per unit (e.g. 0.25)." },
  { key: "pledge_suggested_unit_amounts", label: "Suggested per-Unit Amounts", type: "string", required: false, aiDescription: "Optional comma-separated suggested per-unit amounts (e.g. '0.5, 1, 2, 5')." },
  { key: "pledge_unit_label_plural", label: "Pledge Unit (plural)", type: "string", required: false, aiDescription: "Optional plural form of the pledge unit (e.g. 'laps' for 'lap')." },
  // Merchandise-only fields. Required for Merchandise campaigns; ignored otherwise.
  { key: "merch_ships_by_date", label: "Ships by Date", type: "date", required: false, aiDescription: "Optional ship-by date shown on the landing page and cart. YYYY-MM-DD." },
  { key: "merch_shipping_flat_rate", label: "Flat Shipping Rate (dollars)", type: "number", required: false, aiDescription: "Optional flat shipping rate in dollars. Skip to hide the shipping line." },
  { key: "merch_pickup_available", label: "Local Pickup Available", type: "boolean", required: false, aiDescription: "Whether donors can pick up locally instead of paying shipping. REQUIRED for Merchandise campaigns." },
  { key: "merch_pickup_note", label: "Pickup Instructions", type: "string", required: false, aiDescription: "Optional instructions shown when local pickup is enabled." },
  // Event-only fields. Required for Event campaigns; ignored otherwise.
  { key: "event_start_at", label: "Event Date & Start Time", type: "string", required: false, aiDescription: "ISO 8601 datetime (YYYY-MM-DDTHH:mm) for when the event happens. REQUIRED for Event campaigns." },
  { key: "event_location_name", label: "Location Name", type: "string", required: false, aiDescription: "Venue name (e.g. 'Pine Hills Golf Club'). REQUIRED for Event campaigns." },
  { key: "event_location_address", label: "Location Address", type: "string", required: false, aiDescription: "Optional street address of the venue." },
  { key: "event_format", label: "Event Format", type: "string", required: false, aiDescription: "Optional short format description (e.g. '4-person scramble')." },
  { key: "event_includes", label: "What's Included", type: "string", required: false, aiDescription: "Optional comma-separated inclusions (e.g. 'Cart, Lunch, Range balls'). Stored as an array." },
];

/** True when the resolved campaign type name is a Pledge fundraiser. */
function isPledgeTypeName(typeName?: string | null): boolean {
  return (typeName || "").toLowerCase().includes("pledge");
}

/** True when the resolved campaign type name is a Merchandise Sale. */
function isMerchandiseTypeName(typeName?: string | null): boolean {
  return (typeName || "").toLowerCase().includes("merch");
}

/** True when the resolved campaign type name is an Event fundraiser. */
function isEventTypeName(typeName?: string | null): boolean {
  return (typeName || "").toLowerCase().includes("event");
}

/** Pledge-specific post-draft fields the AI must collect, in order. */
function getPledgeStillToAsk(collected: Record<string, any>): string[] {
  const order = ["pledge_unit_label", "pledge_scope", "pledge_event_date"];
  return order.filter((k) => {
    const v = collected[k];
    return v === undefined || v === null || v === "";
  });
}

/** Merchandise-specific post-draft fields the AI walks the user through, in order. */
function getMerchStillToAsk(collected: Record<string, any>): string[] {
  const order = [
    "merch_ships_by_date",
    "merch_shipping_flat_rate",
    "merch_pickup_available",
    "merch_pickup_note",
  ];
  return order.filter((k) => {
    if (collected[`${k}_skipped`] === true) return false;
    if (k === "merch_pickup_note") {
      // Only ask for the note when pickup is enabled.
      if (collected.merch_pickup_available !== true) return false;
    }
    if (k === "merch_pickup_available") {
      const v = collected[k];
      return v === undefined || v === null;
    }
    const v = collected[k];
    return v === undefined || v === null || v === "";
  });
}

/** Event-specific post-draft fields the AI walks the user through, in order. */
function getEventStillToAsk(collected: Record<string, any>): string[] {
  const order = [
    "event_start_at",
    "event_location_name",
    "event_location_address",
    "event_format",
    "event_includes",
  ];
  return order.filter((k) => {
    if (collected[`${k}_skipped`] === true) return false;
    const v = collected[k];
    return v === undefined || v === null || v === "";
  });
}

/**
 * Agenda is collected as a separate item-style sub-flow AFTER the event fields
 * are done. Each row is { time, title, description? } and lives in
 * `campaigns.event_agenda` (jsonb array). State on `collectedFields`:
 *   - event_agenda: AgendaItem[] (mirror of db column, for prompt rendering)
 *   - event_agenda_addressed: boolean (user opted in OR skipped the whole step)
 *   - event_agenda_complete: boolean (user clicked Done OR skipped)
 *   - current_agenda_draft: { time?, title?, description?, description_skipped? }
 *   - awaiting_add_another_agenda: boolean
 */
interface AgendaItem { time?: string; title?: string; description?: string }
function getNextAgendaField(draft: Record<string, any>): "time" | "title" | "description" | null {
  if (!draft.time) return "time";
  if (!draft.title) return "title";
  if (draft.description === undefined && draft.description_skipped !== true) return "description";
  return null;
}
function isAgendaRowReady(draft: Record<string, any>): boolean {
  return !!(draft.time && draft.title);
}

function buildItemsSystemPrompt(
  campaignName: string,
  itemNoun: string,
  itemsAdded: number,
  currentItemDraft: Record<string, any>,
  awaitingAddAnother: boolean,
  todayIso: string,
  itemExamples: string = "e.g. Item Name",
): string {
  const draftSummary = Object.entries(currentItemDraft)
    .filter(([k, v]) => !k.endsWith("_skipped") && v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `  - ${k}: ${JSON.stringify(v)}`)
    .join("\n") || "  (nothing yet)";

  const nextField = getNextItemField(currentItemDraft);
  const ready = isItemReadyToSave(currentItemDraft);
  const ordinal = itemsAdded === 0 ? "first" : "next";

  let nextStep: string;
  if (awaitingAddAnother) {
    nextStep = `**Awaiting choice: add another or finish.** Your message must be exactly two paragraphs separated by a blank line:\n\n  Paragraph 1: confirm the last ${itemNoun} was saved (e.g. "Saved.").\n  Paragraph 2: ask "Want to add another ${itemNoun}, or are you done?" — the UI shows two buttons (Add another / I'm done). Do NOT call any tool.`;
  } else if (ready && nextField === null) {
    nextStep = `**All required fields collected.** IMMEDIATELY call the **save_campaign_item** tool with the values from "Current ${itemNoun} draft" below. Do NOT ask any more questions for this ${itemNoun}.`;
  } else if (nextField && nextField.key === "image") {
    nextStep = `**Next field: image** (optional). Briefly ask in one short sentence if they'd like to upload an image for this ${itemNoun} — the UI shows an upload widget below your message with a Skip button. Do NOT call any tool for this step; the upload widget will report back when done or skipped.`;
  } else if (nextField) {
    const promptText = nextField.prompt
      .replace(/\{itemNoun\}/g, itemNoun)
      .replace(/\{ordinal\}/g, ordinal)
      .replace(/\{examples\}/g, itemExamples);
    const skipNote = nextField.required ? "" : " The user may say **skip**.";
    nextStep = `**Next field: ${nextField.key}** (${nextField.required ? "REQUIRED" : "optional"}). Ask: "${promptText}"${skipNote}\n\nWhen the user answers, IMMEDIATELY call the **update_item_field** tool with the value (use the exact key \`${nextField.key}\`).\n\n**CRITICAL:** Ask every field in order, including optional ones. NEVER skip an optional field on the user's behalf — always ask so the user can choose to skip via the Skip button. Do not combine multiple field questions into one message.`;
  } else {
    nextStep = `Wait for user input.`;
  }

  return `You are a fundraiser creation assistant. The user just created the fundraiser **"${campaignName}"** and is now adding ${itemNoun}s to it.

Today is **${todayIso}**.

## About ${itemNoun}s
A "${itemNoun}" can be either a **sponsorship tier** (e.g. Platinum Sponsor, Gold tier) OR a **specific thing being sponsored** (e.g. Large Banner, Scoreboard Ad, Event Sponsor). Don't assume tiers — let the user define what works for their campaign. Examples to share when asking for the name: ${itemExamples}.

## Items added so far: ${itemsAdded}

## Current ${itemNoun} draft
${draftSummary}

## Tools
- **update_item_field**: record a single value the user just provided. Pass exactly one key from the item schema (\`name\`, \`description\`, \`cost\`, \`quantity_offered\`, \`max_items_purchased\`, \`size\`, \`is_recurring\`, \`recurring_interval\`) plus its value. Also accepts \`<key>_skipped: true\` to mark an optional field as skipped.
- **save_campaign_item**: insert the current draft into the database. Call ONLY when all required fields are filled.

## Current Step
${nextStep}

## Rules
- Ask ONE field at a time. Keep messages to 1 short sentence per question.
- For \`cost\`: the user types dollars (e.g. "25" or "$25"). Pass the dollar number (decimals OK) — stored as-is in dollars.
- For \`is_recurring\`: the UI shows Yes/No buttons. Pass true/false.
- Never make up values; only record what the user explicitly says.
- **Response format — every turn after user input MUST be TWO paragraphs separated by a blank line:**
  1. Acknowledgment paragraph (e.g. "Got it — $25.").
  2. Next question paragraph.

  Never combine acknowledgment and the next question into one sentence.
- **Never repeat your immediately previous question verbatim.** If the user's reply was unclear, briefly re-frame or ask a short clarifier — do not paste the same question again.`;
}

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

    // Sponsor-assets sub-flow state. Only relevant when requires_business_info === true.
    const sponsorAssetsRequired = collectedFields.requires_business_info === true;
    const sponsorAssetsPhase: string | null = collectedFields.sponsor_assets_phase || null;
    const sponsorDeadlineSet = !!collectedFields.asset_upload_deadline;
    const pendingAssets: any[] = Array.isArray(collectedFields.pending_required_assets)
      ? collectedFields.pending_required_assets
      : [];
    const sponsorAssetsComplete = collectedFields.sponsor_assets_complete === true ||
      sponsorAssetsPhase === "complete" ||
      !sponsorAssetsRequired;

    // Pledge-specific post-draft state.
    const resolvedTypeName =
      campaignTypes.find((t) => t.id === collectedFields.campaign_type_id)?.name || null;
    const isPledge = isPledgeTypeName(resolvedTypeName);
    const isMerch = isMerchandiseTypeName(resolvedTypeName);
    const isEvent = isEventTypeName(resolvedTypeName);
    const pledgeStillToAsk = isPledge ? getPledgeStillToAsk(collectedFields) : [];
    const pledgeFieldsDone = !isPledge || pledgeStillToAsk.length === 0;
    const merchStillToAsk = isMerch ? getMerchStillToAsk(collectedFields) : [];
    const merchFieldsDone = !isMerch || merchStillToAsk.length === 0;
    const eventStillToAsk = isEvent ? getEventStillToAsk(collectedFields) : [];
    const eventFieldsDone = !isEvent || eventStillToAsk.length === 0;
    // Agenda sub-flow state (event-only)
    const agendaRows: AgendaItem[] = Array.isArray(collectedFields.event_agenda)
      ? collectedFields.event_agenda
      : [];
    const agendaDraft: Record<string, any> = collectedFields.current_agenda_draft || {};
    const agendaAddressed = collectedFields.event_agenda_addressed === true;
    const agendaComplete = collectedFields.event_agenda_complete === true;
    const awaitingAddAnotherAgenda = collectedFields.awaiting_add_another_agenda === true;
    const inAgendaSubflow = isEvent && eventFieldsDone && !agendaComplete;

    const rostersList = rosters.length > 0
      ? rosters.map((r) => `  - "${r.roster_year}${r.current_roster ? " (Current)" : ""}" → id: ${r.id}`).join("\n")
      : "  (no rosters available for this group)";

    let nextStep: string;
    if (sponsorAssetsRequired && !sponsorAssetsComplete && !sponsorDeadlineSet) {
      nextStep = `**Next step: sponsor asset upload deadline.** Sponsors will need to upload their assets — ask in one short sentence: "When do sponsors need to upload their assets by?" The UI will show quick-pick options (1 week before fundraiser end, 2 weeks before, or pick a date). When the user replies, you MUST call **update_campaign_fields** with \`asset_upload_deadline\` set to the date in YYYY-MM-DD format in the SAME turn.`;
    } else if (sponsorAssetsRequired && !sponsorAssetsComplete) {
      const collected = pendingAssets.length > 0
        ? pendingAssets.map((a: any, i: number) => `  ${i + 1}. ${a.asset_name}`).join("\n")
        : "  (none yet — at least one asset is required)";
      const isFirst = pendingAssets.length === 0;
      const ack = isFirst
        ? `Ask in one short sentence: "What assets do sponsors need to provide?"`
        : `Acknowledge the asset just added (e.g. "Saved — ${pendingAssets[pendingAssets.length - 1]?.asset_name}.") and then ask "Anything else?"`;
      nextStep = `**Next step: required sponsor assets.** ${ack} The UI will show quick-pick buttons (Company Logo, Banner Ad, Full Page Ad, Website URL, Done). When the user picks one, you MUST call **update_campaign_fields** with \`add_required_asset\` set to one of: "logo", "banner", "fullpage", "website", OR a free-text custom name. When the user is finished, call **update_campaign_fields** with \`sponsor_assets_complete: true\`.\n\n## Assets added so far\n${collected}`;
    } else if (!hasImage && !collectedFields.image_skipped) {
      nextStep = `**Next step: fundraiser image.** Briefly ask if the user wants to upload a fundraiser image (a hero photo for the fundraiser page). Keep it to one short sentence — the UI shows an upload widget below your message. Do NOT call any tool for this step yet; the upload widget will report back when done or skipped.`;
    } else if (!rosterAttrAddressed) {
      if (rosters.length === 0) {
        nextStep = `**Next step: skip roster attribution.** This group has no rosters, so individual member tracking isn't available. Briefly let the user know and call update_campaign_fields with enable_roster_attribution=false to move on.`;
      } else if (singleRoster) {
        nextStep = `**Next step: roster tracking.** Roster tracking gives each roster member (player/participant) a personalized fundraising URL so they can track their individual contributions to the campaign. This group has exactly one roster: **${singleRoster.roster_year}${singleRoster.current_roster ? " (Current)" : ""}** (id: ${singleRoster.id}). Ask in one short sentence: "Want to enable roster tracking so each player gets their own personalized URL?" The UI will show Yes/No buttons. NEVER call this "peer-to-peer fundraising". If they say yes, call update_campaign_fields with BOTH enable_roster_attribution=true AND roster_id=${singleRoster.id} in the same tool call — do NOT ask them to pick a roster.`;
      } else {
        nextStep = `**Next step: roster tracking.** Roster tracking gives each roster member (player/participant) a personalized fundraising URL so they can track their individual contributions to the campaign. Ask in one short sentence: "Want to enable roster tracking so each player gets their own personalized URL?" The UI will show Yes/No buttons. NEVER call this "peer-to-peer fundraising".`;
      }
    } else if (collectedFields.enable_roster_attribution && !rosterPicked) {
      nextStep = `**Next step: pick a roster.** Ask which roster to use for attribution. The UI will show the available rosters as numbered buttons. Available rosters:\n${rostersList}`;
    } else if (!directionsAddressed) {
      nextStep = `**Next step: participant directions.** Ask if they'd like to add internal-only instructions for their team (e.g., "Each player should sell 10 items by Nov 15"). One short sentence. They can type directions or say "skip". When they reply, call the update_campaign_fields tool with group_directions (or set group_directions_addressed=true if skipped).`;
    } else if (isPledge && !pledgeFieldsDone) {
      const nextPledgeKey = pledgeStillToAsk[0];
      if (nextPledgeKey === "pledge_unit_label") {
        nextStep = `**Next step: pledge unit.** This is a Pledge fundraiser, so supporters pledge a dollar amount per unit. Ask in one short sentence: "What will supporters pledge per? (for example: lap, mile, book read, pushup)". When the user answers, you MUST call **update_campaign_fields** with \`pledge_unit_label\` set to the singular word (lowercase) in the SAME turn.`;
      } else if (nextPledgeKey === "pledge_scope") {
        nextStep = `**Next step: pledge scope.** Ask in one short sentence: "Should pledges count team-wide or per participant?". The UI will show two buttons (Team total / Per participant). When the user answers, you MUST call **update_campaign_fields** with \`pledge_scope\` set to exactly "team" or "participant" in the SAME turn.`;
      } else if (nextPledgeKey === "pledge_event_date") {
        nextStep = `**Next step: pledge event date.** Ask in one short sentence: "When is the event happening? (charges go out on or after this date)". Accept any natural date format and normalize to YYYY-MM-DD. When the user answers, you MUST call **update_campaign_fields** with \`pledge_event_date\` set to YYYY-MM-DD in the SAME turn.`;
      } else {
        nextStep = `**Next step: continue pledge setup.** Ask the user about ${nextPledgeKey}.`;
      }
    } else if (isMerch && !merchFieldsDone) {
      const nextKey = merchStillToAsk[0];
      if (nextKey === "merch_ships_by_date") {
        nextStep = `**Next step: ships-by date.** This is a Merchandise Sale, so let's set fulfillment expectations. Ask in one short sentence: "When will orders ship by? (or say skip)". Accept any natural date format and normalize to YYYY-MM-DD. When the user answers, call **update_campaign_fields** with \`merch_ships_by_date\` (or \`merch_ships_by_date_skipped: true\` if they skip) in the SAME turn.`;
      } else if (nextKey === "merch_shipping_flat_rate") {
        nextStep = `**Next step: flat shipping rate.** Ask in one short sentence: "Want to charge a flat shipping rate? (enter dollars, or say skip)". When the user answers, call **update_campaign_fields** with \`merch_shipping_flat_rate\` as a number (or \`merch_shipping_flat_rate_skipped: true\` if skipped) in the SAME turn.`;
      } else if (nextKey === "merch_pickup_available") {
        nextStep = `**Next step: local pickup option.** Ask in one short sentence: "Want to offer local pickup as an alternative to shipping?". The UI shows Yes/No buttons. When the user answers, call **update_campaign_fields** with \`merch_pickup_available: true\` or \`false\` in the SAME turn.`;
      } else if (nextKey === "merch_pickup_note") {
        nextStep = `**Next step: pickup instructions.** Ask in one short sentence: "Any pickup instructions for donors? (e.g. 'Pick up at the main office Mon–Fri 8–4', or say skip)". When the user replies, call **update_campaign_fields** with \`merch_pickup_note\` (or \`merch_pickup_note_skipped: true\` if skipped) in the SAME turn.`;
      } else {
        nextStep = `**Next step: continue merchandise setup.** Ask the user about ${nextKey}.`;
      }
    } else if (isEvent && !eventFieldsDone) {
      const nextKey = eventStillToAsk[0];
      if (nextKey === "event_start_at") {
        nextStep = `**Next step: event date & start time.** This is an Event fundraiser. Ask in one short sentence: "What date and start time is the event?". Accept any natural format ("May 4 at 9am") and normalize to YYYY-MM-DDTHH:mm. Call **update_campaign_fields** with \`event_start_at\` in the SAME turn.`;
      } else if (nextKey === "event_location_name") {
        nextStep = `**Next step: venue name.** Ask in one short sentence: "Where's the event being held? (venue name)". When the user answers, call **update_campaign_fields** with \`event_location_name\` in the SAME turn.`;
      } else if (nextKey === "event_location_address") {
        nextStep = `**Next step: venue address.** Ask in one short sentence: "What's the address? (or say skip)". Call **update_campaign_fields** with \`event_location_address\` (or \`event_location_address_skipped: true\` if skipped) in the SAME turn.`;
      } else if (nextKey === "event_format") {
        nextStep = `**Next step: event format.** Ask in one short sentence: "How would you describe the format? (e.g. '4-person scramble' or 'Plated dinner', or say skip)". Call **update_campaign_fields** with \`event_format\` (or \`event_format_skipped: true\`) in the SAME turn.`;
      } else if (nextKey === "event_includes") {
        nextStep = `**Next step: what's included.** Ask in one short sentence: "What's included? (comma-separated list, e.g. 'Cart, Lunch, Range balls', or say skip)". Call **update_campaign_fields** with \`event_includes\` as a comma-separated string (or \`event_includes_skipped: true\` if skipped) in the SAME turn.`;
      } else {
        nextStep = `**Next step: continue event setup.** Ask the user about ${nextKey}.`;
      }
    } else if (inAgendaSubflow && !agendaAddressed) {
      nextStep = `**Next step: agenda intro.** Ask in one short sentence: "Want to add a day-of agenda for the event?". The UI will show two buttons (Add agenda / Skip). Do NOT call any tool — the next turn will handle the answer.`;
    } else if (inAgendaSubflow && awaitingAddAnotherAgenda) {
      const list = agendaRows.length > 0
        ? agendaRows.map((r, i) => `  ${i + 1}. ${r.time || "?"} — ${r.title || "?"}`).join("\n")
        : "  (none yet)";
      nextStep = `**Awaiting choice: add another agenda item or finish.** Your message must be exactly two paragraphs separated by a blank line:\n\n  Paragraph 1: confirm the last agenda item was saved (e.g. "Saved.").\n  Paragraph 2: ask "Want to add another agenda item, or are you done?" — the UI shows two buttons (Add another / Done). Do NOT call any tool.\n\n## Agenda so far\n${list}`;
    } else if (inAgendaSubflow) {
      const nextAgendaField = getNextAgendaField(agendaDraft);
      const draftSummary = Object.entries(agendaDraft)
        .filter(([k, v]) => !k.endsWith("_skipped") && v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `  - ${k}: ${JSON.stringify(v)}`)
        .join("\n") || "  (nothing yet)";
      const list = agendaRows.length > 0
        ? agendaRows.map((r, i) => `  ${i + 1}. ${r.time || "?"} — ${r.title || "?"}`).join("\n")
        : "  (none yet)";
      const ordinal = agendaRows.length === 0 ? "first" : "next";
      let askLine: string;
      if (nextAgendaField === "time") {
        askLine = `Ask: "What time is the ${ordinal} agenda item? (e.g. '7:30 AM')". When the user answers, call **update_agenda_field** with \`time\` set to their reply.`;
      } else if (nextAgendaField === "title") {
        askLine = `Ask: "What's the title? (e.g. 'Check-in & range opens')". When the user answers, call **update_agenda_field** with \`title\` set to their reply.`;
      } else if (nextAgendaField === "description") {
        askLine = `Ask: "Add a short description, or say skip.". The UI shows a Skip chip. When the user answers, call **update_agenda_field** with \`description\` (or \`description_skipped: true\` if skipped).`;
      } else {
        askLine = `All required fields are filled — IMMEDIATELY call **save_agenda_item** to save this row.`;
      }
      nextStep = `**Next step: agenda item collection (${ordinal}).** ${askLine}\n\n## Current agenda draft\n${draftSummary}\n\n## Agenda so far\n${list}`;
    } else {
      if (isPledge) {
        nextStep = `**Setup is done — Pledge fundraiser is fully configured.** Your final message must be exactly two paragraphs separated by a blank line:\n\n  Paragraph 1 (acknowledge the last answer): "Got it — saved." (or similar 1-sentence ack).\n  Paragraph 2 (wrap-up): "Your pledge fundraiser is set up. You can preview it, publish it, or fine-tune anything in the editor whenever you're ready." Do NOT mention adding items — Pledge fundraisers don't use items. Do NOT call any tool.`;
      } else {
        nextStep = `**Setup is done — transition to items collection.** Your final message must be exactly two paragraphs separated by a blank line:\n\n  Paragraph 1 (acknowledge the last answer): "Got it — saved." (or similar 1-sentence ack).\n  Paragraph 2 (transition + first item question): "Now let's add your first item. What's the name?"\n\nDo NOT ask about publishing or the editor — that comes later, after items are added. Do NOT call any tool.`;
      }
    }

    return `You are a fundraiser creation assistant for Sponsorly. The user just created a draft campaign and you're now helping them fill in a few more details.

Today is **${todayIso}**.

## Saved Draft
${alreadyCollected}

## Available Rosters (for the campaign's group)
${rostersList}

## Post-Draft Tool
Use the "update_campaign_fields" tool to record:
- asset_upload_deadline (string, YYYY-MM-DD): the deadline for sponsors to upload their assets (only when requires_business_info is true)
- add_required_asset (string): "logo" | "banner" | "fullpage" | "website" OR a custom free-text name — appends one required asset
- sponsor_assets_complete (boolean): true once the user is done adding required sponsor assets
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
- Never re-ask about a step that's already been addressed (look at "Saved Draft" above).
- **Response format — every turn after user input MUST be EXACTLY TWO paragraphs separated by a blank line. Never more, never fewer:**
  1. **Acknowledgment paragraph FIRST** — confirm what the user just provided (e.g. "Got it — image saved." / "Saved.").
  2. **Next question paragraph SECOND** — the next single question on its own line.

  Example:
  \`\`\`
  Got it — image saved.

  Want to enable roster attribution for this campaign?
  \`\`\`
  NEVER combine acknowledgment and question in one sentence. NEVER repeat the question text in both paragraphs. NEVER add a third paragraph (no clarifying notes, no trailing emoji-only lines, no extra commentary).
- **Never repeat your immediately previous question verbatim.** If the user's reply was unclear, briefly re-frame or ask a short clarifier — do not paste the same question again.`;
  }

  // PRE-DRAFT MODE (collecting required fields)
  return `You are a fundraiser creation assistant for Sponsorly, a fundraising platform for schools and nonprofits.

Today's date is **${todayIso}**. Use this when interpreting relative dates ("next Friday", "in 2 weeks") or inferring missing years.

Your job is to help the user set up a new fundraiser by collecting the required information through natural conversation.

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
2. When the user provides information, **immediately** call the "update_campaign_fields" tool with the extracted values in the SAME turn. Never just acknowledge in text — the tool call is mandatory or the field will not be saved and the user will be re-asked.
3. For campaign_type_id: match the user's description to the closest campaign type and use its ID.
4. For group_id: match the user's description to the closest group and use its ID.
5. For goal_amount: pass the value in **WHOLE DOLLARS** exactly as the user typed it. If the user types 10000, pass 10000 (which means $10,000.00). If the user types $500 or 500, pass 500 (which means $500.00). DO NOT multiply by 100. DO NOT convert to cents. When confirming back, format as USD currency (e.g. "Got it — goal of **$10,000.00**.").
6. For start_date and end_date: accept ANY natural format the user provides — "May 1", "5/1", "5/1/2026", "next Friday", "May 1st", "in 2 weeks", "end of May", "Monday", etc. ALWAYS interpret M/D or M/D/YYYY as US-style **month/day/year**. If the user omits the year, assume the current year (${todayIso.slice(0, 4)}) — but if that date has already passed, roll forward to next year. ALWAYS pass the date to the tool in **YYYY-MM-DD** format. **CRITICAL: When the user gives a date, your text reply MUST be accompanied by an \`update_campaign_fields\` tool call with the normalized YYYY-MM-DD value in the SAME turn. Acknowledging the date only in text ("Got it — starting May 1, 2026") without the tool call is a bug — the date will be lost.** After the tool call, briefly confirm it back in friendly format (e.g. "Got it — starting **May 1, 2026**.").
7. Do NOT make up values. Only extract what the user explicitly says.
8. Do NOT write copy, taglines, or marketing content. Just collect the factual details.
9. **Walk through every field in "## Still To Ask About" — never skip one.** For each field:
   - If it's REQUIRED, the user must answer (no skipping).
   - If it's optional, tell them they can say "skip" if they don't want to provide it.
   - For **description**, ask something like: "Want to add a short description of the fundraiser? You can say skip." (free text — no buttons). When the user types ANY free-text answer (e.g. "Let's cover the gym", "Raising money for new uniforms"), you MUST call **update_campaign_fields** with \`description: "<their exact text>"\` in the SAME turn. Never just say "Got it" — the tool call is required.
  - For **requires_business_info**, ask: "Will sponsors need to provide information or assets to participate? (e.g. a logo for a banner/shirt, a website link for social media recognition)" — the UI will show Yes/No buttons. When the user answers yes/no (or true/false), you MUST call **update_campaign_fields** with \`requires_business_info: true\` or \`requires_business_info: false\` in the SAME turn. **Do NOT combine this question with the "save as draft" confirmation.**
   - For **fee_model**, the server will emit a fixed 3-bubble explanation followed by Yes/No buttons. You only need to ensure that **when the user answers**, you MUST call **update_campaign_fields** with \`fee_model: "donor_covers"\` or \`fee_model: "org_absorbs"\` in the SAME turn. Do NOT write your own fee explanation — the server handles it.
   - **POST-DRAFT FIELDS — CRITICAL:** When the user answers any post-draft question (image upload/skip, roster attribution yes/no, roster pick, participant directions), you MUST call **update_campaign_fields** in the SAME turn BEFORE writing your acknowledgment. Saying "saved" or "got it" without calling the tool is a bug — the field will not be saved and the user will be stuck in a loop.
10. **The "## Still To Ask About" list above is the source of truth for what to ask next.** Do NOT ask "Ready to save this as a draft?" — and do NOT call **create_campaign_draft** — until that list is COMPLETELY EMPTY. If even one field appears in the list, your next question MUST be about that field, in the order listed. Skipping ahead to the save confirmation is forbidden. Once the list is finally empty, in a SEPARATE follow-up turn, ask ONE short confirmation: "Ready to save this as a draft?" — the UI will show Yes/No buttons. When the user confirms (yes / ok / sure / save / create / go / sounds good / let's do it), IMMEDIATELY call the **create_campaign_draft** tool. Do NOT just acknowledge — you MUST call the tool to actually create the draft.
11. Keep responses short and focused — no more than 2-3 sentences.
12. When the next missing field is "campaign_type_id" or "group_id", keep your question VERY brief (e.g. "What type of fundraiser is this?" or "Which team is this for?"). The UI will show selectable buttons — do NOT list the options in your text.
13. When the user picks or describes a campaign type, you MUST call **update_campaign_fields** with the matching campaign_type_id in the SAME response where you confirm the choice (e.g. "Great, I'll set this up as a **Merchandise Sale**."). The same applies to group selection — call update_campaign_fields with group_id in the same turn. Do NOT just acknowledge in text — the tool call is REQUIRED to record the selection. If you skip the tool call, the field will not be saved and the user will be re-asked.
14. **NEVER invent, guess, or fabricate UUIDs.** ONLY use IDs that appear verbatim in the "## Available Groups" and "## Available Campaign Types" lists above. If the user has not yet specified a group or campaign type, leave that field empty and ask them — do NOT fill the slot with a placeholder UUID, a made-up ID, or any value not in the lists. Setting only one field per tool call is fine; do not pad the call with guessed values for other fields.
15. **Response format — every turn after the user has provided input MUST be EXACTLY TWO paragraphs separated by a blank line. Never more, never fewer:**
    1. **Acknowledgment paragraph FIRST** — confirm what the user just provided (e.g. "Great, I'll set this up as a **Sponsorship** fundraiser." / "Got it — goal of **$5,000**." / "Saved.").
    2. **Next question paragraph SECOND** — the next single question, on its own line.

    Example:
    \`\`\`
    Great, I'll set this up as a Sponsorship campaign.

    What's the name of this fundraiser?
    \`\`\`

    NEVER combine acknowledgment and question in one sentence. NEVER repeat the question text in both paragraphs. NEVER ask more than one question per turn. NEVER add a third paragraph (no clarifying notes, no trailing emoji-only lines, no extra commentary). (The very first greeting, with no prior user input to acknowledge, is exempt and may be a single paragraph followed by the first question on a new line.)
16. **Never repeat your immediately previous question verbatim.** If the user's reply was unclear, briefly re-frame or ask a short clarifier — do not paste the same question again.`;
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

    const {
      messages,
      collectedFields,
      campaignTypes,
      groups,
      activeGroupId,
      campaignId,
      currentItemDraft: rawItemDraft,
      itemsAdded: rawItemsAdded,
      phase: clientPhase,
      awaitingAddAnother: rawAwaitingAddAnother,
    } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Diagnostic: log incoming request shape so stalls can be traced via fn logs.
    console.log("[ai-campaign-builder] req", JSON.stringify({
      msgCount: messages.length,
      phase: clientPhase,
      campaignId: campaignId || null,
      itemsAdded: rawItemsAdded || 0,
      awaitingAddAnother: !!rawAwaitingAddAnother,
      collectedKeys: Object.keys(collectedFields || {}),
      itemDraftKeys: Object.keys(rawItemDraft || {}),
    }));

    // Cap chat history sent to the model to the last N messages so the prompt
    // does not grow unbounded across long sessions (cause of model drift /
    // dropped suggestions / silent stalls). Always keep the latest user turn.
    const HISTORY_CAP = 20;
    const trimmedMessages = messages.length > HISTORY_CAP
      ? messages.slice(messages.length - HISTORY_CAP)
      : messages;

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

    // Today (used by deterministic date capture below and items phase below).
    const today = new Date();
    const todayIso = `${today.getUTCFullYear()}-${pad(today.getUTCMonth() + 1)}-${pad(today.getUTCDate())}`;

    // Deterministic free-text / yes-no capture (pre-draft only).
    // Safety net: if the model asked about description or requires_business_info
    // and the user replied, capture the answer server-side even if the model
    // forgot to call update_campaign_fields. This prevents stale chip cards
    // and the "still asking the same field" loop.
    if (!campaignId && lastUserMsg && !isSkipMessage(lastUserMsg)) {
      const lastAssistantMsgRaw = [...messages]
        .reverse()
        .find((m: any) => m.role === "assistant")
        ?.content as string | undefined;
      const lastUserMsgRaw = [...messages]
        .reverse()
        .find((m: any) => m.role === "user")
        ?.content as string | undefined;
      if (lastAssistantMsgRaw && lastUserMsgRaw) {
        const askedField = detectFieldFromAssistantText(lastAssistantMsgRaw);
        if (askedField === "description" && !isFieldAnswered("description", updatedFields)) {
          // Don't capture short meta-replies like "I already gave the description?".
          const trimmed = lastUserMsgRaw.trim();
          const isMeta = /^(i\s|already|what\?|why\?|huh\?)/i.test(trimmed) && trimmed.length < 60;
          if (!isMeta && trimmed.length > 0) {
            updatedFields.description = trimmed;
          }
        } else if (
          askedField === "requires_business_info" &&
          !isFieldAnswered("requires_business_info", updatedFields)
        ) {
          const yn = parseYesNo(lastUserMsgRaw);
          if (yn !== null) {
            updatedFields.requires_business_info = yn;
          }
        } else if (
          askedField === "fee_model" &&
          !isFieldAnswered("fee_model", updatedFields)
        ) {
          const t = lastUserMsgRaw.trim().toLowerCase();
          if (/donor.*cover|cover.*on top|\bon top\b|donor_covers|donor covers|covers? the fee|donor pays|recommended|option 1|^1$/.test(t)) {
            updatedFields.fee_model = "donor_covers";
          } else if (/org.*absorb|absorb|we'?ll pay|we pay|org_absorbs|organization absorbs|out of (the )?(item )?price|option 2|^2$/.test(t)) {
            updatedFields.fee_model = "org_absorbs";
          }
        } else if (
          (askedField === "start_date" || askedField === "end_date") &&
          !isFieldAnswered(askedField, updatedFields)
        ) {
          try {
            const trimmed = lastUserMsgRaw.trim();
            const isMeta = /^(i\s|already|what\?|why\?|huh\?)/i.test(trimmed) && trimmed.length < 60;
            if (!isMeta && trimmed.length > 0) {
              const iso = normalizeDate(trimmed, today);
              if (iso) {
                updatedFields[askedField] = iso;
                // Sanity guard: drop end_date if it's before start_date
                if (
                  updatedFields.start_date &&
                  updatedFields.end_date &&
                  updatedFields.end_date < updatedFields.start_date
                ) {
                  console.warn("Captured end_date before start_date; dropping end_date");
                  delete updatedFields.end_date;
                }
              }
            }
          } catch (e) {
            console.error("Deterministic date capture failed:", e);
          }
        }
      }
    }

    // POST-DRAFT deterministic fallback: when the model claims to save but skips
    // the tool call (a recurring model bug), capture the user's answer server-side
    // for participant_directions, roster yes/no, and image-skip. We can't inspect
    // the model's tool_calls until after the call, so this runs as a SECOND-PASS
    // capture below — but we set a flag here so the no-repeat guard can be relaxed.
    let postDraftFallbackApplied = false;

    let rosters: { id: number; roster_year: number; current_roster: boolean }[] = [];
    if (campaignId && updatedFields.group_id) {
      const { data: rData } = await adminSb
        .from("rosters")
        .select("id, roster_year, current_roster")
        .eq("group_id", updatedFields.group_id)
        .order("roster_year", { ascending: false });
      rosters = rData || [];
    }

    // SYNTHETIC IMAGE MESSAGES — always honor regardless of last assistant text.
    // The frontend sends these when the user interacts with the upload widget:
    //   "Image uploaded: <url>"     → set image_url + persist
    //   "Skip image for now"        → set image_skipped + persist
    //   "Item image uploaded: <url>" → set currentItemDraft.image (handled later in items phase)
    //   "Skip item image"            → set currentItemDraft.image_skipped (handled later)
    // Without this, the post-draft fallback only fires when the last assistant text
    // matched the image-question regex — meaning a synthetic skip could be silently
    // dropped and the next phase would advance without resolution.
    if (campaignId) {
      const lastUserContent = [...messages]
        .reverse()
        .find((m: any) => m.role === "user")
        ?.content as string | undefined;
      if (lastUserContent) {
        const m = lastUserContent.match(/^Image uploaded:\s*(\S+)/i);
        if (m && !updatedFields.image_url) {
          updatedFields.image_url = m[1];
          updatedFields.image_skipped = false;
          postDraftFallbackApplied = true;
          await adminSb.from("campaigns").update({ image_url: m[1] }).eq("id", campaignId);
          console.log("[ai-campaign-builder] synthetic image_url captured", m[1]);
        } else if (/^Skip image for now$/i.test(lastUserContent.trim()) && !updatedFields.image_url) {
          updatedFields.image_skipped = true;
          postDraftFallbackApplied = true;
          console.log("[ai-campaign-builder] synthetic image_skipped captured");
        }
      }
    }

    // POST-DRAFT FALLBACK: figure out which post-draft field the previous assistant
    // message was asking about, and capture the user's reply server-side so the model
    // can't get stuck in a loop by forgetting the tool call.
    if (campaignId && lastUserMsg) {
      const lastAssistantRaw = [...messages]
        .reverse()
        .find((m: any) => m.role === "assistant")
        ?.content as string | undefined;
      const lastUserRaw = [...messages]
        .reverse()
        .find((m: any) => m.role === "user")
        ?.content as string | undefined;

      if (lastAssistantRaw && lastUserRaw) {
        const at = lastAssistantRaw.toLowerCase();
        const userRawTrimmed = lastUserRaw.trim();
        const userLower = userRawTrimmed.toLowerCase().replace(/[.!?]+$/, "");

        // Detect which post-draft step the assistant just asked about
        const askedImage = /upload .*(image|photo|hero)|campaign image|hero photo/.test(at) &&
          !/roster|direction|instruction|sponsor|asset/.test(at);
        const askedRoster = /roster (tracking|attribution)|each (player|participant) gets|personalized url|personalized fundraising url/.test(at);
        const askedRosterPick = /which roster|pick a roster|select roster|available rosters/.test(at);
        const askedDirections = /participant direction|internal.only instruction|directions for (your|the) team|directions for participants|instructions for (your|the) team/.test(at);
        const askedDeadline = /(when|by what date|what.*deadline).*(sponsor|asset|upload)|sponsor.*upload.*by|asset.*deadline|upload.*deadline/.test(at);
        const askedAssets = /(what|which) assets|sponsors? need to provide|required assets|anything else\?.*asset|add .*another.*asset|company logo|banner ad|full[- ]?page/.test(at) && !askedDeadline;

        // Sponsor asset deadline (free-text date or quick-pick value)
        const sponsorRequired = updatedFields.requires_business_info === true;
        if (askedDeadline && sponsorRequired && !updatedFields.asset_upload_deadline) {
          // Quick-pick values are emitted by the UI as ISO dates already; otherwise parse.
          const iso = normalizeDate(userRawTrimmed, today);
          if (iso) {
            updatedFields.asset_upload_deadline = iso;
            postDraftFallbackApplied = true;
            await adminSb.from("campaigns").update({ asset_upload_deadline: iso }).eq("id", campaignId);
          }
        }

        // Sponsor required assets (preset name, custom name, or "done")
        if (askedAssets && sponsorRequired && updatedFields.sponsor_assets_complete !== true) {
          if (isDoneAssetsMessage(userRawTrimmed)) {
            // Only mark complete if at least one asset has been added
            const list: any[] = Array.isArray(updatedFields.pending_required_assets)
              ? updatedFields.pending_required_assets
              : [];
            if (list.length > 0) {
              updatedFields.sponsor_assets_complete = true;
              updatedFields.sponsor_assets_phase = "complete";
              postDraftFallbackApplied = true;
            }
          } else {
            const matched = matchAssetPreset(userRawTrimmed);
            const list: any[] = Array.isArray(updatedFields.pending_required_assets)
              ? [...updatedFields.pending_required_assets]
              : [];
            let asset: any = null;
            if (matched) {
              asset = { ...matched.preset, is_required: true, display_order: list.length };
            } else if (userRawTrimmed.length > 0 && userRawTrimmed.length <= 120) {
              asset = {
                asset_name: userRawTrimmed,
                asset_description: "",
                file_types: ["image/png", "image/jpeg", "application/pdf"],
                dimensions_hint: "",
                max_file_size_mb: 10,
                is_required: true,
                display_order: list.length,
              };
            }
            if (asset && !list.some((a) => a.asset_name?.toLowerCase() === asset.asset_name.toLowerCase())) {
              list.push(asset);
              updatedFields.pending_required_assets = list;
              postDraftFallbackApplied = true;
              // Insert immediately so it shows up in DB and the editor
              try {
                await adminSb.from("campaign_required_assets").insert({
                  campaign_id: campaignId,
                  asset_name: asset.asset_name,
                  asset_description: asset.asset_description,
                  file_types: asset.file_types,
                  dimensions_hint: asset.dimensions_hint,
                  max_file_size_mb: asset.max_file_size_mb,
                  is_required: asset.is_required,
                  display_order: asset.display_order,
                });
              } catch (e) {
                console.error("Failed to insert required asset (fallback):", e);
              }
            }
          }
        }

        // Image: skip-only fallback (image upload is handled by the upload widget which sends a synthetic message)
        if (askedImage && !updatedFields.image_url && !updatedFields.image_skipped) {
          if (isSkipMessage(userLower)) {
            updatedFields.image_skipped = true;
            postDraftFallbackApplied = true;
            await adminSb.from("campaigns").update({ image_url: null }).eq("id", campaignId).then(() => {});
          }
        }

        // Roster yes/no
        if (askedRoster && updatedFields.enable_roster_attribution === undefined) {
          const yn = parseYesNo(userRawTrimmed);
          if (yn !== null) {
            updatedFields.enable_roster_attribution = yn;
            postDraftFallbackApplied = true;
            const dbUpd: Record<string, any> = { enable_roster_attribution: yn };
            // Auto-pick single roster
            if (yn && rosters.length === 1) {
              updatedFields.roster_id = rosters[0].id;
              dbUpd.roster_id = rosters[0].id;
            }
            await adminSb.from("campaigns").update(dbUpd).eq("id", campaignId);
            // Fire link generation if enabled with a roster
            if (yn && updatedFields.roster_id) {
              try {
                await adminSb.functions.invoke("generate-roster-member-links", {
                  body: { campaignId, rosterId: Number(updatedFields.roster_id) },
                });
              } catch (e) {
                console.error("Failed to generate roster member links (fallback):", e);
              }
            }
          }
        }

        // Roster pick (numeric reply or roster-year match)
        if (askedRosterPick && updatedFields.enable_roster_attribution && !updatedFields.roster_id && rosters.length > 0) {
          const numMatch = userRawTrimmed.match(/\d{4}|\d+/);
          if (numMatch) {
            const num = Number(numMatch[0]);
            const byYear = rosters.find((r) => r.roster_year === num);
            const byId = rosters.find((r) => r.id === num);
            const picked = byYear || byId;
            if (picked) {
              updatedFields.roster_id = picked.id;
              postDraftFallbackApplied = true;
              await adminSb.from("campaigns").update({ roster_id: picked.id }).eq("id", campaignId);
              try {
                await adminSb.functions.invoke("generate-roster-member-links", {
                  body: { campaignId, rosterId: picked.id },
                });
              } catch (e) {
                console.error("Failed to generate roster member links (pick fallback):", e);
              }
            }
          }
        }

        // Participant directions (free text or skip)
        if (askedDirections && !updatedFields.group_directions_addressed) {
          if (isSkipMessage(userLower)) {
            updatedFields.group_directions_addressed = true;
            postDraftFallbackApplied = true;
            // Nothing to persist on the campaigns row for skip
          } else if (userRawTrimmed.length > 0 && userRawTrimmed.length <= 500) {
            updatedFields.group_directions = userRawTrimmed;
            updatedFields.group_directions_addressed = true;
            postDraftFallbackApplied = true;
            await adminSb.from("campaigns").update({ group_directions: userRawTrimmed }).eq("id", campaignId);
          }
        }

        if (postDraftFallbackApplied) {
          console.log("[ai-campaign-builder] post-draft fallback applied", JSON.stringify({
            askedImage, askedRoster, askedRosterPick, askedDirections,
            captured: {
              image_skipped: updatedFields.image_skipped,
              enable_roster_attribution: updatedFields.enable_roster_attribution,
              roster_id: updatedFields.roster_id,
              group_directions: updatedFields.group_directions ? "(set)" : undefined,
              group_directions_addressed: updatedFields.group_directions_addressed,
            },
          }));
        }
      }
    }

    // (today/todayIso declared earlier)

    // ---- Items collection state ----
    let currentItemDraft: Record<string, any> = { ...(rawItemDraft || {}) };
    let itemsAdded: number = Number(rawItemsAdded) || 0;
    let awaitingAddAnother: boolean = !!rawAwaitingAddAnother;
    let savedItemId: string | null = null;
    let exitItemsCollection = false;
    const inItemsPhase = clientPhase === "collecting_items" && !!campaignId;

    // ---- Agenda sub-flow state (events only, post-event-fields, pre-items) ----
    const isEventCampaign = isEventTypeName(
      types.find((t) => t.id === updatedFields.campaign_type_id)?.name || null,
    );
    const eventFieldsAllDone = !isEventCampaign || getEventStillToAsk(updatedFields).length === 0;
    const inAgendaPhase =
      !!campaignId &&
      !inItemsPhase &&
      isEventCampaign &&
      eventFieldsAllDone &&
      updatedFields.event_agenda_complete !== true;

    // Deterministic agenda-phase capture (button clicks + simple typed values).
    // The model is allowed to call tools too, but this fallback prevents the
    // chat from stalling if the model forgets, mirroring how items collection
    // captures things server-side.
    if (inAgendaPhase && lastUserMsg) {
      const raw = (lastUserMsg as string).trim();
      const lower = raw.toLowerCase().replace(/[.!?]+$/, "");
      const draft: Record<string, any> = { ...(updatedFields.current_agenda_draft || {}) };
      const awaitingAdd = updatedFields.awaiting_add_another_agenda === true;
      const addressed = updatedFields.event_agenda_addressed === true;

      // Intro Yes/Skip
      if (!addressed) {
        if (/^(skip|no|nope|no thanks|skip agenda|no agenda)$/.test(lower)) {
          updatedFields.event_agenda_addressed = true;
          updatedFields.event_agenda_complete = true;
        } else if (/^(add agenda|yes|y|sure|add|ok|okay|let's do it)$/.test(lower)) {
          updatedFields.event_agenda_addressed = true;
        }
      } else if (awaitingAdd) {
        if (/^(add another|another|yes|yep|sure|one more)$/.test(lower) || /\badd another\b/.test(lower)) {
          updatedFields.awaiting_add_another_agenda = false;
          updatedFields.current_agenda_draft = {};
        } else if (/^(done|i'?m done|no|nope|finish|finished|that'?s it)$/.test(lower) || /\bdone\b/.test(lower)) {
          updatedFields.awaiting_add_another_agenda = false;
          updatedFields.event_agenda_complete = true;
        }
      } else {
        // Capture next-field value
        const next = getNextAgendaField(draft);
        if (next === "description" && isSkipMessage(lower)) {
          draft.description_skipped = true;
          updatedFields.current_agenda_draft = draft;
        } else if (next && raw.length > 0 && raw.length <= 200) {
          draft[next] = raw;
          updatedFields.current_agenda_draft = draft;
        }
      }
    }

    // Resolve campaign type name (for item-noun in prompts)
    const resolvedTypeName =
      types.find((t) => t.id === updatedFields.campaign_type_id)?.name || null;
    const itemNoun = itemNounForType(resolvedTypeName);
    const itemExamples = itemExamplesForType(resolvedTypeName);

    // Fetch campaign name when needed for items prompt
    let campaignNameForItems: string = updatedFields.name || "";
    if (inItemsPhase && !campaignNameForItems && campaignId) {
      const { data: c } = await adminSb.from("campaigns").select("name").eq("id", campaignId).single();
      campaignNameForItems = c?.name || "your campaign";
    }

    // Deterministic add-another / done detection while awaiting that choice.
    // When user picks "add another", we reset the draft and MUST skip the rest
    // of the per-turn capture/extraction logic, otherwise the literal string
    // "add another" gets captured as the new item's name (Bug 1).
    let justStartedNewItem = false;
    if (inItemsPhase && awaitingAddAnother && lastUserMsg) {
      const t = lastUserMsg.replace(/[.!?]+$/, "").trim();
      if (/^(add another|another|yes|yep|sure|1)$/i.test(t) || /\badd another\b/i.test(t) || /\bone more\b/i.test(t)) {
        awaitingAddAnother = false;
        currentItemDraft = {};
        justStartedNewItem = true;
      } else if (/^(i'?m done|done|no|nope|finish|finished|that'?s it|2|publish|open editor)$/i.test(t) || /\bdone\b/i.test(t)) {
        awaitingAddAnother = false;
        exitItemsCollection = true;
      }
    }

    // SYNTHETIC ITEM IMAGE MESSAGES — always honor regardless of last assistant text.
    if (inItemsPhase && !awaitingAddAnother && !exitItemsCollection && !justStartedNewItem) {
      const lastUserContent = [...messages]
        .reverse()
        .find((m: any) => m.role === "user")
        ?.content as string | undefined;
      if (lastUserContent) {
        const m = lastUserContent.match(/^Item image uploaded:\s*(\S+)/i);
        if (m && !currentItemDraft.image) {
          currentItemDraft.image = m[1];
          currentItemDraft.image_skipped = false;
          console.log("[ai-campaign-builder] synthetic item image captured", m[1]);
        } else if (/^Skip item image$/i.test(lastUserContent.trim()) && !currentItemDraft.image) {
          currentItemDraft.image_skipped = true;
          console.log("[ai-campaign-builder] synthetic item image skipped");
        }
      }
    }

    // Deterministic skip on optional item field while collecting
    if (inItemsPhase && !awaitingAddAnother && !exitItemsCollection && !justStartedNewItem && lastUserMsg && isSkipMessage(lastUserMsg)) {
      const next = getNextItemField(currentItemDraft);
      if (next && !next.required) {
        currentItemDraft[`${next.key}_skipped`] = true;
      }
    }

    // Deterministic capture of the current item field from the user's reply
    // (the model sometimes acknowledges without calling update_item_field, leaving the
    // conversation stuck — capture server-side so the follow-up can ask the next field).
    let deterministicItemCaptured = false;
    if (inItemsPhase && !awaitingAddAnother && !exitItemsCollection && !justStartedNewItem && lastUserMsg && !isSkipMessage(lastUserMsg)) {
      try {
        const next = getNextItemField(currentItemDraft);
        if (next) {
          const raw = lastUserMsg.trim();
          if (next.key === "cost") {
            const cleaned = raw.replace(/[$,]/g, "");
            const m = cleaned.match(/\d+(?:\.\d+)?/);
            const val = m ? Number(m[0]) : NaN;
            if (!isNaN(val) && val > 0) {
              currentItemDraft.cost = val;
              deterministicItemCaptured = true;
            }
          } else if (next.key === "quantity_offered" || next.key === "max_items_purchased") {
            const m = raw.match(/\d+/);
            if (m) {
              currentItemDraft[next.key] = Number(m[0]);
              deterministicItemCaptured = true;
            }
          } else if (next.key === "is_recurring") {
            if (/^(yes|y|yep|sure|true|monthly|yearly)\b/i.test(raw)) {
              currentItemDraft.is_recurring = true;
              deterministicItemCaptured = true;
            } else if (/^(no|n|nope|false|one[- ]?time)\b/i.test(raw)) {
              currentItemDraft.is_recurring = false;
              currentItemDraft.recurring_interval_skipped = true;
              deterministicItemCaptured = true;
            }
          } else if (next.key === "recurring_interval") {
            if (/month/i.test(raw)) {
              currentItemDraft.recurring_interval = "month";
              deterministicItemCaptured = true;
            } else if (/year|annual/i.test(raw)) {
              currentItemDraft.recurring_interval = "year";
              deterministicItemCaptured = true;
            }
          } else if (next.key === "name" || next.key === "size") {
            // Capture short free-text replies for name/size so the state machine advances
            // and the next (often optional) field gets explicitly asked with a Skip chip.
            if (raw.length > 0 && raw.length <= 120) {
              currentItemDraft[next.key] = raw;
              deterministicItemCaptured = true;
            }
          } else if (next.key === "description") {
            // Capture description text deterministically too (skip already handled above).
            if (raw.length > 0) {
              currentItemDraft.description = raw;
              deterministicItemCaptured = true;
            }
          }
        }
      } catch (e) {
        console.error("Deterministic item capture failed:", e);
      }
    }

    // PENDING-QUESTION LOCK for image upload. If the previous assistant turn ended with
    // an image-upload prompt and the user replied with neither an image upload nor a
    // skip (i.e. unrelated typed text), refuse to advance: return a short clarifier
    // and re-emit the same image_upload suggestion. This guarantees no field is silently
    // skipped just because the user typed "next" or anything else instead of clicking
    // Upload/Skip.
    {
      const lastAssistantContent = [...messages]
        .reverse()
        .find((m: any) => m.role === "assistant")
        ?.content as string | undefined;
      const lastUserContent = [...messages]
        .reverse()
        .find((m: any) => m.role === "user")
        ?.content as string | undefined;

      const isSyntheticImage = (s: string) =>
        /^Image uploaded:\s*\S+/i.test(s) ||
        /^Skip image for now$/i.test(s.trim()) ||
        /^Item image uploaded:\s*\S+/i.test(s) ||
        /^Skip item image$/i.test(s.trim());

      // Campaign cover image lock (post-draft, before items phase)
      if (
        campaignId &&
        !inItemsPhase &&
        lastAssistantContent &&
        lastUserContent &&
        !updatedFields.image_url &&
        !updatedFields.image_skipped
      ) {
        const askedImage = /upload .*(image|photo|hero)|campaign image|hero photo|want to upload/i.test(lastAssistantContent) &&
          !/roster|direction|instruction|sponsor|asset/i.test(lastAssistantContent);
        if (askedImage && !isSyntheticImage(lastUserContent) && !isSkipMessage(lastUserContent)) {
          console.log("[ai-campaign-builder] image-question lock tripped — re-asking");
          return new Response(
            JSON.stringify({
              assistantMessage: "I still need an answer for the fundraiser image — please upload one or click Skip.",
              assistantMessages: ["I still need an answer for the fundraiser image — please upload one or click Skip."],
              updatedFields,
              missingRequired: REQUIRED_KEYS.filter((k) => !updatedFields[k] || updatedFields[k] === ""),
              readyToCreate: false,
              phase: "post_draft",
              suggestions: {
                type: "image_upload",
                field: "image_url",
                label: "Fundraiser image",
                options: [],
              },
              createdCampaignId: null,
              createDraftError: null,
              finalAction: null,
              currentItemDraft,
              itemsAdded,
              awaitingAddAnother,
              savedItemId: null,
              itemNoun,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Item image lock (during item collection, when image is the next field)
      if (
        inItemsPhase &&
        !awaitingAddAnother &&
        !exitItemsCollection &&
        !justStartedNewItem &&
        lastAssistantContent &&
        lastUserContent
      ) {
        const nextItemField = getNextItemField(currentItemDraft);
        const askedItemImage = nextItemField?.key === "image" &&
          /upload .*(image|photo)|item.*image|image for this/i.test(lastAssistantContent);
        if (
          askedItemImage &&
          !currentItemDraft.image &&
          !currentItemDraft.image_skipped &&
          !isSyntheticImage(lastUserContent) &&
          !isSkipMessage(lastUserContent)
        ) {
          console.log("[ai-campaign-builder] item-image-question lock tripped — re-asking");
          return new Response(
            JSON.stringify({
              assistantMessage: `I still need an answer for the ${itemNoun} image — please upload one or click Skip.`,
              assistantMessages: [`I still need an answer for the ${itemNoun} image — please upload one or click Skip.`],
              updatedFields,
              missingRequired: [],
              readyToCreate: false,
              phase: "collecting_items",
              suggestions: {
                type: "image_upload",
                field: "item_image",
                label: "Item image",
                options: [],
              },
              createdCampaignId: null,
              createDraftError: null,
              finalAction: null,
              currentItemDraft,
              itemsAdded,
              awaitingAddAnother,
              savedItemId: null,
              itemNoun,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    let systemPrompt: string;
    if (inItemsPhase && !exitItemsCollection) {
      systemPrompt = buildItemsSystemPrompt(
        campaignNameForItems,
        itemNoun,
        itemsAdded,
        currentItemDraft,
        awaitingAddAnother,
        todayIso,
        itemExamples,
      );
    } else {
      systemPrompt = buildSystemPrompt(types, grps, updatedFields, autoFilledGroupName, todayIso, campaignId || null, rosters);
    }

    const baseTools = [
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
              goal_amount: { type: "number", description: "Fundraising goal in WHOLE DOLLARS (e.g. 10000 = $10,000.00). Do NOT convert to cents." },
              start_date: { type: "string" },
              end_date: { type: "string" },
              requires_business_info: { type: "boolean" },
              fee_model: { type: "string", enum: ["donor_covers", "org_absorbs"], description: "Who pays the 10% platform fee. 'donor_covers' = donor pays it on top; 'org_absorbs' = organization absorbs it out of the item price." },
              // Post-draft fields:
              image_url: { type: "string", description: "URL of uploaded campaign image" },
              image_skipped: { type: "boolean", description: "True if user chose to skip image upload" },
              enable_roster_attribution: { type: "boolean" },
              roster_id: { type: "number" },
              group_directions: { type: "string" },
              group_directions_addressed: { type: "boolean", description: "True once the user has answered the directions question (even if skipped)" },
              // Sponsor-asset sub-flow (only used when requires_business_info === true):
              asset_upload_deadline: { type: "string", description: "Deadline for sponsors to upload assets, in YYYY-MM-DD format" },
              add_required_asset: { type: "string", description: "Add one required sponsor asset. Use 'logo', 'banner', 'fullpage', 'website', or a free-text custom name." },
              sponsor_assets_complete: { type: "boolean", description: "True once the user has finished adding required sponsor assets" },
              // Pledge fundraiser fields (only used when campaign_type is Pledge):
              pledge_unit_label: { type: "string", description: "Singular unit supporters pledge per (e.g. 'lap', 'mile', 'book'). Lowercase." },
              pledge_scope: { type: "string", enum: ["team", "participant"], description: "'team' = one shared total. 'participant' = each roster member tracked separately." },
              pledge_event_date: { type: "string", description: "Date the pledge event happens (charging window opens). YYYY-MM-DD." },
              pledge_min_per_unit: { type: "number", description: "Optional minimum dollar amount per unit (e.g. 0.25)." },
              pledge_suggested_unit_amounts: { type: "string", description: "Optional comma-separated suggested per-unit amounts (e.g. '0.5, 1, 2, 5')." },
              pledge_unit_label_plural: { type: "string", description: "Optional plural form of the pledge unit (e.g. 'laps')." },
              // Merchandise fundraiser fields (only used when campaign_type is Merchandise Sale):
              merch_ships_by_date: { type: "string", description: "Ships-by date in YYYY-MM-DD format." },
              merch_ships_by_date_skipped: { type: "boolean" },
              merch_shipping_flat_rate: { type: "number", description: "Flat shipping rate in dollars." },
              merch_shipping_flat_rate_skipped: { type: "boolean" },
              merch_pickup_available: { type: "boolean", description: "Whether local pickup is offered." },
              merch_pickup_note: { type: "string", description: "Optional pickup instructions." },
              merch_pickup_note_skipped: { type: "boolean" },
              // Event fundraiser fields (only used when campaign_type is Event):
              event_start_at: { type: "string", description: "ISO 8601 datetime (YYYY-MM-DDTHH:mm) for event start." },
              event_location_name: { type: "string", description: "Venue name." },
              event_location_address: { type: "string", description: "Venue street address." },
              event_location_address_skipped: { type: "boolean" },
              event_format: { type: "string", description: "Short format description (e.g. '4-person scramble')." },
              event_format_skipped: { type: "boolean" },
              event_includes: { type: "string", description: "Comma-separated list of inclusions (parsed into an array)." },
              event_includes_skipped: { type: "boolean" },
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

    const itemsTools = [
      {
        type: "function",
        function: {
          name: "update_item_field",
          description:
            "Record a single value for the campaign item being built. Pass exactly one item field key plus its value, OR a `<key>_skipped: true` marker to skip an optional field.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string" },
              image: { type: "string", description: "URL of uploaded item image" },
              description: { type: "string" },
              cost: { type: "number", description: "Price in dollars (stored as decimal dollars)" },
              quantity_offered: { type: "number" },
              max_items_purchased: { type: "number" },
              size: { type: "string" },
              is_recurring: { type: "boolean" },
              recurring_interval: { type: "string", enum: ["month", "year"] },
              image_skipped: { type: "boolean" },
              description_skipped: { type: "boolean" },
              max_items_purchased_skipped: { type: "boolean" },
              size_skipped: { type: "boolean" },
              is_recurring_skipped: { type: "boolean" },
            },
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "save_campaign_item",
          description:
            "Insert the current item draft into the database. Call ONLY after all required item fields are filled.",
          parameters: { type: "object", properties: {}, additionalProperties: false },
        },
      },
    ];

    const agendaTools = [
      {
        type: "function",
        function: {
          name: "update_agenda_field",
          description: "Record a single value for the agenda row being built. Pass exactly one of: time, title, description, OR description_skipped:true.",
          parameters: {
            type: "object",
            properties: {
              time: { type: "string", description: "Time label, e.g. '7:30 AM'." },
              title: { type: "string", description: "Short title, e.g. 'Check-in & range opens'." },
              description: { type: "string", description: "Optional description text." },
              description_skipped: { type: "boolean" },
            },
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "save_agenda_item",
          description: "Append the current agenda draft to the campaign's event_agenda. Call ONLY after time and title are filled.",
          parameters: { type: "object", properties: {}, additionalProperties: false },
        },
      },
      {
        type: "function",
        function: {
          name: "agenda_complete",
          description: "Mark the agenda sub-flow as finished (user is done adding agenda items, or chose to skip the agenda).",
          parameters: { type: "object", properties: {}, additionalProperties: false },
        },
      },
    ];

    const tools = inItemsPhase && !exitItemsCollection
      ? itemsTools
      : inAgendaPhase
        ? [...baseTools, ...agendaTools]
        : baseTools;

    // Debug logging gated behind AI_DEBUG_LOGS env var (flip on without redeploy
    // via Edge Function secrets). Logs the system prompt + last 3 messages and,
    // after the call, the model's raw response (text + tool_calls) plus a diff
    // of collectedFields so you can see exactly what the model did vs. expected.
    const AI_DEBUG = Deno.env.get("AI_DEBUG_LOGS") === "true";
    const collectedBefore = { ...updatedFields };
    if (AI_DEBUG) {
      console.log("[ai-campaign-builder][debug] PROMPT", JSON.stringify({
        systemPromptHead: systemPrompt.slice(0, 2000),
        lastMessages: trimmedMessages.slice(-3),
        postDraftFallbackApplied,
        collectedBefore,
      }));
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...trimmedMessages],
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

    if (AI_DEBUG) {
      console.log("[ai-campaign-builder][debug] RESPONSE", JSON.stringify({
        text: choice.message?.content || null,
        tool_calls: (choice.message?.tool_calls || []).map((tc: any) => ({
          name: tc.function?.name,
          arguments: tc.function?.arguments,
        })),
        finish_reason: choice.finish_reason,
      }));
    }

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

              if (key === "start_date" || key === "end_date" || key === "asset_upload_deadline") {
                const normalized = normalizeDate(value, today);
                if (!normalized) {
                  console.warn(`Could not normalize ${key}:`, value);
                  continue;
                }
                updatedFields[key] = normalized;
                persistFields[key] = normalized;
              } else if (key === "goal_amount") {
                // Sanitize: strip $/commas/spaces, parse as plain dollars (no cents conversion)
                let raw: any = value;
                if (typeof raw === "string") {
                  raw = raw.replace(/[$,\s]/g, "");
                }
                const num = Number(raw);
                if (!isFinite(num) || num <= 0) {
                  console.warn("Invalid goal_amount, skipping:", value);
                  continue;
                }
                updatedFields[key] = num;
                persistFields[key] = num;
              } else if (key === "add_required_asset") {
                // Append to pending list. Match preset key OR treat as custom name.
                const list: any[] = Array.isArray(updatedFields.pending_required_assets)
                  ? [...updatedFields.pending_required_assets]
                  : [];
                const raw = String(value).trim();
                const matched = matchAssetPreset(raw);
                let asset: any;
                if (matched) {
                  asset = { ...matched.preset, is_required: true, display_order: list.length };
                } else if (raw.length > 0 && raw.length <= 120) {
                  asset = {
                    asset_name: raw,
                    asset_description: "",
                    file_types: ["image/png", "image/jpeg", "application/pdf"],
                    dimensions_hint: "",
                    max_file_size_mb: 10,
                    is_required: true,
                    display_order: list.length,
                  };
                } else {
                  continue;
                }
                // Avoid duplicates by name
                if (!list.some((a) => a.asset_name?.toLowerCase() === asset.asset_name.toLowerCase())) {
                  list.push(asset);
                }
                updatedFields.pending_required_assets = list;
                persistFields.pending_required_assets = list;
              } else if (key === "sponsor_assets_complete") {
                if (value === true) {
                  updatedFields.sponsor_assets_complete = true;
                  updatedFields.sponsor_assets_phase = "complete";
                  persistFields.sponsor_assets_complete = true;
                }
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
            if (updatedFields.fee_model === "donor_covers" || updatedFields.fee_model === "org_absorbs") {
              insertData.fee_model = updatedFields.fee_model;
            }

            const { data: newCampaign, error: insertErr } = await adminSb
              .from("campaigns")
              .insert(insertData)
              .select("id")
              .single();

            if (insertErr) {
              console.error("create_campaign_draft insert error:", insertErr);
              if (insertErr.message?.includes("slug") || insertErr.code === "23505") {
                createDraftError = "A fundraiser with a similar name already exists. Try a slightly different name.";
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
        } else if (toolCall.function?.name === "update_item_field" && inItemsPhase) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            for (const [key, value] of Object.entries(args)) {
              if (value === undefined || value === null || value === "") continue;
              currentItemDraft[key] = value;
            }
            // If is_recurring set to false, mark recurring_interval as skipped (not asked)
            if (currentItemDraft.is_recurring === false) {
              currentItemDraft.recurring_interval_skipped = true;
            }
            toolResults.push({ id: toolCall.id, content: JSON.stringify({ success: true, currentItemDraft }) });
          } catch (e) {
            console.error("Failed to parse update_item_field args:", e);
            toolResults.push({ id: toolCall.id, content: JSON.stringify({ success: false, error: "parse_error" }) });
          }
        } else if (toolCall.function?.name === "save_campaign_item" && inItemsPhase && campaignId) {
          if (!isItemReadyToSave(currentItemDraft)) {
            const missing = ITEM_FIELDS.filter((f) => f.required && !isItemFieldAnswered(f.key, currentItemDraft)).map((f) => f.key);
            toolResults.push({ id: toolCall.id, content: JSON.stringify({ success: false, error: `Missing required fields: ${missing.join(", ")}` }) });
          } else {
            const insertItem: Record<string, any> = {
              campaign_id: campaignId,
              name: currentItemDraft.name,
              cost: Number(currentItemDraft.cost),
              quantity_offered: Number(currentItemDraft.quantity_offered),
              quantity_available: Number(currentItemDraft.quantity_offered),
            };
            if (currentItemDraft.image && !currentItemDraft.image_skipped) insertItem.image = currentItemDraft.image;
            if (currentItemDraft.description && !currentItemDraft.description_skipped) insertItem.description = currentItemDraft.description;
            if (currentItemDraft.max_items_purchased !== undefined && !currentItemDraft.max_items_purchased_skipped) {
              insertItem.max_items_purchased = Number(currentItemDraft.max_items_purchased);
            }
            if (currentItemDraft.size && !currentItemDraft.size_skipped) insertItem.size = currentItemDraft.size;
            if (currentItemDraft.is_recurring === true) {
              insertItem.is_recurring = true;
              if (currentItemDraft.recurring_interval) insertItem.recurring_interval = currentItemDraft.recurring_interval;
            }

            const { data: newItem, error: itemErr } = await adminSb
              .from("campaign_items")
              .insert(insertItem)
              .select("id, name")
              .single();

            if (itemErr) {
              console.error("save_campaign_item insert error:", itemErr);
              toolResults.push({ id: toolCall.id, content: JSON.stringify({ success: false, error: itemErr.message }) });
            } else {
              savedItemId = newItem.id;
              itemsAdded += 1;
              awaitingAddAnother = true;
              const savedName = newItem.name;
              currentItemDraft = {};
              toolResults.push({ id: toolCall.id, content: JSON.stringify({ success: true, itemId: savedItemId, itemsAdded, savedName }) });
            }
          }
        } else if (toolCall.function?.name === "update_agenda_field" && inAgendaPhase && campaignId) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const draft: Record<string, any> = { ...(updatedFields.current_agenda_draft || {}) };
            for (const [key, value] of Object.entries(args)) {
              if (value === undefined || value === null || value === "") continue;
              draft[key] = value;
            }
            updatedFields.current_agenda_draft = draft;
            updatedFields.event_agenda_addressed = true;
            toolResults.push({ id: toolCall.id, content: JSON.stringify({ success: true, currentAgendaDraft: draft }) });
          } catch (e) {
            toolResults.push({ id: toolCall.id, content: JSON.stringify({ success: false, error: "parse_error" }) });
          }
        } else if (toolCall.function?.name === "save_agenda_item" && inAgendaPhase && campaignId) {
          const draft: Record<string, any> = updatedFields.current_agenda_draft || {};
          if (!isAgendaRowReady(draft)) {
            toolResults.push({ id: toolCall.id, content: JSON.stringify({ success: false, error: "Missing time or title" }) });
          } else {
            const newRow: AgendaItem = { time: draft.time, title: draft.title };
            if (draft.description && draft.description_skipped !== true) newRow.description = draft.description;
            const list: AgendaItem[] = Array.isArray(updatedFields.event_agenda) ? [...updatedFields.event_agenda] : [];
            list.push(newRow);
            updatedFields.event_agenda = list;
            updatedFields.current_agenda_draft = {};
            updatedFields.awaiting_add_another_agenda = true;
            updatedFields.event_agenda_addressed = true;
            persistFields.event_agenda = list;
            toolResults.push({ id: toolCall.id, content: JSON.stringify({ success: true, agendaCount: list.length }) });
          }
        } else if (toolCall.function?.name === "agenda_complete" && inAgendaPhase && campaignId) {
          updatedFields.event_agenda_complete = true;
          updatedFields.event_agenda_addressed = true;
          updatedFields.awaiting_add_another_agenda = false;
          toolResults.push({ id: toolCall.id, content: JSON.stringify({ success: true })});
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
        if (persistFields.asset_upload_deadline) dbUpdate.asset_upload_deadline = persistFields.asset_upload_deadline;

        // Pledge fields — persist only those the user provided this turn.
        if (persistFields.pledge_unit_label !== undefined)
          dbUpdate.pledge_unit_label = persistFields.pledge_unit_label;
        if (persistFields.pledge_scope !== undefined)
          dbUpdate.pledge_scope = persistFields.pledge_scope;
        if (persistFields.pledge_event_date !== undefined)
          dbUpdate.pledge_event_date = persistFields.pledge_event_date;
        if (persistFields.pledge_min_per_unit !== undefined)
          dbUpdate.pledge_min_per_unit = persistFields.pledge_min_per_unit;
        if (persistFields.pledge_suggested_unit_amounts !== undefined) {
          // Accept either a comma-separated string or an array; store as numeric array.
          const raw = persistFields.pledge_suggested_unit_amounts;
          let arr: number[] = [];
          if (Array.isArray(raw)) {
            arr = raw.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0);
          } else if (typeof raw === "string") {
            arr = raw
              .split(",")
              .map((s) => Number(s.trim()))
              .filter((n) => Number.isFinite(n) && n > 0);
          }
          if (arr.length > 0) dbUpdate.pledge_suggested_unit_amounts = arr;
        }
        if (persistFields.pledge_unit_label_plural !== undefined)
          dbUpdate.pledge_unit_label_plural = persistFields.pledge_unit_label_plural;

        // Merchandise fields
        if (persistFields.merch_ships_by_date !== undefined)
          dbUpdate.merch_ships_by_date = persistFields.merch_ships_by_date;
        if (persistFields.merch_shipping_flat_rate !== undefined)
          dbUpdate.merch_shipping_flat_rate = persistFields.merch_shipping_flat_rate;
        if (persistFields.merch_pickup_available !== undefined)
          dbUpdate.merch_pickup_available = persistFields.merch_pickup_available;
        if (persistFields.merch_pickup_note !== undefined)
          dbUpdate.merch_pickup_note = persistFields.merch_pickup_note;

        // Event fields
        if (persistFields.event_start_at !== undefined)
          dbUpdate.event_start_at = persistFields.event_start_at;
        if (persistFields.event_location_name !== undefined)
          dbUpdate.event_location_name = persistFields.event_location_name;
        if (persistFields.event_location_address !== undefined)
          dbUpdate.event_location_address = persistFields.event_location_address;
        if (persistFields.event_format !== undefined)
          dbUpdate.event_format = persistFields.event_format;
        if (persistFields.event_includes !== undefined) {
          const raw = persistFields.event_includes;
          let arr: string[] = [];
          if (Array.isArray(raw)) {
            arr = raw.map((s) => String(s).trim()).filter((s) => s.length > 0);
          } else if (typeof raw === "string") {
            arr = raw
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
          }
          if (arr.length > 0) dbUpdate.event_includes = arr;
        }
        if (persistFields.event_agenda !== undefined && Array.isArray(persistFields.event_agenda)) {
          dbUpdate.event_agenda = persistFields.event_agenda;
        }

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

        // Sponsor required-assets: insert any newly added assets that aren't yet in DB.
        // We track all pending assets in updatedFields.pending_required_assets; on every
        // turn, sync the diff to the campaign_required_assets table so the manual editor
        // and preview see them in real time.
        const pendingAssets: any[] = Array.isArray(updatedFields.pending_required_assets)
          ? updatedFields.pending_required_assets
          : [];
        if (pendingAssets.length > 0) {
          try {
            const { data: existing } = await adminSb
              .from("campaign_required_assets")
              .select("asset_name")
              .eq("campaign_id", campaignId);
            const existingNames = new Set((existing || []).map((r: any) => r.asset_name.toLowerCase()));
            const toInsert = pendingAssets
              .filter((a) => a.asset_name && !existingNames.has(a.asset_name.toLowerCase()))
              .map((a, i) => ({
                campaign_id: campaignId,
                asset_name: a.asset_name,
                asset_description: a.asset_description || "",
                file_types: a.file_types || [],
                dimensions_hint: a.dimensions_hint || "",
                max_file_size_mb: a.max_file_size_mb || 10,
                is_required: a.is_required !== false,
                display_order: existingNames.size + i,
              }));
            if (toInsert.length > 0) {
              const { error: insErr } = await adminSb
                .from("campaign_required_assets")
                .insert(toInsert);
              if (insErr) console.error("Failed to insert required assets:", insErr);
            }
          } catch (e) {
            console.error("Required-assets sync failed:", e);
          }
        }
      }

      // Force a follow-up when draft was just created (so AI starts items convo)
      // OR when an item was just saved (so AI asks add-another)
      // OR when there's no assistant text yet
      const needsFollowUp = !assistantMessage || createdCampaignId !== null || savedItemId !== null || createDraftError !== null;

      if (needsFollowUp) {
        let followUpSystemPrompt = systemPrompt;
        if (createdCampaignId) {
          // After draft creation, walk the user through post-draft setup
          // (image → roster attribution → directions) BEFORE collecting items.
          // Re-run buildSystemPrompt in post-draft mode with the new campaign id.
          followUpSystemPrompt = buildSystemPrompt(
            types,
            grps,
            updatedFields,
            autoFilledGroupName,
            todayIso,
            createdCampaignId,
            rosters,
          );
        } else if (savedItemId && inItemsPhase) {
          // Just saved an item — rebuild prompt so AI asks add-another
          followUpSystemPrompt = buildItemsSystemPrompt(
            campaignNameForItems,
            itemNoun,
            itemsAdded,
            {},
            true,
            todayIso,
            itemExamples,
          );
        }

        const followUpMessages = [
          { role: "system", content: followUpSystemPrompt },
          ...trimmedMessages,
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
            assistantMessage = `Your fundraiser is created. 🎉\n\nNow let's add your first ${itemNoun}. What's the name? (${itemExamples})`;
          } else if (savedItemId) {
            assistantMessage = `Saved.\n\nWant to add another ${itemNoun}, or are you done?`;
          } else {
            assistantMessage = "Got it!";
          }
        }
      }
    }

    // If we deterministically captured an item field but the model gave only an
    // acknowledgment (or no question), force a follow-up so it asks the next field.
    if (
      deterministicItemCaptured &&
      inItemsPhase &&
      !exitItemsCollection &&
      !awaitingAddAnother &&
      savedItemId === null
    ) {
      const nextField = getNextItemField(currentItemDraft);
      const ready = isItemReadyToSave(currentItemDraft);
      const looksLikeQuestion = /\?\s*$/.test(assistantMessage.trim()) || /\n\s*\n/.test(assistantMessage);
      if (!looksLikeQuestion && (nextField || ready)) {
        const followUpSystemPrompt = buildItemsSystemPrompt(
          campaignNameForItems,
          itemNoun,
          itemsAdded,
          currentItemDraft,
          false,
          todayIso,
          itemExamples,
        );
        try {
          const followUp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: followUpSystemPrompt },
                ...trimmedMessages,
                {
                  role: "system",
                  content: `The user's last value was captured for the current item field. ${
                    ready
                      ? `All required fields are now filled — call the **save_campaign_item** tool now.`
                      : `Now ask the next field as instructed in the Current Step section.`
                  }`,
                },
              ],
              tools: itemsTools,
              tool_choice: "auto",
            }),
          });
          if (followUp.ok) {
            const followUpData = await followUp.json();
            const fChoice = followUpData.choices?.[0];
            const fText = fChoice?.message?.content;
            if (fText) {
              assistantMessage = assistantMessage
                ? `${assistantMessage}\n\n${fText}`
                : fText;
            }
            if (fChoice?.message?.tool_calls?.length) {
              for (const tc of fChoice.message.tool_calls) {
                if (tc.function?.name === "save_campaign_item" && campaignId && isItemReadyToSave(currentItemDraft)) {
                  const insertItem: Record<string, any> = {
                    campaign_id: campaignId,
                    name: currentItemDraft.name,
                    cost: Number(currentItemDraft.cost),
                    quantity_offered: Number(currentItemDraft.quantity_offered),
                    quantity_available: Number(currentItemDraft.quantity_offered),
                  };
                  if (currentItemDraft.image && !currentItemDraft.image_skipped) insertItem.image = currentItemDraft.image;
                  if (currentItemDraft.description && !currentItemDraft.description_skipped) insertItem.description = currentItemDraft.description;
                  if (currentItemDraft.max_items_purchased !== undefined && !currentItemDraft.max_items_purchased_skipped) {
                    insertItem.max_items_purchased = Number(currentItemDraft.max_items_purchased);
                  }
                  if (currentItemDraft.size && !currentItemDraft.size_skipped) insertItem.size = currentItemDraft.size;
                  if (currentItemDraft.is_recurring === true) {
                    insertItem.is_recurring = true;
                    if (currentItemDraft.recurring_interval) insertItem.recurring_interval = currentItemDraft.recurring_interval;
                  }
                  const { data: newItem, error: itemErr } = await adminSb
                    .from("campaign_items")
                    .insert(insertItem)
                    .select("id, name")
                    .single();
                  if (!itemErr && newItem) {
                    savedItemId = newItem.id;
                    itemsAdded += 1;
                    awaitingAddAnother = true;
                    currentItemDraft = {};
                  } else if (itemErr) {
                    console.error("Deterministic save_campaign_item error:", itemErr);
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error("Deterministic item follow-up failed:", e);
        }
      }
    }

    // Detect post_draft → collecting_items transition in THIS turn.
    // When setup just finished but the client thinks we're still in post_draft,
    // replace the assistant message with a single canned message that BOTH
    // announces items collection AND asks for the first item's name. This
    // avoids (a) the dead-end statement that required the user to type "ok"
    // and (b) a double prompt being emitted across consecutive turns.
    {
      const sponsorRequiredX = updatedFields.requires_business_info === true;
      const sponsorAssetsDoneX = !sponsorRequiredX || updatedFields.sponsor_assets_complete === true;
      const imageDoneNow = !!updatedFields.image_url || !!updatedFields.image_skipped;
      const rosterDoneNow = updatedFields.enable_roster_attribution !== undefined &&
        (!updatedFields.enable_roster_attribution || !!updatedFields.roster_id || rosters.length === 0);
      const directionsDoneNow = updatedFields.group_directions_addressed === true;
      const isEventX = isEventTypeName(types.find((t) => t.id === updatedFields.campaign_type_id)?.name || null);
      const eventFieldsDoneX = !isEventX || getEventStillToAsk(updatedFields).length === 0;
      const agendaDoneX = !isEventX || updatedFields.event_agenda_complete === true;
      const setupJustFinished = sponsorAssetsDoneX && imageDoneNow && rosterDoneNow && directionsDoneNow && eventFieldsDoneX && agendaDoneX;
      const justEnteringItemsPhase =
        !!campaignId &&
        !inItemsPhase &&
        !exitItemsCollection &&
        setupJustFinished &&
        // Don't re-fire the "first item" prompt once items have already been
        // saved or once the user has reached the final/complete step.
        itemsAdded === 0 &&
        clientPhase !== "complete" &&
        Object.keys(currentItemDraft).filter((k) => !k.endsWith("_skipped")).length === 0;

      if (justEnteringItemsPhase) {
        assistantMessage = `Awesome — setup is done! 🎉\n\nNow let's add your first ${itemNoun}. **What's the name?** (${itemExamples})`;
      }
    }

    // Bug 1 fix: when user just clicked "Add another", emit a deterministic
    // "what's the name?" prompt so we never re-use whatever the LLM produced
    // (which often mistakenly captures the literal "add another" string as
    // the new item's name and skips the name question).
    if (justStartedNewItem) {
      const ordinal = itemsAdded === 0 ? "first" : "next";
      assistantMessage = `Saved.\n\nGreat — what's the name of the ${ordinal} ${itemNoun}? (${itemExamples})`;
    }

    // If a draft was just created in this turn, treat it as the active campaign for phase/suggestions
    const effectiveCampaignId = campaignId || createdCampaignId;

    // Compute readiness + phase
    const missingRequired = REQUIRED_KEYS.filter(
      (k) => !updatedFields[k] || updatedFields[k] === ""
    );
    const businessInfoAnswered = updatedFields.requires_business_info !== undefined;
    // Ready to save only when EVERY field has been answered or explicitly skipped.
    const stillToAskNow = getStillToAskAbout(updatedFields);
    const readyToCreate =
      missingRequired.length === 0 && businessInfoAnswered && stillToAskNow.length === 0;

    let phase: "collecting" | "ready_to_create" | "collecting_items" | "post_draft" | "complete" = "collecting";
    if (effectiveCampaignId) {
      const stayInItems = inItemsPhase && !exitItemsCollection;
      const sponsorRequired = updatedFields.requires_business_info === true;
      const sponsorAssetsDone = !sponsorRequired || updatedFields.sponsor_assets_complete === true;
      const imageDone = !!updatedFields.image_url || !!updatedFields.image_skipped;
      const rosterDone = updatedFields.enable_roster_attribution !== undefined &&
        (!updatedFields.enable_roster_attribution || !!updatedFields.roster_id || rosters.length === 0);
      const directionsDone = updatedFields.group_directions_addressed === true;
      // Pledge campaigns also need their pledge-specific fields collected.
      const resolvedTypeName =
        types.find((t) => t.id === updatedFields.campaign_type_id)?.name || null;
      const isPledge = isPledgeTypeName(resolvedTypeName);
      const pledgeDone = !isPledge || getPledgeStillToAsk(updatedFields).length === 0;
      const isMerch = isMerchandiseTypeName(resolvedTypeName);
      const merchDone = !isMerch || getMerchStillToAsk(updatedFields).length === 0;
      const isEvent = isEventTypeName(resolvedTypeName);
      const eventDone = !isEvent || getEventStillToAsk(updatedFields).length === 0;
      const agendaDone = !isEvent || updatedFields.event_agenda_complete === true;
      const setupDone = sponsorAssetsDone && imageDone && rosterDone && directionsDone && pledgeDone && merchDone && eventDone && agendaDone;

      if (exitItemsCollection) {
        phase = "complete";
      } else if (stayInItems) {
        phase = "collecting_items";
      } else if (setupDone) {
        // Pledge fundraisers don't use campaign_items — skip straight to complete.
        phase = isPledge ? "complete" : "collecting_items";
      } else {
        phase = "post_draft";
      }
    } else if (readyToCreate) {
      phase = "ready_to_create";
    }

    // Build suggestions for next step
    let suggestions:
      | { type?: string; field: string; label: string; options: { label: string; value: string }[] }
      | null = null;

    if (effectiveCampaignId && phase === "collecting_items") {
      if (awaitingAddAnother) {
        suggestions = {
          type: "choice",
          field: "add_another_item",
          label: `Want to add another ${itemNoun}?`,
          options: [
            { label: "Add another", value: "add another" },
            { label: "I'm done", value: "I'm done" },
          ],
        };
      } else {
        const next = getNextItemField(currentItemDraft);
        if (next?.key === "image") {
          suggestions = {
            type: "image_upload",
            field: "item_image",
            label: "Item image",
            options: [],
          };
        } else if (next?.type === "boolean") {
          suggestions = {
            type: "choice",
            field: next.key,
            label: next.label,
            options: [
              { label: "Yes", value: "yes" },
              { label: "No", value: "no" },
            ],
          };
        } else if (next?.type === "choice" && next.options) {
          suggestions = {
            type: "choice",
            field: next.key,
            label: next.label,
            options: next.options,
          };
        } else if (next && !next.required) {
          suggestions = {
            type: "choice",
            field: next.key,
            label: next.label,
            options: [{ label: `Skip — no ${next.label.toLowerCase()}`, value: "skip" }],
          };
        }
      }
    } else if (effectiveCampaignId) {
      const sponsorRequired = updatedFields.requires_business_info === true;
      const sponsorAssetsComplete = !sponsorRequired || updatedFields.sponsor_assets_complete === true;
      const sponsorDeadlineSet = !!updatedFields.asset_upload_deadline;
      const pendingAssetCount = Array.isArray(updatedFields.pending_required_assets)
        ? updatedFields.pending_required_assets.length
        : 0;
      const imageDone = !!updatedFields.image_url || !!updatedFields.image_skipped;
      const rosterAttrAddressed = updatedFields.enable_roster_attribution !== undefined;
      const rosterPicked = !updatedFields.enable_roster_attribution || !!updatedFields.roster_id || rosters.length === 0;
      const directionsDone = updatedFields.group_directions_addressed === true;

      const endDateStr: string | undefined = updatedFields.end_date;
      const minusDays = (iso: string, days: number): string | null => {
        const d = new Date(iso + "T00:00:00Z");
        if (isNaN(d.getTime())) return null;
        d.setUTCDate(d.getUTCDate() - days);
        return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
      };

      if (sponsorRequired && !sponsorAssetsComplete && !sponsorDeadlineSet) {
        const opts: { label: string; value: string }[] = [];
        if (endDateStr) {
          const twoWk = minusDays(endDateStr, 14);
          const oneWk = minusDays(endDateStr, 7);
          if (twoWk) opts.push({ label: "2 weeks before fundraiser end", value: twoWk });
          if (oneWk) opts.push({ label: "1 week before fundraiser end", value: oneWk });
        }
        opts.push({ label: "Same as fundraiser end date", value: endDateStr || "pick" });
        suggestions = {
          type: "choice",
          field: "asset_upload_deadline",
          label: "Asset upload deadline",
          options: opts,
        };
      } else if (sponsorRequired && !sponsorAssetsComplete) {
        const presetOpts: { label: string; value: string }[] = [
          { label: "Company Logo", value: "logo" },
          { label: "Banner Ad", value: "banner" },
          { label: "Full Page Ad", value: "fullpage" },
          { label: "Website URL", value: "website" },
        ];
        if (pendingAssetCount > 0) {
          presetOpts.push({ label: "Done — that's all", value: "done" });
        }
        suggestions = {
          type: "choice",
          field: "add_required_asset",
          label: pendingAssetCount === 0 ? "Required sponsor assets" : "Add another asset?",
          options: presetOpts,
        };
      } else if (!imageDone) {

        suggestions = {
          type: "image_upload",
          field: "image_url",
          label: "Fundraiser image",
          options: [],
        };
      } else if (!rosterAttrAddressed) {
        suggestions = {
          type: "choice",
          field: "enable_roster_attribution",
          label: "Enable roster tracking?",
          options: [
            { label: "Yes, give each player their own URL", value: "true" },
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
      } else if (
        isPledgeTypeName(types.find((t) => t.id === updatedFields.campaign_type_id)?.name) &&
        getPledgeStillToAsk(updatedFields).length > 0
      ) {
        const nextPledge = getPledgeStillToAsk(updatedFields)[0];
        if (nextPledge === "pledge_scope") {
          suggestions = {
            type: "choice",
            field: "pledge_scope",
            label: "Pledge scope",
            options: [
              { label: "Team total", value: "team" },
              { label: "Per participant", value: "participant" },
            ],
          };
        }
        // pledge_unit_label and pledge_event_date are free-text — no chips needed.
      } else if (
        isMerchandiseTypeName(types.find((t) => t.id === updatedFields.campaign_type_id)?.name) &&
        getMerchStillToAsk(updatedFields).length > 0
      ) {
        const nextMerch = getMerchStillToAsk(updatedFields)[0];
        if (nextMerch === "merch_pickup_available") {
          suggestions = {
            type: "choice",
            field: "merch_pickup_available",
            label: "Offer local pickup?",
            options: [
              { label: "Yes, offer pickup", value: "true" },
              { label: "No, shipping only", value: "false" },
            ],
          };
        } else {
          suggestions = {
            type: "choice",
            field: nextMerch,
            label: nextMerch === "merch_ships_by_date"
              ? "Ships by date (optional)"
              : nextMerch === "merch_shipping_flat_rate"
                ? "Flat shipping rate (optional)"
                : "Pickup instructions (optional)",
            options: [{ label: "Skip", value: "skip" }],
          };
        }
      } else if (
        isEventTypeName(types.find((t) => t.id === updatedFields.campaign_type_id)?.name) &&
        getEventStillToAsk(updatedFields).length > 0
      ) {
        const nextEvent = getEventStillToAsk(updatedFields)[0];
        if (nextEvent === "event_start_at" || nextEvent === "event_location_name") {
          // Required free-text — no chip.
          suggestions = null;
        } else {
          const labelMap: Record<string, string> = {
            event_location_address: "Venue address (optional)",
            event_format: "Event format (optional)",
            event_includes: "What's included (optional)",
          };
          suggestions = {
            type: "choice",
            field: nextEvent,
            label: labelMap[nextEvent] || nextEvent,
            options: [{ label: "Skip", value: "skip" }],
          };
        }
      } else if (
        isEventTypeName(types.find((t) => t.id === updatedFields.campaign_type_id)?.name) &&
        updatedFields.event_agenda_complete !== true
      ) {
        if (updatedFields.event_agenda_addressed !== true) {
          suggestions = {
            type: "choice",
            field: "event_agenda_intro",
            label: "Day-of agenda?",
            options: [
              { label: "Add agenda", value: "add agenda" },
              { label: "Skip", value: "skip" },
            ],
          };
        } else if (updatedFields.awaiting_add_another_agenda === true) {
          suggestions = {
            type: "choice",
            field: "add_another_agenda",
            label: "Add another agenda item?",
            options: [
              { label: "Add another", value: "add another" },
              { label: "Done", value: "done" },
            ],
          };
        } else {
          const draft = updatedFields.current_agenda_draft || {};
          const next = getNextAgendaField(draft);
          if (next === "description") {
            suggestions = {
              type: "choice",
              field: "agenda_description",
              label: "Description (optional)",
              options: [{ label: "Skip", value: "skip" }],
            };
          }
          // time and title are required free-text — no chip
        }
      } else {
        // Phase === "complete" — offer the final choice
        suggestions = {
          type: "choice",
          field: "final_action",
          label: "What's next?",
          options: [
            { label: "Publish now", value: "publish" },
            { label: "Open in editor", value: "open_editor" },
          ],
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
      // Walk every un-answered field in order — required AND optional.
      const nextField = stillToAskNow[0];
      if (nextField === "campaign_type_id" && types.length > 0) {
        suggestions = {
          type: "choice",
          field: "campaign_type_id",
          label: "Fundraiser type",
          options: types.map((t) => ({ label: t.name, value: t.id })),
        };
      } else if (nextField === "group_id" && grps.length > 1) {
        suggestions = {
          type: "choice",
          field: "group_id",
          label: "Group",
          options: grps.map((g) => ({ label: g.group_name, value: g.id })),
        };
      } else if (nextField === "description") {
        // Optional free-text field — offer a Skip chip; the chat input handles the text.
        suggestions = {
          type: "choice",
          field: "description",
          label: "Description (optional)",
          options: [{ label: "Skip — no description", value: "skip" }],
        };
      } else if (nextField === "requires_business_info") {
        suggestions = {
          type: "choice",
          field: "requires_business_info",
          label: "Will sponsors provide info/assets to participate?",
          options: [
            { label: "Yes, sponsors must provide info", value: "true" },
            { label: "No, not required", value: "false" },
          ],
        };
      } else if (nextField === "fee_model") {
        suggestions = {
          type: "choice",
          field: "fee_model",
          label: "Who covers the 10% platform fee?",
          options: [
            { label: "Donor covers the fee (recommended)", value: "donor_covers" },
            { label: "Our organization absorbs the fee", value: "org_absorbs" },
          ],
        };
      }
    }

    // Detect typed final action when in "complete" phase
    let finalAction: "publish" | "open_editor" | null = null;
    if (phase === "complete" && lastUserMsg) {
      const t = lastUserMsg.replace(/[.!?]+$/, "").trim();
      if (/^(publish|publish now|publish it|publish the campaign|1)$/i.test(t)) {
        finalAction = "publish";
      } else if (/^(open editor|open the editor|editor|open in editor|fine.?tune|2)$/i.test(t)) {
        finalAction = "open_editor";
      }
    }

    // When the user picked a final action, replace any LLM/canned text with a
    // short confirmation so no stale "add your first item" prompt leaks through
    // before the client navigates.
    if (finalAction === "open_editor") {
      assistantMessage = "Opening the editor…";
    } else if (finalAction === "publish") {
      assistantMessage = "Opening publish…";
    }

    // Split assistant message into separate bubbles on \n\n boundaries
    // (typically: acknowledgment paragraph + question paragraph).
    // Filter empty/whitespace-only and emoji-only trailing fragments.
    const isEmojiOnly = (s: string) => !/[A-Za-z0-9]/.test(s);
    let assistantMessages = (assistantMessage || "")
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !isEmojiOnly(s));

    // No-repeat guard: if the model's final paragraph (the "next question")
    // matches the previous assistant turn's final paragraph verbatim, replace
    // it with a brief clarifier so the user isn't double-prompted with the
    // exact same question.
    try {
      const prevAssistant = [...messages]
        .reverse()
        .find((m: any) => m.role === "assistant")
        ?.content as string | undefined;
      const lastParaOf = (s: string) => {
        const parts = (s || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
        return parts[parts.length - 1] || "";
      };
      if (prevAssistant && assistantMessages.length > 0) {
        const newLast = lastParaOf(assistantMessages.join("\n\n")).toLowerCase();
        const prevLast = lastParaOf(prevAssistant).toLowerCase();
        if (newLast && prevLast && newLast === prevLast) {
          if (postDraftFallbackApplied) {
            // We already captured the user's answer server-side this turn — the
            // model's repeated question is a stale echo. Trust the fallback to
            // advance state on the NEXT turn; just drop the duplicate question
            // and let the acknowledgment paragraph stand on its own.
            console.log("[ai-campaign-builder] no-repeat guard: suppressing duplicate (post-draft fallback applied)");
            assistantMessages = assistantMessages.slice(0, -1);
            if (assistantMessages.length === 0) {
              assistantMessages.push("Got it — saved.");
            }
            assistantMessage = assistantMessages.join("\n\n");
          } else {
            console.log("[ai-campaign-builder] no-repeat guard tripped, rewriting duplicate question");
            // Drop the duplicate trailing question and replace with a clarifier.
            assistantMessages = assistantMessages.slice(0, -1);
            assistantMessages.push("Sorry, I didn't quite catch that — could you rephrase your answer?");
            assistantMessage = assistantMessages.join("\n\n");
          }
        }
      }
    } catch (e) {
      console.error("no-repeat guard failed:", e);
    }

    console.log("[ai-campaign-builder] resp", JSON.stringify({
      phase,
      readyToCreate,
      msgCount: assistantMessages.length,
      hasSuggestions: !!suggestions,
      suggestionField: suggestions?.field || null,
      createdCampaignId,
      savedItemId,
      itemsAdded,
      postDraftFallbackApplied,
    }));

    if (AI_DEBUG) {
      const diff: Record<string, { before: any; after: any }> = {};
      const allKeys = new Set([...Object.keys(collectedBefore), ...Object.keys(updatedFields)]);
      for (const k of allKeys) {
        if (JSON.stringify(collectedBefore[k]) !== JSON.stringify(updatedFields[k])) {
          diff[k] = { before: collectedBefore[k], after: updatedFields[k] };
        }
      }
      console.log("[ai-campaign-builder][debug] FIELDS_DIFF", JSON.stringify(diff));
    }

    // Force a deterministic 3-bubble fee explanation whenever the next pre-draft
    // question is fee_model. This guarantees the user sees the full breakdown
    // (intro + processing-fee disclosure, donor-covers option, org-absorbs option +
    // question) as separate chat bubbles regardless of what the LLM produced.
    // The choice chips are attached via the `suggestions` block above.
    if (
      !effectiveCampaignId &&
      phase === "collecting" &&
      stillToAskNow[0] === "fee_model" &&
      suggestions?.field === "fee_model"
    ) {
      assistantMessages = [
        "One last thing — who covers Sponsorly's 10% fee?\n\nHeads up: that 10% covers **both** our platform fee **and** the credit card processing fees from Stripe. There are no other charges on top.",
        "**Donor covers the fee (recommended)** — On a $100 donation, the donor pays **$110** at checkout. Your organization receives the full **$100**. The fee appears as a separate line item so supporters see exactly where it goes.",
        "**Your organization absorbs the fee** — On a $100 donation, the donor pays **$100** and your organization receives roughly **$90** after the 10% fee. Lower friction for donors, but reduces your net.\n\nMost teams pick \"Donor covers.\" Which would you prefer?",
      ];
      assistantMessage = assistantMessages.join("\n\n");
    }

    return new Response(
      JSON.stringify({
        assistantMessage,
        assistantMessages: assistantMessages.length > 0 ? assistantMessages : [assistantMessage],
        updatedFields,
        missingRequired,
        readyToCreate,
        phase,
        suggestions,
        createdCampaignId,
        createDraftError,
        finalAction,
        currentItemDraft,
        itemsAdded,
        awaitingAddAnother,
        savedItemId,
        itemNoun,
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
