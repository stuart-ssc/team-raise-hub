import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, Image as ImageIcon, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface QRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  campaignName: string;
  participantName?: string;
  shortCode?: string;
  shortUrl?: string;
  scanStats?: { today: number; lastScannedRelative?: string };
  /** Best brand logo for the PDF poster (team → school → org → Sponsorly fallback). */
  logoUrl?: string;
  /** School name (for school groups) or organization name (for nonprofits). Used in PDF title. */
  schoolOrOrgName?: string | null;
  /** Group/team name. Used in PDF title. */
  groupName?: string | null;
  /** Campaign description rendered under the PDF title. */
  campaignDescription?: string | null;
}

const SPONSORLY_FALLBACK_LOGO = "/lovable-uploads/Sponsorly-Logo.png";

/**
 * Returns the first non-empty logo URL in the priority order:
 * group (team) → school → organization. Returns undefined when none exist,
 * so the dialog can fall back to the Sponsorly logo.
 */
export function pickBrandLogo(opts: {
  groupLogo?: string | null;
  schoolLogo?: string | null;
  orgLogo?: string | null;
}): string | undefined {
  const candidates = [opts.groupLogo, opts.schoolLogo, opts.orgLogo];
  for (const c of candidates) {
    if (c && typeof c === "string" && c.trim()) return c.trim();
  }
  return undefined;
}

async function loadImageAsPngDataUrl(
  url: string,
  maxW: number,
  maxH: number
): Promise<{ dataUrl: string; width: number; height: number }> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(e);
    img.src = url;
  });
  const naturalW = img.naturalWidth || img.width || maxW;
  const naturalH = img.naturalHeight || img.height || maxH;
  const scale = Math.min(maxW / naturalW, maxH / naturalH, 1);
  const targetW = Math.max(1, Math.round(naturalW * scale));
  const targetH = Math.max(1, Math.round(naturalH * scale));
  // Render at 2x for crispness in print
  const canvas = document.createElement("canvas");
  canvas.width = targetW * 2;
  canvas.height = targetH * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { dataUrl: canvas.toDataURL("image/png"), width: targetW, height: targetH };
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "qr";

const stripProtocol = (u: string) => u.replace(/^https?:\/\//i, "").replace(/\/$/, "");

async function svgToPngDataUrl(svg: SVGSVGElement, size: number): Promise<string> {
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svg);
  const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const blobUrl = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = blobUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export function QRDialog({
  open,
  onOpenChange,
  url,
  campaignName,
  participantName,
  shortCode,
  shortUrl,
  scanStats,
  logoUrl,
  schoolOrOrgName,
  groupName,
  campaignDescription,
}: QRDialogProps) {
  const { toast } = useToast();
  const qrWrapRef = useRef<HTMLDivElement>(null);

  const displayShortUrl = shortUrl || stripProtocol(url);
  const subjectName = participantName?.trim();
  const subtitle = subjectName
    ? `Scan to support ${subjectName} — ${campaignName}`
    : `Scan to support ${campaignName}`;
  const fileBase = `${slugify(campaignName)}${subjectName ? `-${slugify(subjectName)}` : ""}`;

  const getSvg = (): SVGSVGElement | null => {
    return qrWrapRef.current?.querySelector("svg") ?? null;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Share it anywhere." });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const handleDownloadPng = async () => {
    const svg = getSvg();
    if (!svg) return;
    try {
      const dataUrl = await svgToPngDataUrl(svg, 1024);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${fileBase}-qr.png`;
      a.click();
      toast({ title: "QR image downloaded" });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  const handleDownloadPdf = async () => {
    const svg = getSvg();
    if (!svg) return;
    try {
      const dataUrl = await svgToPngDataUrl(svg, 1200);
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Branded logo at the top (team → school → org → Sponsorly fallback)
      const LOGO_MAX_W = 200;
      const LOGO_MAX_H = 64;
      const LOGO_TOP_Y = 40;
      const LOGO_BLOCK_BOTTOM = LOGO_TOP_Y + LOGO_MAX_H + 16; // reserved space below logo
      let logoLoaded = false;
      const tryDrawLogo = async (src: string) => {
        const { dataUrl: logoDataUrl, width, height } = await loadImageAsPngDataUrl(
          src,
          LOGO_MAX_W,
          LOGO_MAX_H
        );
        const x = (pageWidth - width) / 2;
        doc.addImage(logoDataUrl, "PNG", x, LOGO_TOP_Y, width, height);
        logoLoaded = true;
      };
      if (logoUrl) {
        try {
          await tryDrawLogo(logoUrl);
        } catch {
          // CORS/network failure — fall through to Sponsorly fallback
        }
      }
      if (!logoLoaded) {
        try {
          await tryDrawLogo(SPONSORLY_FALLBACK_LOGO);
        } catch {
          // If even the fallback fails (offline), continue without a logo
        }
      }

      // Title
      const titleY = LOGO_BLOCK_BOTTOM + 36;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      const title = subjectName
        ? `Support ${subjectName}`
        : `Support ${campaignName}`;
      doc.text(title, pageWidth / 2, titleY, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(16);
      doc.setTextColor(90);
      doc.text(campaignName, pageWidth / 2, titleY + 30, { align: "center" });
      doc.setTextColor(0);

      // QR
      const qrSize = 360;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = titleY + 70;
      doc.addImage(dataUrl, "PNG", qrX, qrY, qrSize, qrSize);

      // Scan instruction
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("Scan with your phone camera", pageWidth / 2, qrY + qrSize + 50, {
        align: "center",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(90);
      doc.text(displayShortUrl, pageWidth / 2, qrY + qrSize + 78, { align: "center" });

      // Footer
      doc.setFontSize(11);
      doc.setTextColor(140);
      doc.text("sponsorly.io", pageWidth / 2, pageHeight - 36, { align: "center" });

      doc.save(`${fileBase}-poster.pdf`);
      toast({ title: "Poster downloaded" });
    } catch {
      toast({ title: "PDF generation failed", variant: "destructive" });
    }
  };

  const badgeText = shortCode ? `SCAN ME · ${shortCode}` : "SCAN ME";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Your personal QR code</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-2 md:grid-cols-2">
          {/* Left: framed QR */}
          <div className="flex flex-col items-center">
            <div className="relative w-full">
              <div
                ref={qrWrapRef}
                className="rounded-xl border bg-white p-6 flex items-center justify-center"
              >
                <QRCodeSVG
                  value={url}
                  size={220}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold tracking-wide text-white shadow-sm">
                {badgeText}
              </span>
            </div>
            <p className="mt-4 break-all px-2 text-center text-xs text-muted-foreground">
              {displayShortUrl}
            </p>
          </div>

          {/* Right: CTAs */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold leading-tight">
              Print it. Post it. Show it.
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Hand out the poster at events, pin it to a bulletin board, or drop the
              image into a text. Every scan opens your fundraising page in one tap.
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <Button onClick={handleDownloadPdf} className="w-full">
                <FileDown className="h-4 w-4 mr-2" />
                Download poster (PDF)
              </Button>
              <Button variant="outline" onClick={handleDownloadPng} className="w-full">
                <ImageIcon className="h-4 w-4 mr-2" />
                Download QR image
              </Button>
              <Button variant="outline" onClick={handleCopy} className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Copy short link
              </Button>
            </div>

            {scanStats && (
              <div className="mt-5 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                {scanStats.today} scan{scanStats.today === 1 ? "" : "s"} today
                {scanStats.lastScannedRelative
                  ? ` · last scanned ${scanStats.lastScannedRelative}`
                  : ""}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}