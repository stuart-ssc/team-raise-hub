import { useState, useMemo } from "react";
import { Upload, X, CheckCircle2, AlertCircle, Send, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ParsedRow {
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  rowError?: string;
}

interface UserType {
  id: string;
  name: string;
}

interface BulkRosterUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  groupId: string;
  rosterId: number | null;
  organizationType: "school" | "nonprofit";
  groupTypeName: string;
  onSuccess: () => void;
}

export const BulkRosterUpload = ({
  open,
  onOpenChange,
  organizationId,
  groupId,
  rosterId,
  organizationType,
  groupTypeName,
  onSuccess,
}: BulkRosterUploadProps) => {
  const [step, setStep] = useState<"upload" | "preview" | "confirm" | "result">("upload");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [defaultUserTypeId, setDefaultUserTypeId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [resultSummary, setResultSummary] = useState<any>(null);
  const [resultRows, setResultRows] = useState<any[]>([]);

  const allowedTypeNames = useMemo(() => {
    if (organizationType === "nonprofit") {
      return ["Volunteer", "Program Director", "Board Member"];
    }
    if (groupTypeName === "Sports Team") {
      return ["Team Player", "Family Member", "Coach", "Booster Leader"];
    }
    return ["Club Participant", "Family Member", "Club Sponsor"];
  }, [organizationType, groupTypeName]);

  const defaultTypeName = useMemo(
    () => (organizationType === "nonprofit" ? "Volunteer" : groupTypeName === "Sports Team" ? "Team Player" : "Club Participant"),
    [organizationType, groupTypeName],
  );

  const loadUserTypes = async () => {
    const { data } = await supabase
      .from("user_type")
      .select("id, name")
      .in("name", allowedTypeNames);
    if (data) {
      setUserTypes(data);
      const def = data.find((t) => t.name === defaultTypeName) ?? data[0];
      if (def) setDefaultUserTypeId(def.id);
    }
  };

  const reset = () => {
    setStep("upload");
    setRows([]);
    setResultSummary(null);
    setResultRows([]);
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      toast({ title: "Empty file", description: "No rows found", variant: "destructive" });
      return;
    }
    // Parse header
    const splitCSV = (line: string) => {
      const out: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === "," && !inQuotes) {
          out.push(cur);
          cur = "";
        } else {
          cur += ch;
        }
      }
      out.push(cur);
      return out.map((c) => c.trim());
    };
    const header = splitCSV(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
    const idx = {
      firstName: header.findIndex((h) => h === "firstname" || h === "first"),
      lastName: header.findIndex((h) => h === "lastname" || h === "last"),
      email: header.findIndex((h) => h === "email" || h === "emailaddress"),
      role: header.findIndex((h) => h === "role" || h === "type" || h === "position"),
    };
    if (idx.firstName < 0 || idx.lastName < 0 || idx.email < 0) {
      toast({
        title: "Invalid CSV",
        description: "CSV must have headers: first_name, last_name, email (role optional)",
        variant: "destructive",
      });
      return;
    }
    const seen = new Set<string>();
    const parsed: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = splitCSV(lines[i]);
      const email = (cells[idx.email] || "").toLowerCase();
      let rowError: string | undefined;
      if (!email) rowError = "Missing email";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) rowError = "Invalid email";
      else if (seen.has(email)) rowError = "Duplicate in file";
      seen.add(email);
      parsed.push({
        firstName: cells[idx.firstName] || "",
        lastName: cells[idx.lastName] || "",
        email,
        role: idx.role >= 0 ? cells[idx.role] : undefined,
        rowError,
      });
    }
    setRows(parsed);
    await loadUserTypes();
    setStep("preview");
  };

  const submit = async (sendNow: boolean) => {
    setSubmitting(true);
    try {
      const validRows = rows.filter((r) => !r.rowError);
      const { data, error } = await supabase.functions.invoke("bulk-invite-roster", {
        body: {
          organizationId,
          groupId,
          rosterId,
          defaultUserTypeId,
          sendInvites: sendNow,
          members: validRows.map((r) => ({
            firstName: r.firstName,
            lastName: r.lastName,
            email: r.email,
          })),
        },
      });
      if (error) throw error;
      setResultSummary((data as any)?.summary ?? null);
      setResultRows((data as any)?.results ?? []);
      setStep("result");
      toast({ title: "Done", description: `Processed ${validRows.length} rows` });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const validCount = rows.filter((r) => !r.rowError).length;
  const errorCount = rows.length - validCount;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          if (step === "result") onSuccess();
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk upload roster</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: <code>first_name, last_name, email</code> (and optional <code>role</code>).
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Drop a CSV file here or browse
                </p>
                <Input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground">
              Example header: <code>first_name,last_name,email</code>
            </p>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-3 text-sm">
                <span className="flex items-center gap-1 text-green-700">
                  <CheckCircle2 className="h-4 w-4" /> {validCount} valid
                </span>
                {errorCount > 0 && (
                  <span className="flex items-center gap-1 text-rose-600">
                    <AlertCircle className="h-4 w-4" /> {errorCount} invalid
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="defaultRole" className="text-xs">Default role</Label>
                <Select value={defaultUserTypeId} onValueChange={setDefaultUserTypeId}>
                  <SelectTrigger id="defaultRole" className="w-44">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {userTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Email</th>
                    <th className="text-left px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={r.rowError ? "bg-rose-50/40" : ""}>
                      <td className="px-3 py-1.5">{r.firstName} {r.lastName}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{r.email}</td>
                      <td className="px-3 py-1.5">
                        {r.rowError ? (
                          <span className="text-rose-600 text-xs">{r.rowError}</span>
                        ) : (
                          <span className="text-green-700 text-xs">Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setStep("upload")}>Back</Button>
              <Button
                variant="outline"
                disabled={validCount === 0 || submitting || !defaultUserTypeId}
                onClick={() => submit(false)}
              >
                <Save className="h-4 w-4 mr-2" /> Save without inviting
              </Button>
              <Button
                disabled={validCount === 0 || submitting || !defaultUserTypeId}
                onClick={() => submit(true)}
              >
                <Send className="h-4 w-4 mr-2" /> Save and send invites
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "result" && resultSummary && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded border p-3">
                <div className="text-2xl font-semibold">{resultSummary.total}</div>
                <div className="text-xs text-muted-foreground">Processed</div>
              </div>
              <div className="rounded border p-3">
                <div className="text-2xl font-semibold text-green-700">{resultSummary.invited}</div>
                <div className="text-xs text-muted-foreground">Invites sent</div>
              </div>
              <div className="rounded border p-3">
                <div className="text-2xl font-semibold text-rose-600">{resultSummary.errors}</div>
                <div className="text-xs text-muted-foreground">Errors</div>
              </div>
            </div>
            {resultRows.some((r: any) => r.error) && (
              <div className="max-h-56 overflow-y-auto border rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2">Email</th>
                      <th className="text-left px-3 py-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultRows.filter((r: any) => r.error).map((r: any, i: number) => (
                      <tr key={i}>
                        <td className="px-3 py-1.5">{r.email}</td>
                        <td className="px-3 py-1.5 text-rose-600">{r.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => { onOpenChange(false); reset(); onSuccess(); }}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
