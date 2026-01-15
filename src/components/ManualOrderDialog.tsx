import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Minus,
  User,
  Building2,
  Users,
  ShoppingCart,
  CreditCard,
  FileCheck,
} from "lucide-react";

interface ManualOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  organizationId: string;
  onSuccess?: () => void;
}

interface CampaignItem {
  id: string;
  name: string;
  description: string | null;
  cost: number | null;
  quantity_available: number | null;
  has_variants: boolean | null;
  variants?: Array<{
    id: string;
    size: string;
    quantity_available: number;
  }>;
}

interface CartItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  variantId?: string;
  variantName?: string;
}

const OFFLINE_PAYMENT_TYPES = [
  { value: "check", label: "Check" },
  { value: "cash", label: "Cash" },
  { value: "invoice", label: "Invoice" },
  { value: "wire", label: "Wire Transfer" },
  { value: "other", label: "Other" },
];

const STEPS = [
  { id: "customer", label: "Customer Info", icon: User },
  { id: "business", label: "Business Info", icon: Building2 },
  { id: "roster", label: "Roster Attribution", icon: Users },
  { id: "cart", label: "Select Items", icon: ShoppingCart },
  { id: "payment", label: "Payment Details", icon: CreditCard },
  { id: "review", label: "Review & Submit", icon: FileCheck },
];

export function ManualOrderDialog({
  open,
  onOpenChange,
  campaignId,
  organizationId,
  onSuccess,
}: ManualOrderDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer Info
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Business Info
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [businessState, setBusinessState] = useState("");
  const [businessZip, setBusinessZip] = useState("");
  const [skipBusiness, setSkipBusiness] = useState(false);

  // Roster Attribution
  const [selectedRosterMemberId, setSelectedRosterMemberId] = useState<string | null>(null);
  const [rosterSearchTerm, setRosterSearchTerm] = useState("");

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Payment Details
  const [offlinePaymentType, setOfflinePaymentType] = useState("check");
  const [checkNumber, setCheckNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentAlreadyReceived, setPaymentAlreadyReceived] = useState(false);

  // Fetch campaign details
  const { data: campaign } = useQuery({
    queryKey: ["manual-order-campaign", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select(`
          id,
          name,
          requires_business_info,
          enable_roster_attribution,
          roster_id
        `)
        .eq("id", campaignId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch campaign items
  const { data: campaignItems } = useQuery({
    queryKey: ["manual-order-items", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_items")
        .select(`
          id,
          name,
          description,
          cost,
          quantity_available,
          has_variants,
          campaign_item_variants (
            id,
            size,
            quantity_available
          )
        `)
        .eq("campaign_id", campaignId);
      if (error) throw error;
      return data.map((item) => ({
        ...item,
        variants: item.campaign_item_variants,
      })) as CampaignItem[];
    },
    enabled: open,
  });

  // Fetch roster members if roster attribution enabled
  const { data: rosterMembers } = useQuery({
    queryKey: ["manual-order-roster", campaign?.roster_id],
    queryFn: async (): Promise<Array<{ id: string; first_name: string; last_name: string }>> => {
      if (!campaign?.roster_id) return [];
      
      // Direct query to get roster member details
      const { data: members, error } = await (supabase
        .from("roster_members" as any)
        .select("id, organization_user_id")
        .eq("roster_id", campaign.roster_id) as any);
      if (error) throw error;
      if (!members?.length) return [];

      // Get profiles through organization_user
      const orgUserIds = members.map((m: any) => m.organization_user_id).filter(Boolean);
      const { data: orgUsers } = await supabase
        .from("organization_user")
        .select("id, profile_id")
        .in("id", orgUserIds) as any;

      const profileIds = (orgUsers || []).map((u: any) => u.profile_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", profileIds) as any;

      return members.map((m: any) => {
        const orgUser = (orgUsers || []).find((u: any) => u.id === m.organization_user_id);
        const profile = (profiles || []).find((p: any) => p.id === orgUser?.profile_id);
        return {
          id: m.id as string,
          first_name: (profile?.first_name || "") as string,
          last_name: (profile?.last_name || "") as string,
        };
      });
    },
    enabled: open && !!campaign?.roster_id && campaign?.enable_roster_attribution,
  });

  // Filter roster members by search
  const filteredRosterMembers = useMemo(() => {
    if (!rosterMembers) return [];
    if (!rosterSearchTerm.trim()) return rosterMembers;
    const term = rosterSearchTerm.toLowerCase();
    return rosterMembers.filter((m) => {
      const fullName = `${m.first_name || ""} ${m.last_name || ""}`.toLowerCase();
      return fullName.includes(term);
    });
  }, [rosterMembers, rosterSearchTerm]);

  // Calculate which steps are needed
  const activeSteps = useMemo(() => {
    const steps = [STEPS[0]]; // Customer always required
    if (campaign?.requires_business_info) steps.push(STEPS[1]);
    if (campaign?.enable_roster_attribution && campaign?.roster_id) steps.push(STEPS[2]);
    steps.push(STEPS[3]); // Cart always required
    steps.push(STEPS[4]); // Payment always required
    steps.push(STEPS[5]); // Review always required
    return steps;
  }, [campaign]);

  const currentStepData = activeSteps[currentStep];

  // Cart helpers
  const addToCart = (item: CampaignItem, variantId?: string, variantName?: string) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (c) => c.itemId === item.id && c.variantId === variantId
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }
      return [
        ...prev,
        {
          itemId: item.id,
          name: item.name,
          quantity: 1,
          price: item.cost || 0,
          variantId,
          variantName,
        },
      ];
    });
  };

  const updateCartQuantity = (index: number, delta: number) => {
    setCartItems((prev) => {
      const updated = [...prev];
      updated[index].quantity += delta;
      if (updated[index].quantity <= 0) {
        updated.splice(index, 1);
      }
      return updated;
    });
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Validation
  const isStepValid = () => {
    switch (currentStepData?.id) {
      case "customer":
        return customerEmail.trim() && customerFirstName.trim() && customerLastName.trim();
      case "business":
        if (skipBusiness) return true;
        return businessName.trim();
      case "roster":
        return true; // Optional
      case "cart":
        return cartItems.length > 0;
      case "payment":
        return offlinePaymentType.trim();
      case "review":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < activeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-manual-order", {
        body: {
          campaignId,
          organizationId,
          customerEmail: customerEmail.trim(),
          customerName: `${customerFirstName.trim()} ${customerLastName.trim()}`,
          customerPhone: customerPhone.trim() || null,
          businessData: skipBusiness || !campaign?.requires_business_info ? null : {
            business_name: businessName.trim(),
            business_email: businessEmail.trim() || null,
            business_phone: businessPhone.trim() || null,
            address_line1: businessAddress.trim() || null,
            city: businessCity.trim() || null,
            state: businessState.trim() || null,
            zip: businessZip.trim() || null,
          },
          attributedRosterMemberId: selectedRosterMemberId,
          items: cartItems.map((item) => ({
            campaign_item_id: item.itemId,
            quantity: item.quantity,
            price_at_purchase: item.price,
            variant_id: item.variantId || null,
          })),
          offlinePaymentType,
          checkNumber: checkNumber.trim() || null,
          paymentNotes: paymentNotes.trim() || null,
          paymentReceived: paymentAlreadyReceived,
          enteredBy: user.id,
        },
      });

      if (error) throw error;

      toast({
        title: "Order Created",
        description: `Manual order created successfully for ${customerFirstName} ${customerLastName}`,
      });

      // Reset form
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating manual order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create manual order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setCustomerEmail("");
    setCustomerFirstName("");
    setCustomerLastName("");
    setCustomerPhone("");
    setBusinessName("");
    setBusinessEmail("");
    setBusinessPhone("");
    setBusinessAddress("");
    setBusinessCity("");
    setBusinessState("");
    setBusinessZip("");
    setSkipBusiness(false);
    setSelectedRosterMemberId(null);
    setRosterSearchTerm("");
    setCartItems([]);
    setOfflinePaymentType("check");
    setCheckNumber("");
    setPaymentNotes("");
    setPaymentAlreadyReceived(false);
  };

  const renderStepContent = () => {
    switch (currentStepData?.id) {
      case "customer":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer-email">Email *</Label>
              <Input
                id="customer-email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-first-name">First Name *</Label>
                <Input
                  id="customer-first-name"
                  value={customerFirstName}
                  onChange={(e) => setCustomerFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="customer-last-name">Last Name *</Label>
                <Input
                  id="customer-last-name"
                  value={customerLastName}
                  onChange={(e) => setCustomerLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="customer-phone">Phone (optional)</Label>
              <Input
                id="customer-phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        );

      case "business":
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="skip-business"
                checked={skipBusiness}
                onCheckedChange={(checked) => setSkipBusiness(checked === true)}
              />
              <Label htmlFor="skip-business" className="text-sm text-muted-foreground">
                Skip business info (individual donation)
              </Label>
            </div>
            {!skipBusiness && (
              <>
                <div>
                  <Label htmlFor="business-name">Business Name *</Label>
                  <Input
                    id="business-name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Acme Corporation"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="business-email">Business Email</Label>
                    <Input
                      id="business-email"
                      type="email"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      placeholder="contact@business.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="business-phone">Business Phone</Label>
                    <Input
                      id="business-phone"
                      type="tel"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="business-address">Address</Label>
                  <Input
                    id="business-address"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="business-city">City</Label>
                    <Input
                      id="business-city"
                      value={businessCity}
                      onChange={(e) => setBusinessCity(e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="business-state">State</Label>
                    <Input
                      id="business-state"
                      value={businessState}
                      onChange={(e) => setBusinessState(e.target.value)}
                      placeholder="ST"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="business-zip">ZIP</Label>
                    <Input
                      id="business-zip"
                      value={businessZip}
                      onChange={(e) => setBusinessZip(e.target.value)}
                      placeholder="12345"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case "roster":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-2">
              Select which roster member should be credited for this order.
            </p>
            <Input
              placeholder="Search roster members..."
              value={rosterSearchTerm}
              onChange={(e) => setRosterSearchTerm(e.target.value)}
            />
            <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
              <div
                className={`p-3 cursor-pointer hover:bg-muted ${
                  !selectedRosterMemberId ? "bg-primary/5" : ""
                }`}
                onClick={() => setSelectedRosterMemberId(null)}
              >
                <p className="text-sm text-muted-foreground">No attribution</p>
              </div>
              {filteredRosterMembers.map((member) => {
                const name = `${member.first_name || ""} ${member.last_name || ""}`.trim() || "Unknown";
                return (
                  <div
                    key={member.id}
                    className={`p-3 cursor-pointer hover:bg-muted ${
                      selectedRosterMemberId === member.id ? "bg-primary/5" : ""
                    }`}
                    onClick={() => setSelectedRosterMemberId(member.id)}
                  >
                    <p className="font-medium">{name}</p>
                    {selectedRosterMemberId === member.id && (
                      <Check className="h-4 w-4 text-primary inline ml-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "cart":
        return (
          <div className="space-y-4">
            <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-3">
              {campaignItems?.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${(item.cost || 0).toLocaleString()}
                    </p>
                  </div>
                  {item.has_variants && item.variants?.length ? (
                    <Select onValueChange={(val) => {
                      const variant = item.variants?.find(v => v.id === val);
                      if (variant) addToCart(item, variant.id, variant.size);
                    }}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Size" />
                      </SelectTrigger>
                      <SelectContent>
                        {item.variants.map((v) => (
                          <SelectItem key={v.id} value={v.id}>{v.size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => addToCart(item)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {cartItems.length > 0 && (
              <div className="border rounded-lg p-3 space-y-2">
                <p className="font-medium">Cart</p>
                {cartItems.map((item, idx) => (
                  <div key={`${item.itemId}-${item.variantId || idx}`} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">{item.name} {item.variantName && `(${item.variantName})`}</p>
                      <p className="text-xs text-muted-foreground">${item.price} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartQuantity(idx, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartQuantity(idx, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${cartTotal.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        );

      case "payment":
        return (
          <div className="space-y-4">
            <div>
              <Label>Payment Type *</Label>
              <RadioGroup value={offlinePaymentType} onValueChange={setOfflinePaymentType} className="mt-2">
                {OFFLINE_PAYMENT_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.value} id={`payment-${type.value}`} />
                    <Label htmlFor={`payment-${type.value}`}>{type.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            {offlinePaymentType === "check" && (
              <div>
                <Label htmlFor="check-number">Check Number</Label>
                <Input
                  id="check-number"
                  value={checkNumber}
                  onChange={(e) => setCheckNumber(e.target.value)}
                  placeholder="e.g., 1234"
                />
              </div>
            )}
            <div>
              <Label htmlFor="payment-notes">Notes</Label>
              <Textarea
                id="payment-notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Any additional payment details..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="payment-received"
                checked={paymentAlreadyReceived}
                onCheckedChange={(checked) => setPaymentAlreadyReceived(checked === true)}
              />
              <Label htmlFor="payment-received" className="text-sm">
                Payment has already been received
              </Label>
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium">{customerFirstName} {customerLastName}</p>
                  <p className="text-sm text-muted-foreground">{customerEmail}</p>
                </div>
                {campaign?.requires_business_info && !skipBusiness && businessName && (
                  <div>
                    <p className="text-xs text-muted-foreground">Business</p>
                    <p className="font-medium">{businessName}</p>
                  </div>
                )}
                {selectedRosterMemberId && (
                  <div>
                    <p className="text-xs text-muted-foreground">Attributed To</p>
                    <p className="font-medium">
                      {rosterMembers?.find(m => m.id === selectedRosterMemberId)?.first_name}{" "}
                      {rosterMembers?.find(m => m.id === selectedRosterMemberId)?.last_name}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Items</p>
                  {cartItems.map((item, idx) => (
                    <p key={idx} className="text-sm">
                      {item.name} x{item.quantity} - ${(item.price * item.quantity).toLocaleString()}
                    </p>
                  ))}
                  <p className="font-semibold mt-1">Total: ${cartTotal.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment</p>
                  <p className="text-sm">
                    {OFFLINE_PAYMENT_TYPES.find(t => t.value === offlinePaymentType)?.label}
                    {checkNumber && ` #${checkNumber}`}
                  </p>
                  <Badge variant={paymentAlreadyReceived ? "default" : "secondary"} className="mt-1">
                    {paymentAlreadyReceived ? "Payment Received" : "Awaiting Payment"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Manual Order</DialogTitle>
          <DialogDescription>
            Create an order for offline payment (check, cash, etc.)
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {activeSteps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            const isComplete = idx < currentStep;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isComplete
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="py-4">{renderStepContent()}</div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {currentStep === activeSteps.length - 1 ? (
            <Button onClick={handleSubmit} disabled={isSubmitting || !isStepValid()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Create Order
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!isStepValid()}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
