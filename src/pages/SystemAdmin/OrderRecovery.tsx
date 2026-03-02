import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SystemAdminPageLayout } from "@/components/SystemAdminPageLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Search, CheckCircle, Loader2 } from "lucide-react";

interface OrderResult {
  id: string;
  status: string;
  total_amount: number;
  customer_email: string | null;
  customer_name: string | null;
  created_at: string;
  updated_at: string;
  stripe_payment_intent_id: string | null;
  campaign_id: string | null;
  campaigns?: { name: string } | null;
}

const OrderRecovery = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<OrderResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const query = searchQuery.trim();
      
      // Search by order ID, email, or campaign name
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, total_amount, customer_email, customer_name, created_at, updated_at, stripe_payment_intent_id, campaign_id, campaigns(name)")
        .or(`id.eq.${query},customer_email.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setResults((data as unknown as OrderResult[]) || []);
    } catch (err: any) {
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (orderId: string) => {
    setRecovering(orderId);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "succeeded", updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;
      
      toast({ title: "Order recovered", description: `Order ${orderId.slice(0, 8)}... marked as succeeded.` });
      setResults(prev => prev.map(o => o.id === orderId ? { ...o, status: "succeeded" } : o));
    } catch (err: any) {
      toast({ title: "Recovery failed", description: err.message, variant: "destructive" });
    } finally {
      setRecovering(null);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "succeeded": case "completed": return "default";
      case "pending": return "secondary";
      case "failed": return "destructive";
      default: return "outline";
    }
  };

  return (
    <SystemAdminPageLayout title="Order Recovery">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Order Recovery</h1>
          <p className="text-muted-foreground">Search and recover orders stuck in pending status due to webhook failures.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search by order ID or customer email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2">Search</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Stripe PI</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <div>{order.customer_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{order.customer_email || "—"}</div>
                      </TableCell>
                      <TableCell>{(order.campaigns as any)?.name || "—"}</TableCell>
                      <TableCell>${(order.total_amount / 100).toFixed(2)}</TableCell>
                      <TableCell><Badge variant={statusColor(order.status)}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</Badge></TableCell>
                      <TableCell className="text-xs">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-xs">{order.stripe_payment_intent_id?.slice(0, 12) || "—"}</TableCell>
                      <TableCell>
                        {order.status === "pending" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" disabled={recovering === order.id}>
                                {recovering === order.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                Recover
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Mark Order as Succeeded?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will mark order <span className="font-mono">{order.id.slice(0, 8)}...</span> as succeeded, 
                                  triggering donor profile creation and campaign total updates. 
                                  Only do this if you've confirmed payment was received in Stripe.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRecover(order.id)}>
                                  Confirm Recovery
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {results.length === 0 && searchQuery && !loading && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No orders found matching "{searchQuery}"
            </CardContent>
          </Card>
        )}
      </div>
    </SystemAdminPageLayout>
  );
};

export default OrderRecovery;
