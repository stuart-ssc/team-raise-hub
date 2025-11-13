import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Loader2, Trash2, CheckCheck } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

const NotificationHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [user, filterType, filterStatus, startDate, endDate]);

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Apply type filter
    if (filterType !== "all") {
      query = query.eq("type", filterType);
    }

    // Apply status filter
    if (filterStatus === "read") {
      query = query.eq("read", true);
    } else if (filterStatus === "unread") {
      query = query.eq("read", false);
    }

    // Apply date range filter
    if (startDate) {
      query = query.gte("created_at", new Date(startDate).toISOString());
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query = query.lte("created_at", endDateTime.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      toast.error("Failed to mark as read");
      return;
    }

    fetchNotifications();
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      toast.error("Failed to mark all as read");
      return;
    }

    toast.success("All notifications marked as read");
    fetchNotifications();
  };

  const deleteNotification = async (notificationId: string) => {
    setDeleting(notificationId);
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      toast.error("Failed to delete notification");
    } else {
      toast.success("Notification deleted");
      fetchNotifications();
    }
    setDeleting(null);
  };

  const deleteAllRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id)
      .eq("read", true);

    if (error) {
      toast.error("Failed to delete notifications");
      return;
    }

    toast.success("All read notifications deleted");
    fetchNotifications();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getTypeBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case "success":
        return "default";
      case "warning":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "outline";
    }
  };

  const clearFilters = () => {
    setFilterType("all");
    setFilterStatus("all");
    setStartDate("");
    setEndDate("");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Notification History</h1>
                <p className="text-muted-foreground mt-1">
                  View and manage all your notifications
                </p>
              </div>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button variant="outline" onClick={markAllAsRead}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark All Read
                  </Button>
                )}
                <Button variant="outline" onClick={deleteAllRead}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Read
                </Button>
              </div>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Filter notifications by type, status, and date</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="unread">Unread</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button variant="ghost" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No notifications found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`transition-all hover:shadow-md cursor-pointer ${
                      !notification.read ? "border-l-4 border-l-primary" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div
                          className="flex-1"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getTypeBadgeVariant(notification.type)}>
                              {notification.type}
                            </Badge>
                            {!notification.read && (
                              <Badge variant="outline">Unread</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <h3 className="font-semibold text-foreground mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          disabled={deleting === notification.id}
                        >
                          {deleting === notification.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationHistory;
