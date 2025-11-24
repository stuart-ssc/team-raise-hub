import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Hash function to generate consistent colors for tags
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Generate consistent HSL color for a tag
export function getTagColor(tag: string): string {
  const hash = hashString(tag.toLowerCase());
  const hue = hash % 360;
  // Use consistent saturation and lightness for better readability
  return `hsl(${hue}, 65%, 45%)`;
}

// Generate consistent background color for a tag badge
export function getTagBgColor(tag: string): string {
  const hash = hashString(tag.toLowerCase());
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 95%)`;
}
