export interface ResolvedBranding {
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  source: "group" | "organization" | "school" | "template";
}

/**
 * Resolve effective branding for a campaign landing page.
 * Priority per field (independently):
 *   1. Group/team
 *   2. Organization
 *   3. School (final fallback for color/logo)
 *   4. null → template default
 */
export function resolveCampaignBranding(campaign: any): ResolvedBranding {
  const group = campaign?.groups || null;
  const org = group?.organizations || null;
  const school = group?.schools || null;

  const pick = (...vals: (string | null | undefined)[]) =>
    vals.find((v) => typeof v === "string" && v.trim().length > 0) || null;

  const primaryColor = pick(
    group?.primary_color,
    org?.primary_color,
    school?.["Primary Color"],
  );
  const secondaryColor = pick(
    group?.secondary_color,
    org?.secondary_color,
    school?.["Secondary Color"],
  );
  const logoUrl = pick(group?.logo_url, org?.logo_url, school?.logo_file);

  let source: ResolvedBranding["source"] = "template";
  if (group?.primary_color || group?.logo_url || group?.secondary_color) source = "group";
  else if (org?.primary_color || org?.logo_url || org?.secondary_color) source = "organization";
  else if (school?.["Primary Color"] || school?.logo_file) source = "school";

  return { primaryColor, secondaryColor, logoUrl, source };
}

export function isColorDark(hexColor: string | null | undefined): boolean {
  if (!hexColor) return false;
  const color = hexColor.replace("#", "");
  if (color.length < 6) return false;
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}

export function contrastTextColor(hexColor: string | null | undefined): string {
  return isColorDark(hexColor) ? "#ffffff" : "#0a0a0a";
}

/** Convert a hex color (#rrggbb or #rgb) to a Tailwind HSL CSS variable string ("h s% l%"). */
export function hexToHslString(hex: string | null | undefined): string | null {
  if (!hex) return null;
  let c = hex.replace("#", "").trim();
  if (c.length === 3) c = c.split("").map((ch) => ch + ch).join("");
  if (c.length !== 6 || /[^0-9a-f]/i.test(c)) return null;
  const r = parseInt(c.substr(0, 2), 16) / 255;
  const g = parseInt(c.substr(2, 2), 16) / 255;
  const b = parseInt(c.substr(4, 2), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return `${h.toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
}

/**
 * Build inline CSS-variable style overrides for a branded landing wrapper.
 * Overrides --primary, --primary-foreground, and (when present) --secondary
 * so all Tailwind bg-primary/text-primary classes pick up the brand color.
 */
export function brandingStyleVars(branding: ResolvedBranding): React.CSSProperties {
  const vars: Record<string, string> = {};
  const primaryHsl = hexToHslString(branding.primaryColor);
  if (primaryHsl) {
    vars["--primary"] = primaryHsl;
    vars["--primary-foreground"] = isColorDark(branding.primaryColor)
      ? "0 0% 100%"
      : "0 0% 9%";
    vars["--ring"] = primaryHsl;
  }
  const secondaryHsl = hexToHslString(branding.secondaryColor);
  if (secondaryHsl) {
    vars["--accent"] = secondaryHsl;
  }
  return vars as React.CSSProperties;
}