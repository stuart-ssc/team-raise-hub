
# Add Color to the FAQ Page

## Changes (single file: `src/pages/FAQ.tsx`)

### 1. Hero Section -- Use primary blue background
Replace the current `bg-muted/30` hero with a bold `bg-primary text-primary-foreground` section, matching the Contact page pattern. The subtitle will use `text-primary-foreground/90` for slight transparency.

### 2. Category Navigation Chips -- Active-looking colored chips
Give each chip a light blue tint by default (`bg-primary/5 border-primary/20 text-primary`) and a stronger hover state (`hover:bg-primary/10`). This makes them feel interactive and ties them to the brand color.

### 3. Category Section Icons -- Larger, more colorful
The icon badges next to each section heading already use `bg-primary/10 text-primary`, which is good. No change needed there.

### 4. Bottom CTA Section -- Primary blue background
Change the "Still have questions?" section from `bg-muted/30` to `bg-primary text-primary-foreground` with a white outline button, matching the Contact page CTA style and creating a strong visual bookend.

## Technical Details

**File:** `src/pages/FAQ.tsx`

- Hero `<section>`: Change classes from `border-b bg-muted/30 py-16 sm:py-20` to `bg-primary text-primary-foreground py-16 sm:py-20`
- Hero subtitle `<p>`: Change from `text-muted-foreground` to `text-primary-foreground/80`
- Hero heading `<h1>`: Change from `text-foreground` to `text-primary-foreground`
- Category chips `<a>`: Change from neutral border/text to `bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40`
- Bottom CTA `<section>`: Change from `border-t bg-muted/30` to `bg-primary text-primary-foreground`
- Bottom CTA heading: Change from `text-foreground` to `text-primary-foreground`
- Bottom CTA paragraph: Change from `text-muted-foreground` to `text-primary-foreground/80`
- Bottom CTA button: Add `variant="outline"` with `className="bg-white text-primary hover:bg-white/90 border-white"`
