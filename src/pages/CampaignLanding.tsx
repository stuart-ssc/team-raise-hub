// Updated: Size variant selector feature - Dec 2024
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
import { Minus, Plus, ShoppingCart, Calendar, Target, MapPin, Info, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BusinessInfoForm } from "@/components/BusinessInfoForm";
import { CustomFieldsRenderer } from "@/components/CustomFieldsRenderer";
import { DonorInfoForm, DonorInfo } from "@/components/DonorInfoForm";
import SimpleFooter from "@/components/SimpleFooter";

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
  roster_id: number | null;
  fee_model: 'donor_covers' | 'org_absorbs' | null;
  // Campaign-level pitch fields
  pitch_message: string | null;
  pitch_image_url: string | null;
  pitch_video_url: string | null;
  pitch_recorded_video_url: string | null;
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

interface ItemVariant {
  id: string;
  campaign_item_id: string;
  size: string;
  quantity_offered: number;
  quantity_available: number;
  display_order: number | null;
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
  is_recurring: boolean | null;
  recurring_interval: string | null;
  has_variants: boolean | null;
  variants?: ItemVariant[];
}

interface CartItem extends CampaignItem {
  selectedQuantity: number;
  selectedVariants?: { [variantId: string]: number };
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
  const [attributedRosterMember, setAttributedRosterMember] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    pitchMessage?: string | null;
    pitchImageUrl?: string | null;
    pitchVideoUrl?: string | null;
    pitchRecordedVideoUrl?: string | null;
  } | null>(null);
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [campaignItems, setCampaignItems] = useState<CampaignItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  
  // Multi-step checkout state
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'donor-info' | 'business-info' | 'custom-fields' | 'payment'>('cart');
  const [donorInfo, setDonorInfo] = useState<DonorInfo | null>(null);
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

  // Fetch attributed roster member when slug is present using edge function (bypasses RLS)
  useEffect(() => {
    const fetchRosterMember = async () => {
      if (!rosterMemberSlug || !slug) return;
      
      console.log('Looking up roster member via edge function:', { campaignSlug: slug, memberSlug: rosterMemberSlug });
      
      try {
        const { data, error } = await supabase.functions.invoke('get-roster-member-by-slug', {
          body: { campaignSlug: slug, memberSlug: rosterMemberSlug }
        });
        
        if (error) {
          console.error('Error fetching roster member:', error);
          return;
        }
        
        if (data?.rosterMember) {
          console.log('Found roster member:', data.rosterMember);
          setAttributedRosterMember({
            id: data.rosterMember.id,
            firstName: data.rosterMember.firstName,
            lastName: data.rosterMember.lastName,
            pitchMessage: data.rosterMember.pitchMessage,
            pitchImageUrl: data.rosterMember.pitchImageUrl,
            pitchVideoUrl: data.rosterMember.pitchVideoUrl,
            pitchRecordedVideoUrl: data.rosterMember.pitchRecordedVideoUrl,
          });
        } else {
          console.log('No matching roster member found');
        }
      } catch (err) {
        console.error('Error calling roster member lookup:', err);
      }
    };
    
    fetchRosterMember();
  }, [rosterMemberSlug, slug]);

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
        // Fetch variants for items that have them
        const itemsWithVariantFlag = (itemsData || []).filter(item => item.has_variants);
        let variantsData: ItemVariant[] = [];
        
        if (itemsWithVariantFlag.length > 0) {
          const { data: fetchedVariants, error: variantsError } = await supabase
            .from("campaign_item_variants")
            .select("*")
            .in("campaign_item_id", itemsWithVariantFlag.map(i => i.id))
            .order("display_order", { ascending: true });
          
          if (variantsError) {
            console.error("Error fetching item variants:", variantsError);
          } else {
            variantsData = fetchedVariants || [];
          }
        }
        
        // Merge variants into items
        const itemsWithVariants = (itemsData || []).map(item => ({
          ...item,
          variants: variantsData.filter(v => v.campaign_item_id === item.id)
        }));
        
        setCampaignItems(itemsWithVariants);
        setCart(itemsWithVariants.map(item => ({ 
          ...item, 
          selectedQuantity: 0,
          selectedVariants: {}
        })));
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

  const updateVariantQuantity = (itemId: string, variantId: string, newQuantity: number) => {
    setCart(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      
      const variant = item.variants?.find(v => v.id === variantId);
      if (!variant) return item;
      
      const clampedQty = Math.max(0, Math.min(newQuantity, variant.quantity_available));
      
      const updatedVariants = {
        ...item.selectedVariants,
        [variantId]: clampedQty
      };
      
      // Clean up zero quantities
      if (updatedVariants[variantId] === 0) {
        delete updatedVariants[variantId];
      }
      
      const totalSelected = Object.values(updatedVariants).reduce((sum, q) => sum + q, 0);
      
      return {
        ...item,
        selectedVariants: updatedVariants,
        selectedQuantity: totalSelected
      };
    }));
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.cost || 0) * item.selectedQuantity;
    }, 0);
  };

  const getPlatformFee = () => {
    if (campaign?.fee_model === 'org_absorbs') return 0;
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

    // Check for mixed cart (recurring and one-time items)
    const hasRecurring = items.some(item => item.is_recurring);
    const hasOneTime = items.some(item => !item.is_recurring);
    
    if (hasRecurring && hasOneTime) {
      toast({
        title: "Mixed cart not supported",
        description: "Please checkout recurring and one-time items separately.",
        variant: "destructive"
      });
      return;
    }

    // Always go to donor info first
    setCheckoutStep('donor-info');
  };

  const handleDonorInfoNext = (info: DonorInfo) => {
    setDonorInfo(info);
    
    // Determine next step based on campaign requirements
    if (campaign?.requires_business_info) {
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
      const items = cart.filter(item => item.selectedQuantity > 0).flatMap(item => {
        // For items with variants, create separate line items for each selected variant
        if (item.has_variants && item.selectedVariants && Object.keys(item.selectedVariants).length > 0) {
          return Object.entries(item.selectedVariants).map(([variantId, quantity]) => ({
            id: item.id,
            variantId,
            quantity,
            size: item.variants?.find(v => v.id === variantId)?.size
          }));
        }
        // For regular items without variants
        return [{ id: item.id, quantity: item.selectedQuantity }];
      });
      
      // Step 1: Create Stripe checkout session with donor info
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        'create-stripe-checkout',
        {
          body: {
            campaignSlug: slug,
            items: items,
            customerInfo: donorInfo ? {
              email: donorInfo.email,
              name: `${donorInfo.firstName} ${donorInfo.lastName}`,
              phone: donorInfo.phone,
            } : null,
            attributedRosterMemberId: attributedRosterMember?.id || null,
            origin: window.location.origin
          }
        }
      );
      
      if (checkoutError) throw checkoutError;
      
      // Step 2: Process business data and custom fields if they exist
      if ((businessData || Object.keys(customFieldValues).length > 0) && checkoutData.orderId) {
        // Handle groups as potential array (FK relationships may return arrays)
        const groupData = Array.isArray(campaign.groups) 
          ? campaign.groups[0] 
          : campaign.groups;
        
        const { error: processError } = await supabase.functions.invoke(
          'process-checkout-business',
          {
            body: {
              orderId: checkoutData.orderId,
              businessId: businessData?.businessId,
              organizationId: groupData?.organization_id,
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
        setDonorInfo(null);
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
  
  // If there's a campaign image, treat background as dark (we overlay it with black)
  // Otherwise, check the school's primary color
  const hasImage = !!campaign.image_url;
  const isDarkBackground = hasImage || (schoolPrimaryColor && isColorDark(schoolPrimaryColor));
  const heroStyle = schoolPrimaryColor 
    ? {
        background: `linear-gradient(to right, ${schoolPrimaryColor}CC, ${schoolPrimaryColor}AD)`,
      }
    : {
        background: `linear-gradient(to right, #ADD8E6CC, #ADD8E6AD)`, // Light blue fallback color
      };
  
  // Text shadow for better readability over images
  const imageTextShadow = hasImage ? { textShadow: '0 2px 4px rgba(0,0,0,0.5)' } : {};

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
            <div className="absolute inset-0 bg-black/70"></div>
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
            
            <h1 
              className={`text-3xl md:text-4xl font-bold ${isDarkBackground ? 'text-white' : 'text-foreground'}`}
              style={imageTextShadow}
            >
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

      {/* Pitch Section - Cascading: Roster member pitch > Campaign pitch */}
      {(() => {
        // Determine which pitch to show (roster member takes priority)
        const rosterHasPitch = attributedRosterMember && (
          attributedRosterMember.pitchMessage || 
          attributedRosterMember.pitchImageUrl || 
          attributedRosterMember.pitchVideoUrl || 
          attributedRosterMember.pitchRecordedVideoUrl
        );
        
        const campaignHasPitch = campaign && (
          campaign.pitch_message || 
          campaign.pitch_image_url || 
          campaign.pitch_video_url || 
          campaign.pitch_recorded_video_url
        );
        
        const activePitch = rosterHasPitch ? {
          type: 'roster' as const,
          name: `${attributedRosterMember!.firstName} ${attributedRosterMember!.lastName}`,
          message: attributedRosterMember!.pitchMessage,
          imageUrl: attributedRosterMember!.pitchImageUrl,
          videoUrl: attributedRosterMember!.pitchVideoUrl,
          recordedVideoUrl: attributedRosterMember!.pitchRecordedVideoUrl,
        } : campaignHasPitch ? {
          type: 'campaign' as const,
          name: campaign!.groups?.group_name || campaign!.name,
          message: campaign!.pitch_message,
          imageUrl: campaign!.pitch_image_url,
          videoUrl: campaign!.pitch_video_url,
          recordedVideoUrl: campaign!.pitch_recorded_video_url,
        } : null;
        
        if (!activePitch) return null;
        
        const getVideoEmbedUrl = (url: string | null | undefined) => {
          if (!url) return null;
          const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
          if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
          const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
          if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
          return null;
        };
        
        const embedUrl = getVideoEmbedUrl(activePitch.videoUrl);
        
        return (
          <div className="max-w-6xl mx-auto px-6 pt-6">
            <Card className="bg-primary/5 border-primary/20 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  {/* Photo */}
                  {activePitch.imageUrl && (
                    <div className="flex-shrink-0">
                      <img 
                        src={activePitch.imageUrl} 
                        alt={activePitch.name}
                        className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-background shadow-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 text-center md:text-left">
                    {/* Attribution */}
                    <p className="text-sm text-muted-foreground mb-1">
                      {activePitch.type === 'roster' ? '🎉 You\'re supporting' : '💬 A message from'}
                    </p>
                    <h3 className="text-xl font-bold mb-3">
                      {activePitch.name}
                    </h3>
                    
                    {/* Message */}
                    {activePitch.message && (
                      <blockquote className="italic text-muted-foreground border-l-4 border-primary/30 pl-4 py-2">
                        "{activePitch.message}"
                      </blockquote>
                    )}
                  </div>
                </div>
                
                {/* Video - prioritize recorded video over external link */}
                {activePitch.recordedVideoUrl ? (
                  <div className="mt-4 aspect-video rounded-lg overflow-hidden max-w-2xl mx-auto">
                    <video
                      src={activePitch.recordedVideoUrl}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                    />
                  </div>
                ) : embedUrl && (
                  <div className="mt-4 aspect-video rounded-lg overflow-hidden max-w-2xl mx-auto">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })()}

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
                      <div className="flex items-center justify-between">
                        <CardTitle className="line-clamp-2">{item.name}</CardTitle>
                        {item.is_recurring && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            {item.recurring_interval === 'month' ? 'Monthly' : 'Annual'}
                          </Badge>
                        )}
                      </div>
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
                        <div>
                          <span className="text-2xl font-bold">
                            ${(item.cost || 0).toFixed(2)}
                          </span>
                          {item.is_recurring && (
                            <span className="text-sm text-muted-foreground ml-1">
                              /{item.recurring_interval === 'month' ? 'mo' : 'yr'}
                            </span>
                          )}
                        </div>
                        {!item.has_variants && item.quantity_available !== null && (
                          <span className="text-sm text-muted-foreground">
                            {item.quantity_available} available
                          </span>
                        )}
                      </div>

                      {/* Size Selector for Variant Items */}
                      {item.has_variants && item.variants && item.variants.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Select Size</p>
                          {item.variants.map((variant) => {
                            const selectedQty = item.selectedVariants?.[variant.id] || 0;
                            const isAvailable = variant.quantity_available > 0;
                            
                            return (
                              <div key={variant.id} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                                <div className="flex items-center gap-2">
                                  <Badge variant={isAvailable ? "outline" : "secondary"} className={!isAvailable ? "opacity-50" : ""}>
                                    {variant.size}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {variant.quantity_available} left
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => updateVariantQuantity(item.id, variant.id, selectedQty - 1)}
                                    disabled={selectedQty === 0}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center text-sm font-medium">{selectedQty}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => updateVariantQuantity(item.id, variant.id, selectedQty + 1)}
                                    disabled={!isAvailable || selectedQty >= variant.quantity_available}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Standard Quantity Selector for Non-Variant Items */
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
                      )}

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
                    {cart.some(item => item.selectedQuantity > 0 && item.is_recurring) && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" />
                        Subscription
                      </Badge>
                    )}
                  </div>
                  
                  {/* Selected Items */}
                  <div className="space-y-2 mb-4">
                    {cart.filter(item => item.selectedQuantity > 0).map(item => (
                      item.has_variants && item.selectedVariants && Object.keys(item.selectedVariants).length > 0 ? (
                        // Render each selected variant as a separate line
                        Object.entries(item.selectedVariants).map(([variantId, qty]) => {
                          const variant = item.variants?.find(v => v.id === variantId);
                          return (
                            <div key={variantId} className="flex justify-between text-sm">
                              <span className="flex items-center gap-1">
                                {item.name} ({variant?.size}) × {qty}
                                {item.is_recurring && (
                                  <span className="text-muted-foreground text-xs">
                                    ({item.recurring_interval === 'month' ? 'monthly' : 'annually'})
                                  </span>
                                )}
                              </span>
                              <span>
                                ${((item.cost || 0) * qty).toFixed(2)}
                                {item.is_recurring && <span className="text-muted-foreground">/{item.recurring_interval === 'month' ? 'mo' : 'yr'}</span>}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        // Regular item without variants
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="flex items-center gap-1">
                            {item.name} × {item.selectedQuantity}
                            {item.is_recurring && (
                              <span className="text-muted-foreground text-xs">
                                ({item.recurring_interval === 'month' ? 'monthly' : 'annually'})
                              </span>
                            )}
                          </span>
                          <span>
                            ${((item.cost || 0) * item.selectedQuantity).toFixed(2)}
                            {item.is_recurring && <span className="text-muted-foreground">/{item.recurring_interval === 'month' ? 'mo' : 'yr'}</span>}
                          </span>
                        </div>
                      )
                    ))}
                  </div>

                  {/* Recurring notice */}
                  {cart.some(item => item.selectedQuantity > 0 && item.is_recurring) && (
                    <Alert className="mb-4">
                      <RefreshCw className="h-4 w-4" />
                      <AlertDescription>
                        This is a recurring donation. You will be charged{' '}
                        {cart.find(item => item.selectedQuantity > 0 && item.is_recurring)?.recurring_interval === 'month' 
                          ? 'monthly' : 'annually'} until you cancel.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Cost Breakdown */}
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${getSubtotal().toFixed(2)}</span>
                    </div>
                    {campaign?.fee_model !== 'org_absorbs' && (
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
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span>
                        ${getTotalAmount().toFixed(2)}
                        {cart.some(item => item.selectedQuantity > 0 && item.is_recurring) && (
                          <span className="text-sm font-normal text-muted-foreground">
                            /{cart.find(item => item.selectedQuantity > 0 && item.is_recurring)?.recurring_interval === 'month' ? 'mo' : 'yr'}
                          </span>
                        )}
                      </span>
                    </div>
                    {campaign?.fee_model === 'org_absorbs' && getSubtotal() > 0 && (
                      <p className="text-xs text-muted-foreground text-right">
                        Includes Sponsorly's 10% platform fee
                      </p>
                    )}
                  </div>

                  <Button 
                    onClick={handleProceedToCheckout}
                    className="w-full mt-4"
                    size="lg"
                  >
                    {cart.some(item => item.selectedQuantity > 0 && item.is_recurring) 
                      ? 'Subscribe Now' 
                      : 'Proceed to Checkout'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Business Info Step */}
        {/* Donor Information Step */}
        {checkoutStep === 'donor-info' && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>
                Please provide your contact information to complete your donation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DonorInfoForm
                onComplete={handleDonorInfoNext}
                onBack={() => setCheckoutStep('cart')}
                organizationId={campaign?.groups?.organization_id}
              />
            </CardContent>
          </Card>
        )}

        {/* Business Information Step */}
        {checkoutStep === 'business-info' && campaign && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                {campaign.requires_business_info 
                  ? "This campaign requires business/sponsor information for recognition purposes."
                  : "Optional: Add your business information for recognition purposes."}
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
                // Only allow skip if business info is NOT required
                onSkip={campaign.requires_business_info ? undefined : () => {
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
                  onClick={() => setCheckoutStep('donor-info')}
                >
                  Back
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
                  onClick={() => setCheckoutStep(campaign?.requires_business_info ? 'business-info' : 'donor-info')}
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
                
                {donorInfo && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Contact Information</h3>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{donorInfo.firstName} {donorInfo.lastName}</p>
                      <p className="text-muted-foreground">{donorInfo.email}</p>
                      {donorInfo.phone && (
                        <p className="text-muted-foreground">{donorInfo.phone}</p>
                      )}
                    </div>
                  </div>
                )}
                
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
                  {campaign?.fee_model !== 'org_absorbs' && (
                    <div className="flex justify-between text-sm">
                      <span>Platform Fee</span>
                      <span>${getPlatformFee().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>${getTotalAmount().toFixed(2)}</span>
                  </div>
                  {campaign?.fee_model === 'org_absorbs' && (
                    <p className="text-xs text-muted-foreground text-right">
                      Includes Sponsorly's 10% platform fee
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCheckoutStep(customFields.length > 0 ? 'custom-fields' : 
                    (campaign?.requires_business_info ? 'business-info' : 'donor-info'))}
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
      <SimpleFooter />
    </div>
  );
};

export default CampaignLanding;