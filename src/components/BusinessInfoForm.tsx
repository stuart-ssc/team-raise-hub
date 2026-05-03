import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Building2 } from "lucide-react";

const INDUSTRIES = [
  "Agriculture",
  "Automotive",
  "Banking & Finance",
  "Construction",
  "Education",
  "Entertainment",
  "Food & Beverage",
  "Healthcare",
  "Hospitality",
  "Insurance",
  "Legal Services",
  "Manufacturing",
  "Media",
  "Non-Profit",
  "Professional Services",
  "Real Estate",
  "Retail",
  "Technology",
  "Transportation",
  "Utilities",
  "Other"
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

interface BusinessMatch {
  id: string;
  business_name: string;
  business_email: string;
  ein: string;
  confidence: number;
  matchReason: string;
}

interface BusinessInfoFormProps {
  organizationId: string;
  onBusinessSelected: (businessId: string, isNew: boolean, businessName: string) => void;
  onSkip?: () => void;
  logoFile?: File | null;
}

export function BusinessInfoForm({ organizationId, onBusinessSelected, onSkip, logoFile }: BusinessInfoFormProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState<BusinessMatch[]>([]);
  const [showNewBusinessForm, setShowNewBusinessForm] = useState(false);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "",
    ein: "",
    business_email: "",
    business_phone: "",
    website_url: "",
    industry: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip: "",
    role: "",
  });

  const searchBusinesses = async () => {
    if (!searchQuery) return;

    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('match-business', {
        body: { 
          businessData: {
            business_name: searchQuery,
            business_email: formData.business_email,
          }
        }
      });

      if (error) throw error;

      setMatches(data.matches || []);
    } catch (error) {
      console.error('Error searching businesses:', error);
      toast({
        title: "Error",
        description: "Failed to search for businesses",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectBusiness = async (match: BusinessMatch) => {
    if (logoFile) {
      try {
        const url = await uploadBusinessLogo(match.id, logoFile);
        if (url) {
          await supabase.functions.invoke('process-checkout-business', {
            body: { businessId: match.id, logoUrl: url, organizationId },
          });
        }
      } catch (e) {
        console.error('Logo upload failed:', e);
      }
    }
    onBusinessSelected(match.id, false, match.business_name);
  };

  const handleCreateBusiness = async () => {
    setCreating(true);
    try {
      // Use edge function to bypass RLS
      const { data, error } = await supabase.functions.invoke('process-checkout-business', {
        body: {
          organizationId,
          newBusinessData: {
            business_name: formData.business_name,
            ein: formData.ein || null,
            business_email: formData.business_email,
            business_phone: formData.business_phone || null,
            website_url: formData.website_url || null,
            industry: formData.industry || null,
            address_line1: formData.address_line1 || null,
            address_line2: formData.address_line2 || null,
            city: formData.city || null,
            state: formData.state || null,
            zip: formData.zip || null,
          }
        }
      });

      if (error) throw error;

      if (logoFile && data.businessId) {
        try {
          const url = await uploadBusinessLogo(data.businessId, logoFile);
          if (url) {
            await supabase.functions.invoke('process-checkout-business', {
              body: { businessId: data.businessId, logoUrl: url, organizationId },
            });
          }
        } catch (e) {
          console.error('Logo upload failed:', e);
        }
      }

      onBusinessSelected(data.businessId, true, formData.business_name);

      toast({
        title: "Success",
        description: "Business created successfully!",
      });
    } catch (error) {
      console.error('Error creating business:', error);
      toast({
        title: "Error",
        description: "Failed to create business",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  async function uploadBusinessLogo(businessId: string, file: File): Promise<string | null> {
    const ext = file.name.split('.').pop() || 'png';
    const path = `${businessId}/logo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) {
      console.error('Logo upload error:', upErr);
      return null;
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    return publicUrl;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Business Information</h3>
        
        {!showNewBusinessForm ? (
          <div className="space-y-4">
            <div>
              <Label>Search for your business</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Business name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchBusinesses()}
                />
                <Button onClick={searchBusinesses} disabled={searching}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {matches.length > 0 && (
              <div className="space-y-2">
                <Label>Found matches:</Label>
                {matches.map((match) => (
                  <Card 
                    key={match.id}
                    className="p-4 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleSelectBusiness(match)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{match.business_name}</div>
                        <div className="text-sm text-muted-foreground">{match.business_email}</div>
                        {match.ein && (
                          <div className="text-sm text-muted-foreground">EIN: {match.ein}</div>
                        )}
                      </div>
                      <div className="text-sm font-medium text-primary">
                        {match.confidence}% match
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {match.matchReason}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={() => setShowNewBusinessForm(true)}
              className="w-full"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Not listed? Add new business
            </Button>

            {onSkip && (
              <Button variant="ghost" onClick={onSkip} className="w-full">
                Skip for now
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Business Name *</Label>
                <Input
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label>EIN / Tax ID</Label>
                <Input
                  value={formData.ein}
                  onChange={(e) => setFormData({ ...formData, ein: e.target.value })}
                />
              </div>

              <div>
                <Label>Business Email *</Label>
                <Input
                  type="email"
                  value={formData.business_email}
                  onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Business Phone</Label>
                <Input
                  type="tel"
                  value={formData.business_phone}
                  onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                />
              </div>

              <div>
                <Label>Website URL</Label>
                <Input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <Label>Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label>Address Line 1</Label>
                <Input
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <Label>Address Line 2</Label>
                <Input
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                />
              </div>

              <div>
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div>
                <Label>State</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>ZIP Code</Label>
                <Input
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                />
              </div>

              <div>
                <Label>Your Role at Company</Label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Owner, Manager"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCreateBusiness}
                disabled={!formData.business_name || !formData.business_email || creating}
                className="flex-1"
              >
                {creating ? "Creating..." : "Create Business"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowNewBusinessForm(false)}
              >
                Back to Search
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
