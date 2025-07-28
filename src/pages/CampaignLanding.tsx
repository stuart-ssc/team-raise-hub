import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart, Calendar, Target, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CampaignData {
  id: string;
  name: string;
  description: string | null;
  goal_amount: number | null;
  amount_raised: number | null;
  start_date: string | null;
  end_date: string | null;
  status: boolean | null;
  groups: {
    id: string;
    group_name: string;
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

const CampaignLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [campaignItems, setCampaignItems] = useState<CampaignItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            group_name,
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

  const getTotalAmount = () => {
    return cart.reduce((total, item) => {
      return total + (item.cost || 0) * item.selectedQuantity;
    }, 0);
  };

  const getSelectedItemsCount = () => {
    return cart.reduce((count, item) => count + item.selectedQuantity, 0);
  };

  const handleProceedToCheckout = () => {
    const selectedItems = cart.filter(item => item.selectedQuantity > 0);
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to proceed.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Checkout coming soon!",
      description: "Payment processing will be available soon.",
    });
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
  const heroStyle = schoolPrimaryColor 
    ? {
        background: `linear-gradient(to right, ${schoolPrimaryColor}CC, ${schoolPrimaryColor}AD)`,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div 
        className={schoolPrimaryColor ? "border-b" : "bg-gradient-to-r from-primary/10 to-primary/5 border-b"}
        style={heroStyle}
      >
        <div className="max-w-6xl mx-auto p-6 md:p-8">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <Badge variant="secondary" className="w-fit">
                {campaign.campaign_type?.name || "Fundraiser"}
              </Badge>
              {campaign.groups && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {campaign.groups.group_name} • {campaign.groups.schools.school_name}
                </div>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {campaign.name}
            </h1>
            
            {campaign.description && (
              <p className="text-lg text-muted-foreground max-w-3xl">
                {campaign.description}
              </p>
            )}

            {/* Progress Section */}
            {campaign.goal_amount && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span className="font-semibold">
                      ${(campaign.amount_raised || 0).toLocaleString()} raised
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Goal: ${campaign.goal_amount.toLocaleString()}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {progressPercentage.toFixed(1)}% of goal reached
                </p>
              </div>
            )}

            {/* Campaign Dates */}
            {(campaign.start_date || campaign.end_date) && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
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

      {/* Campaign Items */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Available Items</h2>
          <p className="text-muted-foreground">
            Select the items and quantities you'd like to purchase
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
          <Card className="mt-8 sticky bottom-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="font-semibold">
                    {getSelectedItemsCount()} item{getSelectedItemsCount() !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <span className="text-2xl font-bold">
                  ${getTotalAmount().toFixed(2)}
                </span>
              </div>
              <Button 
                onClick={handleProceedToCheckout}
                className="w-full"
                size="lg"
              >
                Proceed to Checkout
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CampaignLanding;