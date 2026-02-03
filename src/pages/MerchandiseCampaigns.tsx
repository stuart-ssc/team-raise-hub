import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MarketingHeader from '@/components/MarketingHeader';
import MarketingFooter from '@/components/MarketingFooter';
import { useLandingPageTracking } from '@/hooks/useLandingPageTracking';
import {
  ArrowRight,
  ShoppingBag,
  Shirt,
  Package,
  Palette,
  ClipboardList,
  Truck,
  Calendar,
  Users,
  CheckCircle,
  TrendingUp,
  BarChart3,
  ShoppingCart,
  Gift,
  Layers,
} from 'lucide-react';

const MerchandiseCampaigns = () => {
  useLandingPageTracking({ pageType: 'marketing', pagePath: '/campaigns/merchandise' });

  useEffect(() => {
    document.title = "Merchandise Campaigns - Sell Team Gear & Products | Sponsorly";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Create an online store for team merchandise, spirit wear, and fundraising products. Manage variants, track inventory, and attribute sales to team members.');
    }
  }, []);

  const useCases = [
    { icon: Shirt, title: 'Team Apparel', desc: 'Jerseys, hoodies, and spirit wear' },
    { icon: Gift, title: 'Fundraising Products', desc: 'Cookie dough, candles, and more' },
    { icon: Palette, title: 'Custom Merchandise', desc: 'Branded items and accessories' },
    { icon: Calendar, title: 'Seasonal Items', desc: 'Holiday and special event products' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 lg:py-36 bg-gradient-to-br from-emerald-500/10 via-background to-primary/10 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 mb-6">
                <ShoppingBag className="h-5 w-5" />
                <span className="text-sm font-medium">Merchandise Campaigns</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Sell Team Gear and Fundraising Products with Ease
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                Create a beautiful online store for team merchandise or fundraising products. Manage sizes, colors, inventory, and track which team members sold what.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/signup">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                    Start Selling
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                    See a Demo
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-primary/20 rounded-2xl transform rotate-3" />
              <div className="relative bg-background rounded-2xl p-6 shadow-2xl border">
                <div className="space-y-4">
                  <div className="pb-4 border-b">
                    <h3 className="font-semibold">Spirit Wear Store</h3>
                    <p className="text-sm text-muted-foreground">Fall 2025 Collection</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Team Hoodie', price: '$45', variants: '8 sizes' },
                      { name: 'Practice Jersey', price: '$25', variants: '6 colors' },
                      { name: 'Dad Hat', price: '$20', variants: '3 colors' },
                      { name: 'Spirit Pack', price: '$75', variants: 'Bundle' },
                    ].map((item, i) => (
                      <div key={i} className="p-3 rounded-lg border hover:shadow-md transition-shadow">
                        <div className="h-16 bg-accent/50 rounded mb-2 flex items-center justify-center">
                          <Shirt className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-muted-foreground">{item.variants}</span>
                          <span className="text-emerald-600 font-semibold text-sm">{item.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="h-12 w-full bg-emerald-500 rounded-lg flex items-center justify-center text-white font-medium">
                    <ShoppingCart className="h-5 w-5 mr-2" /> View Cart (3)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 sm:py-20 bg-accent/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Perfect for Every Product Type
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're selling spirit wear or fundraising products, we've got you covered.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((item, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                    <item.icon className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 mb-4">
                <Package className="h-4 w-4" />
                <span className="text-sm font-medium">Store Features</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Everything You Need to Sell Online
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                A complete e-commerce experience designed specifically for school and nonprofit fundraising.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: Layers, text: 'Product variants for sizes, colors, and styles' },
                  { icon: ClipboardList, text: 'Inventory tracking and low-stock alerts' },
                  { icon: Package, text: 'Order management and status tracking' },
                  { icon: Truck, text: 'Fulfillment coordination and shipping' },
                  { icon: Calendar, text: 'Pre-order capabilities for bulk orders' },
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-primary/10 rounded-2xl transform -rotate-2" />
              <div className="relative bg-background rounded-2xl p-6 shadow-xl border">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <h3 className="font-semibold">Order Management</h3>
                    <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-full">12 new orders</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { order: '#1234', items: '2 items', status: 'Processing', color: 'bg-amber-500' },
                      { order: '#1233', items: '5 items', status: 'Shipped', color: 'bg-blue-500' },
                      { order: '#1232', items: '1 item', status: 'Delivered', color: 'bg-emerald-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                        <div>
                          <p className="font-medium text-sm">{item.order}</p>
                          <p className="text-xs text-muted-foreground">{item.items}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span className="text-xs">{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
                      <p className="text-xl font-bold text-emerald-600">$4,250</p>
                      <p className="text-xs text-muted-foreground">Total Sales</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/50 text-center">
                      <p className="text-xl font-bold text-foreground">127</p>
                      <p className="text-xs text-muted-foreground">Items Sold</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roster Integration */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-accent/30 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative bg-background rounded-2xl p-6 shadow-xl border">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-4 border-b">
                    <Users className="h-5 w-5 text-purple-500" />
                    <span className="font-semibold">Sales by Team Member</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'Jake M.', sales: '$425', items: 12, position: 1 },
                      { name: 'Emma S.', sales: '$380', items: 10, position: 2 },
                      { name: 'Tyler R.', sales: '$295', items: 8, position: 3 },
                    ].map((member) => (
                      <div key={member.position} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-600 font-semibold text-sm">
                            {member.position}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.items} items sold</p>
                          </div>
                        </div>
                        <span className="font-semibold text-emerald-600">{member.sales}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 mb-4">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Roster Integration</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Track Who Sells What
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                With roster-enabled merchandise campaigns, you can see exactly which team members are driving sales. Perfect for competitions and incentive programs.
              </p>
              <ul className="space-y-3">
                {[
                  'Individual sales attribution by team member',
                  'Leaderboards to encourage friendly competition',
                  'Incentive tracking for top sellers',
                  'Personal sharing links for each player',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link to="/campaigns/roster">
                  <Button variant="outline">
                    Learn About Roster Campaigns <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 bg-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Merchandise Campaigns That Perform
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { stat: '35%', label: 'Higher average order value', desc: 'with smart bundling' },
              { stat: '60%', label: 'Reduction in manual work', desc: 'with automated orders' },
              { stat: '2x', label: 'Sales with roster tracking', desc: 'vs. standard stores' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <p className="text-5xl font-bold text-primary mb-2">{item.stat}</p>
                <p className="text-lg font-semibold text-foreground">{item.label}</p>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-emerald-500/10 via-primary/10 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Start Selling for Your Team?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Launch your merchandise store in minutes. No technical skills required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/campaigns-overview">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                Explore All Campaign Types
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
};

export default MerchandiseCampaigns;
