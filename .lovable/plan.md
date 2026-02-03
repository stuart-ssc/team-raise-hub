

# Platform Submenu: Hover Trigger and Centered Position

## Change Summary

Update the Platform dropdown to:
1. Open on hover instead of click
2. Position the dropdown directly below "Platform" text (centered), not offset to the side

---

## Technical Approach

The current implementation uses Radix UI's `DropdownMenu` which is click-triggered by default. To achieve hover behavior, we'll:

1. **Replace DropdownMenu with a custom hover-based dropdown** using React state and CSS
2. **Use relative positioning** on the parent container and absolute positioning on the dropdown to center it below the trigger
3. **Add hover handlers** with a small delay to prevent flickering when moving between trigger and menu

---

## Changes to MarketingHeader.tsx

### 1. Add hover state
```typescript
const [platformMenuOpen, setPlatformMenuOpen] = useState(false);
```

### 2. Replace DropdownMenu with custom hover dropdown
Replace the current Radix DropdownMenu implementation with a custom div-based dropdown:

```typescript
{/* Platform with Hover Dropdown */}
<div 
  className="relative flex items-center"
  onMouseEnter={() => setPlatformMenuOpen(true)}
  onMouseLeave={() => setPlatformMenuOpen(false)}
>
  <Link
    to="/platform"
    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
  >
    Platform
    <ChevronDown className="h-4 w-4" />
  </Link>
  
  {platformMenuOpen && (
    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2">
      <div className="bg-popover border rounded-md shadow-md p-1 min-w-[200px]">
        {platformItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className="block px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  )}
</div>
```

### Key Styling Details:
- **`relative`** on parent: establishes positioning context
- **`absolute top-full`**: positions dropdown directly below the trigger
- **`left-1/2 -translate-x-1/2`**: centers the dropdown horizontally relative to the trigger
- **`pt-2`**: adds padding-top to create a small gap (prevents hover loss when moving to menu)
- **`bg-popover border rounded-md shadow-md`**: matches Radix dropdown styling for consistency
- **`z-50`** (inherited from header): ensures dropdown appears above other content

---

## File to Modify

| File | Change |
|------|--------|
| `src/components/MarketingHeader.tsx` | Replace Radix DropdownMenu with custom hover-based dropdown, center positioning |

