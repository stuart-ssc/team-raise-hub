/**
 * Calculate the total from order items (excludes platform fees)
 * This should be used instead of total_amount which includes fees
 */
export function calculateItemsTotal(items: any): number {
  if (!items) return 0;
  try {
    const parsed = typeof items === "string" ? JSON.parse(items) : items;
    if (Array.isArray(parsed)) {
      return parsed.reduce((sum, item) => {
        const price = item.price_at_purchase || item.price || 0;
        const quantity = item.quantity || 1;
        return sum + (price * quantity);
      }, 0);
    }
    return 0;
  } catch {
    return 0;
  }
}
