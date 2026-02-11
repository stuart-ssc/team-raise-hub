import { useState, useRef } from "react";
import Papa from "papaparse";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getStateSlug, stateNames } from "@/lib/stateUtils";
import { Upload, Download, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "upload" | "map" | "results";

interface MatchResult {
  total: number;
  matched: number;
  notFound: number;
  enrichedData: Record<string, string>[];
  headers: string[];
}

export const SchoolUrlMatcherDialog = ({ open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [schoolNameCol, setSchoolNameCol] = useState("");
  const [stateCol, setStateCol] = useState("");
  const [matching, setMatching] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);

  const reset = () => {
    setStep("upload");
    setCsvData([]);
    setHeaders([]);
    setSchoolNameCol("");
    setStateCol("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data.length || !results.meta.fields?.length) {
          toast({ title: "Error", description: "CSV appears empty or has no headers.", variant: "destructive" });
          return;
        }
        setCsvData(results.data);
        setHeaders(results.meta.fields);
        setSchoolNameCol(results.meta.fields[0]);
        setStep("map");
      },
      error: () => {
        toast({ title: "Error", description: "Failed to parse CSV file.", variant: "destructive" });
      },
    });
  };

  const normalizeSchoolName = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();

  const resolveStateAbbr = (val: string): string | null => {
    const upper = val.trim().toUpperCase();
    if (stateNames[upper]) return upper;
    // Try matching full name
    const entry = Object.entries(stateNames).find(
      ([, name]) => name.toLowerCase() === val.trim().toLowerCase()
    );
    return entry ? entry[0] : null;
  };

  const handleMatch = async () => {
    if (!schoolNameCol) return;
    setMatching(true);

    try {
      // Determine if we're filtering by a single state
      let stateFilter: string | null = null;
      if (stateCol) {
        const stateValues = [...new Set(csvData.map((r) => r[stateCol]?.trim()).filter(Boolean))];
        if (stateValues.length === 1) {
          stateFilter = resolveStateAbbr(stateValues[0]);
        }
      }

      // Fetch schools from DB (paginate past the 1000 row limit)
      let allSchools: { school_name: string; slug: string; state: string | null; city: string | null }[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        let query = supabase.from("schools").select("school_name, slug, state, city").range(from, from + pageSize - 1);
        if (stateFilter) query = query.eq("state", stateFilter);
        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) break;
        allSchools = allSchools.concat(data);
        if (data.length < pageSize) break;
        from += pageSize;
      }

      // Build lookup map: normalized_name (+ state) -> { slug, state }
      const lookup = new Map<string, { slug: string; state: string }>();
      for (const s of allSchools) {
        if (!s.slug || !s.state) continue;
        const key = normalizeSchoolName(s.school_name) + "|" + s.state.toUpperCase();
        lookup.set(key, { slug: s.slug, state: s.state });
        // Also store without state for fallback
        const keyNoState = normalizeSchoolName(s.school_name);
        if (!lookup.has(keyNoState)) {
          lookup.set(keyNoState, { slug: s.slug, state: s.state });
        }
      }

      // Match each row
      let matched = 0;
      const enriched = csvData.map((row) => {
        const name = normalizeSchoolName(row[schoolNameCol] || "");
        const rowState = stateCol ? resolveStateAbbr(row[stateCol] || "") : null;

        let match: { slug: string; state: string } | undefined;
        if (rowState) {
          match = lookup.get(name + "|" + rowState);
        }
        if (!match) {
          match = lookup.get(name);
        }

        const newRow = { ...row };
        if (match) {
          matched++;
          const stateSlug = getStateSlug(match.state);
          newRow["landing_page_url"] = `https://sponsorly.io/schools/${stateSlug}/${match.slug}`;
          newRow["match_status"] = "matched";
        } else {
          newRow["landing_page_url"] = "";
          newRow["match_status"] = "not_found";
        }
        return newRow;
      });

      const enrichedHeaders = [...headers, "landing_page_url", "match_status"];
      setResult({
        total: csvData.length,
        matched,
        notFound: csvData.length - matched,
        enrichedData: enriched,
        headers: enrichedHeaders,
      });
      setStep("results");
    } catch (err) {
      console.error("Matching error:", err);
      toast({ title: "Error", description: "Failed to match schools. Check console for details.", variant: "destructive" });
    } finally {
      setMatching(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const csv = Papa.unparse(result.enrichedData, { columns: result.headers });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schools-with-urls.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Match Schools to Landing Pages</DialogTitle>
          <DialogDescription>
            Upload a CSV with school names to get matching landing page URLs appended.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed p-8 text-center space-y-3">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Select a CSV file to upload</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Choose File
              </Button>
            </div>
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found <strong>{csvData.length}</strong> rows and <strong>{headers.length}</strong> columns.
            </p>

            <div className="space-y-2">
              <Label>School Name Column *</Label>
              <Select value={schoolNameCol} onValueChange={setSchoolNameCol}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {headers.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>State Column (optional)</Label>
              <Select value={stateCol || "__none__"} onValueChange={(v) => setStateCol(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {headers.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={handleMatch} disabled={matching || !schoolNameCol}>
                {matching ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Matching...</> : "Match"}
              </Button>
            </div>
          </div>
        )}

        {step === "results" && result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-lg font-bold">{result.matched}</p>
                  <p className="text-xs text-muted-foreground">Matched</p>
                </div>
              </div>
              <div className="rounded-lg border p-3 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-lg font-bold">{result.notFound}</p>
                  <p className="text-xs text-muted-foreground">Not Found</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {result.matched} of {result.total} schools matched. Download the enriched CSV below — all original data is preserved with <code className="bg-muted px-1 rounded">landing_page_url</code> appended.
            </p>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={reset}>Start Over</Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
