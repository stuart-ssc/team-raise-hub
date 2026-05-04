import { ReactNode } from "react";
import { brandingStyleVars, ResolvedBranding } from "@/lib/campaignBranding";

interface Props {
  branding?: ResolvedBranding;
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a campaign landing template and applies the resolved branding
 * (group → organization → school → template) by overriding the
 * --primary / --accent CSS variables for everything inside.
 */
export function BrandedLandingWrapper({ branding, children, className }: Props) {
  const style = branding ? brandingStyleVars(branding) : undefined;
  return (
    <div style={style} className={className} data-branded-source={branding?.source}>
      {children}
    </div>
  );
}

interface BrandLogoProps {
  branding?: ResolvedBranding;
  orgName?: string | null;
  className?: string;
  /** "dark" hero (light text) vs "light" hero — affects fallback name color */
  variant?: "dark" | "light";
}

/** Top-of-hero strip rendering the brand's logo (and name) when available. */
export function BrandLogoStrip({ branding, orgName, className, variant = "dark" }: BrandLogoProps) {
  if (!branding?.logoUrl && !orgName) return null;
  const textCls = variant === "dark" ? "text-background/90" : "text-foreground/90";
  return (
    <div className={`flex items-center gap-3 ${className || ""}`}>
      {branding?.logoUrl && (
        <div className="h-10 w-10 md:h-12 md:w-12 rounded-md bg-white/95 p-1 flex items-center justify-center overflow-hidden shadow-sm">
          <img
            src={branding.logoUrl}
            alt={orgName || "Logo"}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
      {orgName && (
        <span className={`text-sm md:text-base font-semibold ${textCls}`}>
          {orgName}
        </span>
      )}
    </div>
  );
}