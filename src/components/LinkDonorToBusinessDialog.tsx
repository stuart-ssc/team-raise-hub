import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Search, User } from "lucide-react";
import { toast } from "sonner";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface LinkDonorToBusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId?: string;
  donorId?: string;
  organizationId: string;
  onSuccess: () => void;
}

interface Donor {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface Business {
  id: string;
  business_name: string;
  logo_url: string | null;
  ein: string | null;
}

export const LinkDonorToBusinessDialog = ({
  open,
  onOpenChange,
  businessId,
  donorId,
  organizationId,
  onSuccess,
}: LinkDonorToBusinessDialogProps) => {
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [role, setRole] = useState("");
  const [isPrimaryContact, setIsPrimaryContact] = useState(false);
  const [loading, setLoading] = useState(false);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [donorSearchOpen, setDonorSearchOpen] = useState(false);
  const [businessSearchOpen, setBusinessSearchOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setRole("");
      setIsPrimaryContact(false);
      setSearchQuery("");
      if (businessId) {
        searchDonors("");
      } else if (donorId) {
        searchBusinesses("");
      }
    }
  }, [open, businessId, donorId]);

  const searchDonors = async (query: string) => {
    try {
      let queryBuilder = supabase
        .from("donor_profiles")
        .select("id, email, first_name, last_name")
        .eq("organization_id", organizationId);

      if (query) {
        queryBuilder = queryBuilder.or(
          `email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`
        );
      }

      const { data, error } = await queryBuilder.limit(20);

      if (error) throw error;
      setDonors(data || []);
    } catch (error) {
      console.error("Error searching donors:", error);
    }
  };

  const searchBusinesses = async (query: string) => {
    try {
      let queryBuilder = supabase
        .from("businesses")
        .select(`
          id,
          business_name,
          logo_url,
          ein,
          organization_businesses!inner(organization_id)
        `)
        .eq("organization_businesses.organization_id", organizationId);

      if (query) {
        queryBuilder = queryBuilder.or(`business_name.ilike.%${query}%,ein.ilike.%${query}%`);
      }

      const { data, error } = await queryBuilder.limit(20);

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error("Error searching businesses:", error);
    }
  };

  const handleLink = async () => {
    const finalDonorId = donorId || selectedDonor?.id;
    const finalBusinessId = businessId || selectedBusiness?.id;

    if (!finalDonorId || !finalBusinessId) {
      toast.error("Please select both a donor and a business");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("link-donor-to-business", {
        body: {
          donorId: finalDonorId,
          businessId: finalBusinessId,
          organizationId,
          role: role || null,
          isPrimaryContact,
        },
      });

      if (error) throw error;

      toast.success("Employee linked to business successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error linking donor to business:", error);
      toast.error(error.message || "Failed to link employee to business");
    } finally {
      setLoading(false);
    }
  };

  const getDonorDisplayName = (donor: Donor) => {
    if (donor.first_name && donor.last_name) {
      return `${donor.first_name} ${donor.last_name}`;
    }
    return donor.email;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Link Employee to Business</DialogTitle>
          <DialogDescription>
            {businessId
              ? "Select an employee to link to this business"
              : "Select a business to link this employee to"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {businessId ? (
            <div className="space-y-2">
              <Label>Select Employee</Label>
              <Popover open={donorSearchOpen} onOpenChange={setDonorSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedDonor ? (
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {getDonorDisplayName(selectedDonor)}
                      </span>
                    ) : (
                      "Select employee..."
                    )}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search employees..."
                      onValueChange={(value) => {
                        setSearchQuery(value);
                        searchDonors(value);
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>No employees found.</CommandEmpty>
                      <CommandGroup>
                        {donors.map((donor) => (
                          <CommandItem
                            key={donor.id}
                            onSelect={() => {
                              setSelectedDonor(donor);
                              setDonorSearchOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {donor.first_name?.[0] || donor.email[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{getDonorDisplayName(donor)}</p>
                                <p className="text-xs text-muted-foreground">{donor.email}</p>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Select Business</Label>
              <Popover open={businessSearchOpen} onOpenChange={setBusinessSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedBusiness ? (
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {selectedBusiness.business_name}
                      </span>
                    ) : (
                      "Select business..."
                    )}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search businesses..."
                      onValueChange={(value) => {
                        setSearchQuery(value);
                        searchBusinesses(value);
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>No businesses found.</CommandEmpty>
                      <CommandGroup>
                        {businesses.map((business) => (
                          <CommandItem
                            key={business.id}
                            onSelect={() => {
                              setSelectedBusiness(business);
                              setBusinessSearchOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {business.logo_url ? (
                                <img
                                  src={business.logo_url}
                                  alt={business.business_name}
                                  className="h-8 w-8 rounded object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                                  <Building2 className="h-4 w-4" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium">{business.business_name}</p>
                                {business.ein && (
                                  <p className="text-xs text-muted-foreground">EIN: {business.ein}</p>
                                )}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Role (Optional)</Label>
            <Input
              id="role"
              placeholder="e.g., Manager, CEO, Employee"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          {businessId && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="primary"
                checked={isPrimaryContact}
                onCheckedChange={(checked) => setIsPrimaryContact(checked as boolean)}
              />
              <Label
                htmlFor="primary"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Set as primary contact for this business
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleLink} disabled={loading}>
            {loading ? "Linking..." : "Link Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
