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
    label: "Campaign Name",
    type: "string",
    required: true,
    aiDescription: "The name/title of the campaign. Should be descriptive and engaging.",
  },
  {
    key: "campaign_type_id",
    label: "Campaign Type",
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
      "The fundraising goal in cents (e.g. 50000 = $500.00). Must be a positive integer.",
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
];

// All fields combined for easy lookup
export const allFields = [...sharedFields];

export const fieldMap = new Map(allFields.map((f) => [f.key, f]));

// Required field keys
export const requiredFieldKeys = allFields
  .filter((f) => f.required)
  .map((f) => f.key);

// Get missing required fields given collected data
export function getMissingRequiredFields(
  collected: Record<string, any>
): string[] {
  return requiredFieldKeys.filter(
    (key) =>
      collected[key] === undefined ||
      collected[key] === null ||
      collected[key] === ""
  );
}

// Check if all required fields are filled
export function isReadyToCreate(collected: Record<string, any>): boolean {
  return getMissingRequiredFields(collected).length === 0;
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
    return `$${(Number(value) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
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
  return String(value);
}
