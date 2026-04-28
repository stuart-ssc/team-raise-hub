import { useState } from "react";
import { Copy, Check, Facebook, Twitter, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ShareHubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
}

const ShareHubDialog = ({ open, onOpenChange, url, title }: ShareHubDialogProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copied", description: "Paste it on your website or social media." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Please copy the link manually.", variant: "destructive" });
    }
  };

  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(`Support ${title}`);
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
  const tw = `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`;
  const mail = `mailto:?subject=${encodedTitle}&body=${encoded}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this page</DialogTitle>
          <DialogDescription>
            Anyone with this link can view your fundraisers and support them.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input value={url} readOnly onFocus={(e) => e.currentTarget.select()} />
          <Button onClick={copy} variant="default">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={fb} target="_blank" rel="noopener noreferrer">
              <Facebook className="mr-2 h-4 w-4" /> Facebook
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={tw} target="_blank" rel="noopener noreferrer">
              <Twitter className="mr-2 h-4 w-4" /> X / Twitter
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={mail}>
              <Mail className="mr-2 h-4 w-4" /> Email
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareHubDialog;