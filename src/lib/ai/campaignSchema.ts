export interface CampaignFieldDef {
  key: string;
  label: string;
  type: "string" | "number" | "date" | "boolean" | "select";
  required: boolean;
  aiDescription: string;
  options?: string[];
  validation?: (value: any) => string | null;
}

// Shared fields across all campaign types
export const sharedFields: CampaignFieldDef[] = [
  {
    key: "name",
    label: "Fundraiser Name",
    type: "string",
    required: true,
    aiDescription: "The name/title of the campaign. Should be descriptive and engaging.",
  },
  {
    key: "campaign_type_id",
    label: "Fundraiser Type",
    type: "select",
    required: true,
    aiDescription:
      "The type of campaign. Must be one of the provided campaign type IDs. Common types: Sponsorship, Donation, Event, Merchandise, Roster.",
  },
  {
    key: "group_id",
    label: "Group",
    type: "select",
    required: true,
    aiDescription:
      "The group/team this campaign belongs to. Must be one of the provided group IDs.",
  },
  {
    key: "description",
    label: "Description",
    type: "string",
    required: false,
    aiDescription: "A brief description of the campaign purpose and goals.",
  },
  {
    key: "goal_amount",
    label: "Goal Amount",
    type: "number",
    required: true,
    aiDescription:
      "The fundraising goal in whole dollars (e.g. 10000 = $10,000.00). Must be a positive number.",
    validation: (v) =>
      v !== undefined && v !== null && (typeof v !== "number" || v <= 0)
        ? "Goal amount must be a positive number"
        : null,
  },
  {
    key: "start_date",
    label: "Start Date",
    type: "date",
    required: true,
    aiDescription:
      "The campaign start date in ISO 8601 format (YYYY-MM-DD). Should be today or in the future.",
  },
  {
    key: "end_date",
    label: "End Date",
    type: "date",
    required: true,
    aiDescription:
      "The campaign end date in ISO 8601 format (YYYY-MM-DD). Must be after the start date.",
  },
  {
    key: "requires_business_info",
    label: "Requires Business Info",
    type: "boolean",
    required: false,
    aiDescription:
      "Whether purchasers should provide business information at checkout. Typically true for sponsorship campaigns.",
  },
  {
    key: "fee_model",
    label: "Platform Fee Model",
    type: "select",
    required: true,
    options: ["donor_covers", "org_absorbs"],
    aiDescription:
      "Who covers the 10% Sponsorly platform fee. 'donor_covers' adds the fee on top of the item price at checkout. 'org_absorbs' deducts the fee from the item price the donor sees.",
  },
];

// All fields combined for easy lookup
export const pledgeFields: CampaignFieldDef[] = [
  {
    key: "pledge_unit_label",
    label: "Unit Label",
    type: "string",
    required: true,
    aiDescription:
      "The thing supporters pledge per (singular). Examples: 'lap', 'mile', 'book read', 'pushup'. Required for Pledge fundraisers.",
  },
  {
    key: "pledge_scope",
    label: "Pledge Scope",
    type: "select",
    required: true,
    options: ["team", "participant"],
    aiDescription:
      "Whether pledges count team-wide ('team' — one shared total) or per roster member ('participant' — each player has their own count). Required for Pledge fundraisers.",
  },
  {
    key: "pledge_event_date",
    label: "Event Date",
    type: "date",
    required: true,
    aiDescription:
      "The date of the pledge event (e.g. the jogathon, readathon). Charges happen on or after this date. ISO 8601 (YYYY-MM-DD). Required for Pledge fundraisers.",
  },
  {
    key: "pledge_min_per_unit",
    label: "Minimum per unit",
    type: "number",
    required: false,
    aiDescription:
      "Optional minimum dollar amount per unit a supporter can pledge (e.g. 0.25 means $0.25 per lap minimum).",
  },
  {
    key: "pledge_suggested_unit_amounts",
    label: "Suggested per-unit amounts",
    type: "string",
    required: false,
    aiDescription:
      "Optional comma-separated list of suggested per-unit amounts (e.g. '0.5, 1, 2, 5'). Will be parsed into a numeric array.",
  },
  {
    key: "pledge_unit_label_plural",
    label: "Unit label (plural)",
    type: "string",
    required: false,
    aiDescription:
      "Optional plural form of the unit label (e.g. 'laps' for 'lap'). If omitted we'll auto-suggest by adding an 's'.",
  },
];

// =====================================================================
// Merchandise-Sale-only fields (collected after the campaign type is set)
// =====================================================================
export const merchandiseFields: CampaignFieldDef[] = [
  {
    key: "merch_ships_by_date",
    label: "Ships by date",
    type: "date",
    required: false,
    aiDescription:
      "Optional ship-by date shown on the landing page and cart (\"Ships by {date}\"). YYYY-MM-DD.",
  },
  {
    key: "merch_shipping_flat_rate",
    label: "Flat shipping rate",
    type: "number",
    required: false,
    aiDescription:
      "Optional flat shipping rate in dollars added as a separate cart line. Skip to hide the shipping line entirely.",
  },
  {
    key: "merch_pickup_available",
    label: "Local pickup available",
    type: "boolean",
    required: true,
    aiDescription:
      "Whether donors can pick up their order locally instead of paying for shipping.",
  },
  {
    key: "merch_pickup_note",
    label: "Pickup instructions",
    type: "string",
    required: false,
    aiDescription:
      "Optional pickup instructions shown when local pickup is enabled (e.g. 'Pick up at the main office Mon–Fri 8–4').",
  },
];

// =====================================================================
// Event-only fields (collected after the campaign type is set)
// =====================================================================
export const eventFields: CampaignFieldDef[] = [
  {
    key: "event_start_at",
    label: "Event date & start time",
    type: "date",
    required: true,
    aiDescription:
      "Date and start time the event happens. ISO 8601 datetime (YYYY-MM-DDTHH:mm). REQUIRED for Event fundraisers.",
  },
  {
    key: "event_location_name",
    label: "Location name",
    type: "string",
    required: true,
    aiDescription:
      "Venue name (e.g. 'Pine Hills Golf Club'). REQUIRED for Event fundraisers.",
  },
  {
    key: "event_location_address",
    label: "Location address",
    type: "string",
    required: false,
    aiDescription: "Optional street address of the venue.",
  },
  {
    key: "event_format",
    label: "Format",
    type: "string",
    required: false,
    aiDescription:
      "Optional short format description (e.g. '4-person scramble', 'Plated dinner').",
  },
  {
    key: "event_includes",
    label: "What's included",
    type: "string",
    required: false,
    aiDescription:
      "Optional comma-separated list of inclusions (e.g. 'Cart, Lunch, Range balls'). Stored as an array.",
  },
];

export const allFields = [
  ...sharedFields,
  ...pledgeFields,
  ...merchandiseFields,
  ...eventFields,
];

export const fieldMap = new Map(allFields.map((f) => [f.key, f]));

// Base required field keys (apply to every campaign type).
export const requiredFieldKeys = sharedFields
  .filter((f) => f.required)
  .map((f) => f.key);

const pledgeRequiredKeys = pledgeFields
  .filter((f) => f.required)
  .map((f) => f.key);

const merchandiseRequiredKeys = merchandiseFields
  .filter((f) => f.required)
  .map((f) => f.key);

const eventRequiredKeys = eventFields.filter((f) => f.required).map((f) => f.key);

/** Returns true when the given campaign type name is a Pledge fundraiser. */
export function isPledgeType(typeName?: string | null): boolean {
  return (typeName || "").toLowerCase().includes("pledge");
}

/** Returns true when the given campaign type name is a Merchandise Sale. */
export function isMerchandiseType(typeName?: string | null): boolean {
  return (typeName || "").toLowerCase().includes("merch");
}

/** Returns true when the given campaign type name is an Event fundraiser. */
export function isEventType(typeName?: string | null): boolean {
  return (typeName || "").toLowerCase().includes("event");
}

/**
 * Returns the required field keys for a given campaign type. Pledge campaigns
 * also require the pledge-specific fields (unit label, scope, event date).
 */
export function getRequiredFieldsForType(typeName?: string | null): string[] {
  if (isPledgeType(typeName)) return [...requiredFieldKeys, ...pledgeRequiredKeys];
  if (isMerchandiseType(typeName))
    return [...requiredFieldKeys, ...merchandiseRequiredKeys];
  if (isEventType(typeName)) return [...requiredFieldKeys, ...eventRequiredKeys];
  return requiredFieldKeys;
}

// Get missing required fields given collected data. Optionally pass the chosen
// campaign type name so pledge-specific fields are included when applicable.
export function getMissingRequiredFields(
  collected: Record<string, any>,
  typeName?: string | null,
): string[] {
  return getRequiredFieldsForType(typeName).filter(
    (key) =>
      collected[key] === undefined ||
      collected[key] === null ||
      collected[key] === ""
  );
}

// Check if all required fields are filled.
export function isReadyToCreate(
  collected: Record<string, any>,
  typeName?: string | null,
): boolean {
  return getMissingRequiredFields(collected, typeName).length === 0;
}

// =====================================================================
// Campaign Item fields (collected one-by-one after the campaign is created)
// =====================================================================

export interface CampaignItemFieldDef {
  key: string;
  label: string;
  prompt: string;
  type: "string" | "longtext" | "number" | "boolean" | "choice";
  required: boolean;
  options?: { label: string; value: string }[];
  dependsOn?: { key: string; equals: any };
}

export const campaignItemFields: CampaignItemFieldDef[] = [
  {
    key: "name",
    label: "Name",
    prompt: "What's the name of your {ordinal} {itemNoun}? ({examples})",
    type: "string",
    required: true,
  },
  {
    key: "description",
    label: "Description",
    prompt: "Add a short description for this {itemNoun}, or say skip.",
    type: "longtext",
    required: false,
  },
  {
    key: "cost",
    label: "Price",
    prompt: "How much does it cost? (in dollars, e.g. 25)",
    type: "number",
    required: true,
  },
  {
    key: "quantity_offered",
    label: "Quantity offered",
    prompt: "How many are you offering in total?",
    type: "number",
    required: true,
  },
  {
    key: "max_items_purchased",
    label: "Limit per buyer",
    prompt: "Limit per buyer? (a number, or say skip for no limit)",
    type: "number",
    required: false,
  },
  {
    key: "size",
    label: "Size / tier label",
    prompt: "Any size or tier label? (e.g. 'Large' or 'Gold tier' — say skip if none)",
    type: "string",
    required: false,
  },
  {
    key: "is_recurring",
    label: "Recurring",
    prompt: "Should this be a recurring charge?",
    type: "boolean",
    required: false,
  },
  {
    key: "recurring_interval",
    label: "Recurring interval",
    prompt: "How often should it recur?",
    type: "choice",
    required: false,
    options: [
      { label: "Monthly", value: "month" },
      { label: "Yearly", value: "year" },
    ],
    dependsOn: { key: "is_recurring", equals: true },
  },
];

export const itemRequiredKeys = campaignItemFields
  .filter((f) => f.required)
  .map((f) => f.key);

export function itemNounForCampaignType(typeName?: string | null): string {
  const t = (typeName || "").toLowerCase();
  if (t.includes("sponsor")) return "sponsorship item";
  if (t.includes("merch")) return "item";
  if (t.includes("event")) return "ticket";
  if (t.includes("donation")) return "donation tier";
  return "item";
}

export function itemExamplesForCampaignType(typeName?: string | null): string {
  const t = (typeName || "").toLowerCase();
  if (t.includes("sponsor")) return "e.g. Large Banner, Event Sponsor, Platinum Sponsor";
  if (t.includes("merch")) return "e.g. T-Shirt, Hoodie, Mug";
  if (t.includes("event")) return "e.g. General Admission, VIP Ticket, Table for 8";
  if (t.includes("donation")) return "e.g. Friend, Supporter, Champion";
  return "e.g. Item Name";
}

export function isItemFieldAnswered(
  key: string,
  draft: Record<string, any>
): boolean {
  if (draft[`${key}_skipped`] === true) return true;
  const v = draft[key];
  if (key === "is_recurring") return v !== undefined && v !== null;
  return v !== undefined && v !== null && v !== "";
}

export function getMissingItemRequiredFields(draft: Record<string, any>): string[] {
  return itemRequiredKeys.filter((k) => !isItemFieldAnswered(k, draft));
}

export function getNextItemFieldToAsk(draft: Record<string, any>): CampaignItemFieldDef | null {
  for (const f of campaignItemFields) {
    if (f.dependsOn) {
      const depVal = draft[f.dependsOn.key];
      if (depVal !== f.dependsOn.equals) continue;
    }
    if (!isItemFieldAnswered(f.key, draft)) return f;
  }
  return null;
}

// Format a field value for display
export function formatFieldValue(key: string, value: any): string {
  const field = fieldMap.get(key);
  if (!field || value === undefined || value === null || value === "")
    return "";

  if (field.type === "number" && key === "goal_amount") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(value));
  }
  if (field.type === "boolean") {
    return value ? "Yes" : "No";
  }
  if (field.type === "date") {
    try {
      return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return String(value);
    }
  }
  if (key === "fee_model") {
    if (value === "donor_covers") return "Donor covers fee";
    if (value === "org_absorbs") return "Organization absorbs fee";
  }
  if (key === "pledge_scope") {
    if (value === "team") return "Team total";
    if (value === "participant") return "Per participant";
  }
  if (key === "pledge_min_per_unit") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));
  }
  return String(value);
}
