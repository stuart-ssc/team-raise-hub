// A/B Testing utilities for consistent variant selection

export type LandingPageVariant = 'A' | 'B' | 'C';

/**
 * Generates a consistent variant for a given entity ID.
 * Uses a simple hash to ensure the same entity always gets the same variant.
 */
export function getVariantForEntity(entityId: string): LandingPageVariant {
  // Simple hash function - sum of char codes
  let hash = 0;
  for (let i = 0; i < entityId.length; i++) {
    const char = entityId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const variants: LandingPageVariant[] = ['A', 'B', 'C'];
  const index = Math.abs(hash) % variants.length;
  return variants[index];
}

/**
 * Gets variant display name for analytics
 */
export function getVariantDisplayName(variant: LandingPageVariant): string {
  switch (variant) {
    case 'A':
      return 'Hero-Focused';
    case 'B':
      return 'Stats-First';
    case 'C':
      return 'Social Proof';
    default:
      return 'Default';
  }
}
