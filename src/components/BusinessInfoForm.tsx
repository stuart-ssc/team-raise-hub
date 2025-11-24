import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Building2 } from "lucide-react";

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
  onBusinessSelected: (businessId: string, isNew: boolean) => void;
  onSkip?: () => void;
}

export function BusinessInfoForm({ organizationId, onBusinessSelected, onSkip }: BusinessInfoFormProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState<BusinessMatch[]>([]);
  const [showNewBusinessForm, setShowNewBusinessForm] = useState(false);
  const [searching, setSearching] = useState(false);
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

  const handleSelectBusiness = async (businessId: string) => {
    onBusinessSelected(businessId, false);
  };

  const handleCreateBusiness = async () => {
    try {
      // Create new business
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
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
        })
        .select()
        .single();

      if (businessError) throw businessError;

      // Link to organization
      await supabase
        .from('organization_businesses')
        .insert({
          organization_id: organizationId,
          business_id: business.id,
        });

      onBusinessSelected(business.id, true);

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
    }
  };

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
                    onClick={() => handleSelectBusiness(match.id)}
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
                <Input
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
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
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
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
                disabled={!formData.business_name || !formData.business_email}
                className="flex-1"
              >
                Create Business
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
