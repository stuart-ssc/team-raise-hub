import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  campaignName: string;
}

export function QRDialog({ open, onOpenChange, url, campaignName }: QRDialogProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Share it anywhere." });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById("player-qr-svg") as unknown as SVGSVGElement | null;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${campaignName.replace(/\s+/g, "-").toLowerCase()}-qr.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>My QR Code</DialogTitle>
          <DialogDescription>
            Have supporters scan this with their phone camera to open your fundraising page.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="rounded-lg border bg-white p-4">
            <QRCodeSVG
              id="player-qr-svg"
              value={url}
              size={240}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center break-all px-4">{url}</p>
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" /> Copy Link
            </Button>
            <Button variant="default" className="flex-1" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
