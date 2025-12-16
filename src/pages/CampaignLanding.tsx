import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCampaignViewTracking } from "@/hooks/useCampaignViewTracking";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Minus, Plus, ShoppingCart, Calendar, Target, MapPin, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BusinessInfoForm } from "@/components/BusinessInfoForm";
import { CustomFieldsRenderer } from "@/components/CustomFieldsRenderer";

interface CampaignData {
  id: string;
  name: string;
  description: string | null;
  goal_amount: number | null;
  amount_raised: number | null;
  start_date: string | null;
  end_date: string | null;
  status: boolean | null;
  image_url: string | null;
  requires_business_info: boolean | null;
  file_upload_deadline_days: number | null;
  groups: {
    id: string;
    organization_id: string;
    group_name: string;
    group_type: {
      id: string;
      name: string;
    } | null;
    schools: {
      id: string;
      school_name: string;
      city: string;
      state: string;
      "Primary Color": string | null;
    };
  } | null;
  campaign_type: {
    id: string;
    name: string;
  } | null;
}

interface CampaignItem {
  id: string;
  name: string;
  description: string | null;
  cost: number | null;
  quantity_offered: number | null;
  quantity_available: number | null;
  max_items_purchased: number | null;
  image: string | null;
  size: string | null;
}

interface CartItem extends CampaignItem {
  selectedQuantity: number;
}

interface CustomField {
  id: string;
  field_name: string;
  field_type: string;
  field_options: any;
  is_required: boolean;
  help_text: string | null;
  display_order: number;
}

const CampaignLanding = () => {
  const { slug, rosterMemberSlug } = useParams<{ slug: string; rosterMemberSlug?: string }>();
  const { toast } = useToast();
  const [attributedRosterMember, setAttributedRosterMember] = useState<any>(null);
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [campaignItems, setCampaignItems] = useState<CampaignItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  
  // Multi-step checkout state
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'business-info' | 'custom-fields' | 'payment'>('cart');
  const [businessData, setBusinessData] = useState<any>(null);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [processingCheckout, setProcessingCheckout] = useState(false);

  // Track campaign views for donor engagement analytics
  useCampaignViewTracking({
    campaignId: campaign?.id || "",
    donorEmail: userEmail,
  });

  // Get current user email for view tracking
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (slug) {
      fetchCampaignData();
    }
  }, [slug]);

  const fetchCampaignData = async () => {
    try {
      // Fetch campaign by slug
      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .select(`
          *,
          groups!inner(
            id,
            organization_id,
            group_name,
            group_type(id, name),
            schools!inner(id, school_name, city, state, "Primary Color")
          ),
          campaign_type(id, name)
        `)
        .eq("slug", slug)
        .eq("status", true)
        .single();

      if (campaignError) {
        setError("Campaign not found");
        return;
      }

      setCampaign(campaignData as unknown as CampaignData);

      // Fetch campaign items
      const { data: itemsData, error: itemsError } = await supabase
        .from("campaign_items")
        .select("*")
        .eq("campaign_id", campaignData.id);

      if (itemsError) {
        console.error("Error fetching campaign items:", itemsError);
      } else {
        setCampaignItems(itemsData || []);
        setCart(itemsData?.map(item => ({ ...item, selectedQuantity: 0 })) || []);
      }

      // Fetch custom fields
      const { data: fieldsData, error: fieldsError } = await supabase
        .from("campaign_custom_fields")
        .select("*")
        .eq("campaign_id", campaignData.id)
        .order("display_order", { ascending: true });

      if (fieldsError) {
        console.error("Error fetching custom fields:", fieldsError);
      } else {
        setCustomFields(fieldsData || []);
      }
    } catch (error) {
      console.error("Error fetching campaign data:", error);
      setError("Failed to load campaign");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    setCart(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, selectedQuantity: Math.max(0, newQuantity) }
        : item
    ));
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.cost || 0) * item.selectedQuantity;
    }, 0);
  };

  const getPlatformFee = () => {
    return getSubtotal() * 0.1; // 10% platform fee
  };

  const getTotalAmount = () => {
    return getSubtotal() + getPlatformFee();
  };

  const getSelectedItemsCount = () => {
    return cart.reduce((count, item) => count + item.selectedQuantity, 0);
  };

  const handleProceedToCheckout = () => {
    if (!campaign) return;
    
    const items = cart.filter(item => item.selectedQuantity > 0);

    if (items.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to proceed to checkout.",
        variant: "destructive"
      });
      return;
    }

    // Determine next step based on campaign requirements
    if (campaign.requires_business_info) {
      setCheckoutStep('business-info');
    } else if (customFields.length > 0) {
      setCheckoutStep('custom-fields');
    } else {
      setCheckoutStep('payment');
    }
  };

  const handleBusinessInfoNext = () => {
    if (customFields.length > 0) {
      setCheckoutStep('custom-fields');
    } else {
      setCheckoutStep('payment');
    }
  };

  const validateCustomFields = () => {
    const requiredFields = customFields.filter(f => f.is_required);
    
    return requiredFields.every(field => {
      const value = customFieldValues[field.id];
      // Allow required file fields to be empty (can upload later)
      if (field.field_type === 'file') return true;
      return value !== undefined && value !== null && value !== '';
    });
  };

  const handleCustomFieldsNext = () => {
    if (!validateCustomFields()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    setCheckoutStep('payment');
  };

  const handleFinalCheckout = async () => {
    if (!campaign) return;
    
    setProcessingCheckout(true);
    
    try {
      const items = cart.filter(item => item.selectedQuantity > 0).map(item => ({
        id: item.id,
        quantity: item.selectedQuantity
      }));
      
      // Step 1: Create Stripe checkout session
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        'create-stripe-checkout',
        {
          body: {
            campaignSlug: slug,
            items: items,
            customerInfo: null,
            attributedRosterMemberId: attributedRosterMember?.id || null
          }
        }
      );
      
      if (checkoutError) throw checkoutError;
      
      // Step 2: Process business data and custom fields if they exist
      if ((businessData || Object.keys(customFieldValues).length > 0) && checkoutData.orderId) {
        const { error: processError } = await supabase.functions.invoke(
          'process-checkout-business',
          {
            body: {
              orderId: checkoutData.orderId,
              businessId: businessData?.businessId,
              organizationId: campaign.groups?.organization_id,
              customFieldValues: customFieldValues,
              campaignId: campaign.id
            }
          }
        );
        
        if (processError) {
          console.error('Error processing business data:', processError);
          toast({
            title: "Warning",
            description: "Purchase created but business data may need to be added later.",
          });
        }
      }
      
      // Step 3: Redirect to Stripe Checkout
      if (checkoutData.url) {
        window.open(checkoutData.url, '_blank');
        
        // Reset checkout state
        setCheckoutStep('cart');
        setBusinessData(null);
        setCustomFieldValues({});
        
        toast({
          title: "Redirecting to payment",
          description: "Please complete your payment in the new tab."
        });
      } else {
        throw new Error('No checkout URL received');
      }
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to initiate checkout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingCheckout(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return <Navigate to="/404" replace />;
  }

  const progressPercentage = campaign.goal_amount 
    ? Math.min((campaign.amount_raised || 0) / campaign.goal_amount * 100, 100)
    : 0;

  // Get school's primary color or fallback to design system primary
  const schoolPrimaryColor = campaign.groups?.schools["Primary Color"];
  
  // Function to determine if a color is dark
  const isColorDark = (hexColor: string) => {
    if (!hexColor) return false;
    const color = hexColor.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };
  
  const isDarkBackground = schoolPrimaryColor && isColorDark(schoolPrimaryColor);
  const heroStyle = schoolPrimaryColor 
    ? {
        background: `linear-gradient(to right, ${schoolPrimaryColor}CC, ${schoolPrimaryColor}AD)`,
      }
    : {
        background: `linear-gradient(to right, #ADD8E6CC, #ADD8E6AD)`, // Light blue fallback color
      };

  // Get dynamic content based on campaign type
  const getSectionTitle = () => {
    const campaignType = campaign.campaign_type?.name?.toLowerCase();
    switch (campaignType) {
      case 'sponsorship':
        return 'Sponsorship Opportunities';
      case 'donation':
        return 'Donation Opportunities';
      case 'merchandise sales':
        return 'Available Merchandise';
      case 'event':
        return 'Event Experience Opportunities';
      default:
        return 'Available Items';
    }
  };

  const getSectionDescription = () => {
    const campaignType = campaign.campaign_type?.name?.toLowerCase();
    const schoolName = campaign.groups?.schools.school_name || '';
    const groupName = campaign.groups?.group_name || '';
    const groupType = campaign.groups?.group_type?.name?.toLowerCase() || '';
    
    // Determine if it's a sports team (treat as "team") or use full group type
    const teamText = groupType.includes('sport') ? 'team' : groupType;
    
    const supportText = `${schoolName} ${groupName} ${teamText}`;
    
    switch (campaignType) {
      case 'sponsorship':
        return `Select the sponsorship opportunity and quantity to show your support to the ${supportText}.`;
      case 'donation':
        return `Select the donation opportunity and quantity to show your support to the ${supportText}.`;
      case 'merchandise sales':
        return `Select the merchandise item and quantity to show your support to the ${supportText}.`;
      case 'event':
        return `Select the event experience and quantity to show your support to the ${supportText}.`;
      default:
        return 'Select the items and quantities you\'d like to purchase';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div 
        className="border-b relative"
        style={heroStyle}
      >
        {/* Campaign Background Image */}
        {campaign.image_url && (
          <div className="absolute inset-0">
            <img 
              src={campaign.image_url} 
              alt={campaign.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50"></div>
          </div>
        )}
        <div className="max-w-6xl mx-auto p-6 md:p-8 relative z-10">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <Badge variant="secondary" className="w-fit">
                {campaign.campaign_type?.name || "Fundraiser"}
              </Badge>
              {campaign.groups && (
                <div className={`flex items-center gap-1 text-sm ${isDarkBackground ? 'text-white/80' : 'text-muted-foreground'}`}>
                  <MapPin className="h-4 w-4" />
                  {campaign.groups.group_name} • {campaign.groups.schools.school_name}
                </div>
              )}
            </div>
            
            <h1 className={`text-3xl md:text-4xl font-bold ${isDarkBackground ? 'text-white' : 'text-foreground'}`}>
              {campaign.name}
            </h1>
            
            {campaign.description && (
              <p className={`text-lg max-w-3xl ${isDarkBackground ? 'text-white/90' : 'text-muted-foreground'}`}>
                {campaign.description}
              </p>
            )}

            {/* Progress Section */}
            {campaign.goal_amount && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className={`h-5 w-5 ${isDarkBackground ? 'text-white' : 'text-primary'}`} />
                    <span className={`font-semibold ${isDarkBackground ? 'text-white' : 'text-foreground'}`}>
                      ${(campaign.amount_raised || 0).toLocaleString()} raised
                    </span>
                  </div>
                  <span className={`text-sm ${isDarkBackground ? 'text-white/70' : 'text-muted-foreground'}`}>
                    Goal: ${campaign.goal_amount.toLocaleString()}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <p className={`text-sm ${isDarkBackground ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {progressPercentage.toFixed(1)}% of goal reached
                </p>
              </div>
            )}

            {/* Campaign Dates */}
            {(campaign.start_date || campaign.end_date) && (
              <div className={`flex items-center gap-4 text-sm ${isDarkBackground ? 'text-white/70' : 'text-muted-foreground'}`}>
                <Calendar className="h-4 w-4" />
                {campaign.start_date && (
                  <span>Started: {new Date(campaign.start_date).toLocaleDateString()}</span>
                )}
                {campaign.end_date && (
                  <span>Ends: {new Date(campaign.end_date).toLocaleDateString()}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Items and Checkout Steps */}
      <div className="max-w-6xl mx-auto p-6">
        {checkoutStep === 'cart' && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">{getSectionTitle()}</h2>
              <p className="text-muted-foreground">
                {getSectionDescription()}
              </p>
            </div>

            {campaignItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No items available for this campaign yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cart.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    {item.image && (
                      <div className="aspect-video bg-muted">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{item.name}</CardTitle>
                      {item.description && (
                        <CardDescription className="line-clamp-3">
                          {item.description}
                        </CardDescription>
                      )}
                      {item.size && (
                        <Badge variant="outline" className="w-fit">
                          Size: {item.size}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          ${(item.cost || 0).toFixed(2)}
                        </span>
                        {item.quantity_available !== null && (
                          <span className="text-sm text-muted-foreground">
                            {item.quantity_available} available
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.selectedQuantity - 1)}
                          disabled={item.selectedQuantity === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">
                          {item.selectedQuantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.selectedQuantity + 1)}
                          disabled={
                            (item.quantity_available && item.selectedQuantity >= item.quantity_available) ||
                            (item.max_items_purchased && item.selectedQuantity >= item.max_items_purchased)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {item.max_items_purchased && (
                        <p className="text-xs text-muted-foreground">
                          Max {item.max_items_purchased} per person
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Cart Summary */}
            {getSelectedItemsCount() > 0 && (
              <Card className="mt-8">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="font-semibold">
                      {getSelectedItemsCount()} item{getSelectedItemsCount() !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  
                  {/* Selected Items */}
                  <div className="space-y-2 mb-4">
                    {cart.filter(item => item.selectedQuantity > 0).map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.name} × {item.selectedQuantity}</span>
                        <span>${((item.cost || 0) * item.selectedQuantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Cost Breakdown */}
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <span>Platform Fee</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                The platform fee is your way to further support the group by covering their fees so they can receive your full donation.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span>${getPlatformFee().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span>${getTotalAmount().toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleProceedToCheckout}
                    className="w-full mt-4"
                    size="lg"
                  >
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Business Info Step */}
        {checkoutStep === 'business-info' && campaign && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                This campaign requires business/sponsor information for recognition purposes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <BusinessInfoForm
                organizationId={campaign.groups?.organization_id || ''}
                onBusinessSelected={(businessId, isNew, businessName) => {
                  setBusinessData({
                    businessId,
                    isNew,
                    businessName
                  });
                  // Auto-advance to next step after business is selected/created
                  if (customFields.length > 0) {
                    setCheckoutStep('custom-fields');
                  } else {
                    setCheckoutStep('payment');
                  }
                }}
                onSkip={() => {
                  toast({
                    title: "Skipped",
                    description: "You can add business information later if needed."
                  });
                  if (customFields.length > 0) {
                    setCheckoutStep('custom-fields');
                  } else {
                    setCheckoutStep('payment');
                  }
                }}
              />
              
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCheckoutStep('cart')}
                >
                  Back to Cart
                </Button>
                <Button
                  onClick={handleBusinessInfoNext}
                  disabled={!businessData}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custom Fields Step */}
        {checkoutStep === 'custom-fields' && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                Please provide the following information to complete your purchase.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <CustomFieldsRenderer
                fields={customFields}
                values={customFieldValues}
                onChange={(fieldId, value) => {
                  setCustomFieldValues(prev => ({
                    ...prev,
                    [fieldId]: value
                  }));
                }}
              />
              
              {customFields.some(f => f.field_type === 'file') && campaign && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Don't have all files ready? No problem! You can complete this purchase now
                    and upload required files later. We'll send you reminders.
                    {campaign.file_upload_deadline_days && (
                      <> You'll have {campaign.file_upload_deadline_days} days after purchase to upload files.</>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCheckoutStep(campaign?.requires_business_info ? 'business-info' : 'cart')}
                >
                  Back
                </Button>
                <Button
                  onClick={handleCustomFieldsNext}
                  disabled={!validateCustomFields()}
                  className="flex-1"
                >
                  Continue to Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Confirmation Step */}
        {checkoutStep === 'payment' && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Review & Confirm</CardTitle>
              <CardDescription>
                Please review your order before proceeding to payment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Items</h3>
                  <div className="space-y-2">
                    {cart.filter(item => item.selectedQuantity > 0).map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.name} × {item.selectedQuantity}</span>
                        <span>${((item.cost || 0) * item.selectedQuantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {businessData && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Business Information</h3>
                    <p className="text-sm font-medium">{businessData.businessName}</p>
                    <p className="text-xs text-muted-foreground">
                      {businessData.isNew ? 'New business' : 'Existing business'}
                    </p>
                  </div>
                )}
                
                {Object.keys(customFieldValues).length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Additional Information</h3>
                    <div className="space-y-1 text-sm">
                      {customFields.map(field => {
                        const value = customFieldValues[field.id];
                        if (!value) return null;
                        return (
                          <div key={field.id} className="flex justify-between">
                            <span className="text-muted-foreground">{field.field_name}:</span>
                            <span className="font-medium">
                              {field.field_type === 'file' ? 'File selected' : String(value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform Fee</span>
                    <span>${getPlatformFee().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>${getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCheckoutStep(customFields.length > 0 ? 'custom-fields' : 
                    (campaign?.requires_business_info ? 'business-info' : 'cart'))}
                  disabled={processingCheckout}
                >
                  Back
                </Button>
                <Button
                  onClick={handleFinalCheckout}
                  disabled={processingCheckout}
                  className="flex-1"
                >
                  {processingCheckout ? 'Processing...' : 'Proceed to Payment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CampaignLanding;