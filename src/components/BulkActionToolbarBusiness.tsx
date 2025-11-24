import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Archive, Trash2, Download, X, Tag, Mail, ArchiveRestore } from "lucide-react";

interface BulkActionToolbarBusinessProps {
  selectedCount: number;
  onClearSelection: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onExportCsv: () => void;
  onAddTags: () => void;
  onSendEmail: () => void;
  selectedBusinessesStatus: 'active' | 'archived' | 'mixed';
}

const BulkActionToolbarBusiness = ({
  selectedCount,
  onClearSelection,
  onArchive,
  onRestore,
  onDelete,
  onExportCsv,
  onAddTags,
  onSendEmail,
  selectedBusinessesStatus,
}: BulkActionToolbarBusinessProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-primary text-primary-foreground shadow-lg rounded-lg px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {selectedCount}
          </Badge>
          <span className="font-medium">
            {selectedCount === 1 ? "business selected" : "businesses selected"}
          </span>
        </div>

        <div className="h-6 w-px bg-primary-foreground/20" />

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onAddTags}
            className="gap-2"
          >
            <Tag className="h-4 w-4" />
            Add Tags
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onSendEmail}
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            Send Email
          </Button>

          {selectedBusinessesStatus === 'active' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onArchive}
              className="gap-2"
            >
              <Archive className="h-4 w-4" />
              Archive
            </Button>
          )}

          {selectedBusinessesStatus === 'archived' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRestore}
              className="gap-2"
            >
              <ArchiveRestore className="h-4 w-4" />
              Restore
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={onDelete}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onExportCsv}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="h-6 w-px bg-primary-foreground/20" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="gap-2 hover:bg-primary-foreground/10"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
};

export default BulkActionToolbarBusiness;
