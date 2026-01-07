import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share2, Download, Printer, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ChildSummary {
  id: string;
  firstName: string;
  lastName: string;
  groupName: string | null;
  totalRaised: number;
  supporters: number;
  bestRank: number | null;
}

interface FamilySummaryCardProps {
  totalRaised: number;
  totalSupporters: number;
  activeCampaigns: number;
  children: ChildSummary[];
  familyName?: string;
}

const FamilySummaryCard = ({
  totalRaised,
  totalSupporters,
  activeCampaigns,
  children,
  familyName = "Our Family",
}: FamilySummaryCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    setIsDownloading(true);
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = 'family-fundraising-summary.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Image downloaded!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to download image');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Family Fundraising Summary</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Failed to create image');
          return;
        }
        
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], 'family-fundraising.png', { type: 'image/png' });
          
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: `${familyName}'s Fundraising Progress`,
                text: `We've raised $${totalRaised.toFixed(2)} with ${totalSupporters} amazing supporters! Thank you for your support! 🙏`,
                files: [file],
              });
              return;
            } catch (err) {
              // Fallback if share fails
            }
          }
        }
        
        // Fallback: copy image to clipboard or download
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          toast.success('Image copied to clipboard!');
        } catch {
          // If clipboard fails, just download
          handleDownload();
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Create Shareable Summary
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Family Fundraising Summary</DialogTitle>
        </DialogHeader>
        
        {/* Shareable Card */}
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-primary via-primary/90 to-chart-2 rounded-2xl p-6 text-white shadow-xl"
          style={{ aspectRatio: '1.91/1' }} // Standard social media card ratio
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm font-medium">🏆 Fundraising Update</p>
              <h2 className="text-2xl font-bold">{familyName}</h2>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
              {activeCampaigns} Campaign{activeCampaigns !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Main Stats */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-4xl font-bold">${totalRaised.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                <p className="text-white/80 text-sm">Total Raised</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold">{totalSupporters}</p>
                <p className="text-white/80 text-sm">Supporters</p>
              </div>
            </div>
          </div>

          {/* Children */}
          <div className="flex items-center gap-2 flex-wrap">
            {children.slice(0, 4).map((child) => (
              <div key={child.id} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full pl-1 pr-3 py-1">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-white text-primary text-xs font-bold">
                    {getInitials(child.firstName, child.lastName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{child.firstName}</span>
                {child.bestRank && child.bestRank <= 3 && (
                  <span className="text-yellow-300">
                    {child.bestRank === 1 ? '🥇' : child.bestRank === 2 ? '🥈' : '🥉'}
                  </span>
                )}
              </div>
            ))}
            {children.length > 4 && (
              <span className="text-sm text-white/80">+{children.length - 4} more</span>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
            <p className="text-white/60 text-xs">Thank you for your support! ❤️</p>
            <p className="text-white/60 text-xs font-medium">sponsorly.org</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Generating...' : 'Download'}
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FamilySummaryCard;
