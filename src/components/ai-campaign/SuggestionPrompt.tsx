import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CornerDownLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SuggestionOption {
  label: string;
  value: string;
}

interface SuggestionPromptProps {
  label?: string;
  options: SuggestionOption[];
  disabled?: boolean;
  onSelect: (label: string) => void;
  onDismiss: () => void;
}

export default function SuggestionPrompt({
  label,
  options,
  disabled,
  onSelect,
  onDismiss,
}: SuggestionPromptProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [options]);

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere when user is typing in an input/textarea
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
        return;
      }

      if (isTyping) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((s) => Math.min(s + 1, options.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((s) => Math.max(s - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const opt = options[selectedIndex];
        if (opt) onSelect(opt.label);
      } else if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < options.length) {
          e.preventDefault();
          onSelect(options[idx].label);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, selectedIndex, disabled, onSelect, onDismiss]);

  return (
    <div className="w-full rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
        <span className="text-xs font-medium text-muted-foreground">
          {label || "Choose an option"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onDismiss}
          aria-label="Dismiss suggestions"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ul className="divide-y">
        {options.map((opt, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <li key={opt.value}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(opt.label)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isSelected && "bg-accent text-accent-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex-shrink-0 inline-flex items-center justify-center h-5 w-5 rounded text-[11px] font-mono font-medium",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {idx + 1}
                </span>
                <span className="flex-1 truncate">{opt.label}</span>
                {isSelected && (
                  <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="px-3 py-2 border-t bg-muted/30 text-[11px] text-muted-foreground flex items-center justify-between gap-2">
        <span>↑↓ navigate · Enter select · Esc dismiss</span>
        <span className="hidden sm:inline">Or type your own answer below</span>
      </div>
    </div>
  );
}
