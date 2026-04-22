import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Mail, Facebook, Twitter, Instagram, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareMenuProps {
  url: string;
  title: string;
  text?: string;
  children: React.ReactNode;
}

export function ShareMenu({ url, title, text, children }: ShareMenuProps) {
  const [open, setOpen] = React.useState(false);
  const body = text ?? title;

  const close = () => setOpen(false);

  const openInNewTab = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const handleEmail = () => {
    const href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${body}\n\n${url}`)}`;
    window.location.href = href;
    close();
  };

  const handleFacebook = () => {
    openInNewTab(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
    close();
  };

  const handleTwitter = () => {
    openInNewTab(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`);
    close();
  };

  const handleInstagram = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied — paste into your Instagram story or DM");
    } catch {
      toast.error("Failed to copy link");
    }
    openInNewTab("https://www.instagram.com/");
    close();
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text: body, url });
    } catch {
      /* user cancelled */
    }
    close();
  };

  const hasNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const Item = ({
    icon: Icon,
    label,
    onClick,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1.5">
        <Item icon={Mail} label="Email" onClick={handleEmail} />
        <Item icon={Facebook} label="Facebook" onClick={handleFacebook} />
        <Item icon={Twitter} label="Twitter / X" onClick={handleTwitter} />
        <Item icon={Instagram} label="Instagram" onClick={handleInstagram} />
        {hasNativeShare && (
          <>
            <div className="my-1 h-px bg-border" />
            <Item icon={Share2} label="More…" onClick={handleNativeShare} />
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}