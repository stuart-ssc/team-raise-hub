import { useState, useEffect, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  MoreHorizontal,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Plus,
  Send,
  Search,
  Mail,
  Download,
  CheckCircle2,
  Clock,
  Mic,
  TrendingUp,
  Trophy,
  Users,
  DollarSign,
  Target,
  Flame,
  ArrowRight,
  CreditCard,
  Heart,
} from "lucide-react";
import DashboardPageLayout from "@/components/DashboardPageLayout";
import { OrganizationSetupModal } from "@/components/OrganizationSetupModal";
import { GroupPaymentSetupDialog } from "@/components/GroupPaymentSetupDialog";

import { useOrganizationUser } from "@/hooks/useOrganizationUser";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import { getPermissionLevel } from "@/lib/permissions";
import PlayerDashboard from "@/components/PlayerDashboard";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type CampaignRow = any;

interface RosterPlayer {
  id: string; // organization_user.id
  userId: string | null;
  firstName: string;
  lastName: string;
  amountRaised: number;
  supporters: number;
  pitchStatus: "recorded" | "missing" | "invited" | "inactive";
  jersey?: string | null;
  lastActiveText?: string;
}

interface ActivityEvent {
  id: string;
  kind: "donation" | "pitch" | "join";
  primary: string;
  meta: string;
  ts: number;
}

const greetingFor = (date = new Date()) => {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const seasonLabel = (date = new Date()) => {
  const m = date.getMonth();
  const y = date.getFullYear();
  if (m <= 2) return `Winter ${y}`;
  if (m <= 5) return `Spring ${y}`;
  if (m <= 8) return `Summer ${y}`;
  return `Fall ${y}`;
};

const sumOrderItems = (items: any): number => {
  if (!items) return 0;
  let parsed: any = items;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return 0;
    }
  }
  if (!Array.isArray(parsed)) return 0;
  return parsed.reduce((sum: number, it: any) => {
    const price = Number(it?.price_at_purchase ?? it?.price ?? 0);
    const qty = Number(it?.quantity ?? 1);
    return sum + price * qty;
  }, 0);
};

const PITCH_BADGES: Record<RosterPlayer["pitchStatus"], { label: string; className: string }> = {
  recorded: {
    label: "Pitch Recorded",
    className: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400",
  },
  missing: {
    label: "No Pitch",
    className: "bg-muted text-muted-foreground border-border",
  },
  invited: {
    label: "Invite Pending",
    className: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
  },
  inactive: {
    label: "Inactive",
    className: "bg-muted text-muted-foreground border-border",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Dashboard = () => {
  const { user } = useAuth();
  const { organizationUser, loading } = useOrganizationUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { activeGroup } = useActiveGroup();

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [donors, setDonors] = useState<any[]>([]);
  const [donorCount, setDonorCount] = useState(0);
  const [donorSearch, setDonorSearch] = useState("");
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unconnectedGroups, setUnconnectedGroups] = useState<Array<{ id: string; group_name: string }>>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentDialogGroup, setPaymentDialogGroup] = useState<{ id: string; group_name: string } | null>(null);

  // New state for the redesigned supervisor view
  const [campaignFilter, setCampaignFilter] = useState<"all" | "active" | "scheduled" | "lagging" | "hot">("all");
  const [thisWeekTotal, setThisWeekTotal] = useState(0);
  const [recentDonorsCount, setRecentDonorsCount] = useState(0);
  const [rosterPlayers, setRosterPlayers] = useState<RosterPlayer[]>([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [pitchRecordedCount, setPitchRecordedCount] = useState(0);
  const [activeParticipants, setActiveParticipants] = useState(0);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [hasRosterAttribution, setHasRosterAttribution] = useState(false);

  // -------------------- Setup modal --------------------
  useEffect(() => {
    if (loading) return;

    if (user && !organizationUser) {
      const verifyNoOrgUser = async () => {
        const { data } = await supabase
          .from("organization_user")
          .select("id")
          .eq("user_id", user.id)
          .eq("active_user", true)
          .limit(1)
          .maybeSingle();

        if (data) {
          window.location.reload();
        } else {
          setShowSetupModal(true);
        }
      };
      verifyNoOrgUser();
    } else {
      setShowSetupModal(false);
    }
  }, [user, loading, organizationUser]);

  const handleSetupComplete = () => {
    setShowSetupModal(false);
  };

  // -------------------- Permission helpers --------------------
  const permissionLevel =
    organizationUser?.user_type?.permission_level ||
    getPermissionLevel(organizationUser?.user_type?.name || "");
  const isPlayer = permissionLevel === "participant" || permissionLevel === "supporter";
  const canManageUsers = permissionLevel === "organization_admin" || permissionLevel === "program_manager";

  // -------------------- Fetch: campaigns --------------------
  const fetchCampaigns = async () => {
    if (!organizationUser?.organization_id) return;

    try {
      let totalQuery = supabase
        .from("campaigns")
        .select(`*, groups!inner(id, group_name, organization_id)`)
        .eq("groups.organization_id", organizationUser.organization_id);

      if (activeGroup) totalQuery = totalQuery.eq("group_id", activeGroup.id);
      const { data: totalData } = await totalQuery;
      setTotalCampaigns(totalData?.length || 0);

      let publishedQuery = supabase
        .from("campaigns")
        .select(`*, groups!inner(id, group_name, organization_id), campaign_type(id, name)`)
        .eq("groups.organization_id", organizationUser.organization_id)
        .eq("publication_status", "published");

      if (activeGroup) publishedQuery = publishedQuery.eq("group_id", activeGroup.id);
      const { data: publishedData } = await publishedQuery;

      const today = new Date(new Date().toDateString());
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const filtered = (publishedData || []).filter((c) => {
        if (!c.end_date) return true;
        return new Date(c.end_date) >= thirtyDaysAgo;
      });

      filtered.sort((a, b) => {
        const aActive = !a.end_date || new Date(a.end_date) >= today;
        const bActive = !b.end_date || new Date(b.end_date) >= today;
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        if (aActive) {
          if (!a.end_date) return 1;
          if (!b.end_date) return -1;
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        }
        return new Date(b.end_date!).getTime() - new Date(a.end_date!).getTime();
      });

      setCampaigns(filtered);
      setHasRosterAttribution(filtered.some((c) => c.enable_roster_attribution));
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  useEffect(() => {
    if (organizationUser?.organization_id) fetchCampaigns();
  }, [organizationUser?.organization_id, activeGroup?.id]);

  // -------------------- Fetch: donors --------------------
  const fetchDonors = async (groupId?: string | null) => {
    if (!organizationUser?.organization_id) return;

    try {
      let donorEmailsForGroup: string[] | null = null;

      if (groupId) {
        const { data: donorEmails } = await supabase
          .from("orders")
          .select("customer_email, campaigns!inner(group_id)")
          .eq("campaigns.group_id", groupId)
          .not("customer_email", "is", null);

        donorEmailsForGroup = [...new Set(donorEmails?.map((o) => o.customer_email).filter(Boolean) || [])];

        if (donorEmailsForGroup.length === 0) {
          setDonors([]);
          setDonorCount(0);
          setRecentDonorsCount(0);
          return;
        }
      }

      let query = supabase
        .from("donor_profiles")
        .select("*")
        .eq("organization_id", organizationUser.organization_id);

      if (donorEmailsForGroup) query = query.in("email", donorEmailsForGroup);

      const { data } = await query.order("total_donations", { ascending: false }).limit(10);
      setDonors(data || []);

      let countQuery = supabase
        .from("donor_profiles")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationUser.organization_id);
      if (donorEmailsForGroup) countQuery = countQuery.in("email", donorEmailsForGroup);
      const { count } = await countQuery;
      setDonorCount(count || 0);

      // Recent donors (last 7 days, by created_at)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      let recentQuery = supabase
        .from("donor_profiles")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationUser.organization_id)
        .gte("created_at", sevenDaysAgo.toISOString());
      if (donorEmailsForGroup) recentQuery = recentQuery.in("email", donorEmailsForGroup);
      const { count: recentCount } = await recentQuery;
      setRecentDonorsCount(recentCount || 0);
    } catch (error) {
      console.error("Error fetching donors:", error);
    }
  };

  useEffect(() => {
    if (organizationUser?.organization_id) fetchDonors(activeGroup?.id);
  }, [organizationUser?.organization_id, activeGroup?.id]);

  // -------------------- Fetch: this-week donations --------------------
  const fetchThisWeekTotal = async () => {
    if (!organizationUser?.organization_id) return;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let q = supabase
      .from("orders")
      .select("items_total, total_amount, items, campaigns!inner(group_id, groups!inner(organization_id))")
      .eq("campaigns.groups.organization_id", organizationUser.organization_id)
      .in("status", ["succeeded", "completed", "paid"])
      .gte("created_at", sevenDaysAgo.toISOString())
      .limit(500);
    if (activeGroup) q = q.eq("campaigns.group_id", activeGroup.id);

    const { data } = await q;
    const total = (data || []).reduce(
      (sum, o: any) => sum + (Number(o.items_total) || sumOrderItems(o.items)),
      0,
    );
    setThisWeekTotal(total);
  };

  useEffect(() => {
    if (organizationUser?.organization_id) fetchThisWeekTotal();
  }, [organizationUser?.organization_id, activeGroup?.id]);

  // -------------------- Fetch: roster + pitch + activity --------------------
  const fetchRosterAndActivity = async () => {
    if (!organizationUser?.organization_id) {
      setRosterPlayers([]);
      setActivity([]);
      return;
    }

    try {
      // Participants in this organization (optionally filtered by group)
      let ouQuery = supabase
        .from("organization_user")
        .select(`
          id, user_id, group_id, created_at,
          user_type:user_type_id!inner(permission_level),
          profiles:user_id(first_name, last_name)
        `)
        .eq("organization_id", organizationUser.organization_id)
        .eq("active_user", true)
        .eq("user_type.permission_level", "participant");
      if (activeGroup) ouQuery = ouQuery.eq("group_id", activeGroup.id);

      const { data: orgUsers } = await ouQuery;
      const participants = (orgUsers || []) as any[];
      setTotalParticipants(participants.length);

      const ouIds = participants.map((p) => p.id);

      // Pitch links
      let pitchByOu: Record<string, boolean> = {};
      if (ouIds.length > 0) {
        const { data: links } = await supabase
          .from("roster_member_campaign_links")
          .select("roster_member_id, pitch_video_url, pitch_recorded_video_url, pitch_message")
          .in("roster_member_id", ouIds);
        (links || []).forEach((l: any) => {
          if (l.pitch_video_url || l.pitch_recorded_video_url || l.pitch_message) {
            pitchByOu[l.roster_member_id] = true;
          }
        });
      }
      setPitchRecordedCount(Object.keys(pitchByOu).length);

      // Attributed orders for these participants
      let amountByOu: Record<string, number> = {};
      let supportersByOu: Record<string, Set<string>> = {};
      const recentOrders: any[] = [];
      if (ouIds.length > 0) {
        const { data: orders } = await supabase
          .from("orders")
          .select("id, attributed_roster_member_id, items, items_total, total_amount, customer_email, customer_name, created_at, campaign_id, status, campaigns!inner(name)")
          .in("attributed_roster_member_id", ouIds)
          .in("status", ["succeeded", "completed", "paid"])
          .order("created_at", { ascending: false })
          .limit(200);

        (orders || []).forEach((o: any) => {
          const ouId = o.attributed_roster_member_id;
          const amt = Number(o.items_total) || sumOrderItems(o.items);
          amountByOu[ouId] = (amountByOu[ouId] || 0) + amt;
          if (o.customer_email) {
            if (!supportersByOu[ouId]) supportersByOu[ouId] = new Set();
            supportersByOu[ouId].add(o.customer_email);
          }
        });
      }

      // Recent (any) orders for activity feed
      let actOrdersQuery = supabase
        .from("orders")
        .select("id, customer_name, customer_email, items, items_total, total_amount, created_at, attributed_roster_member_id, campaigns!inner(name, group_id, groups!inner(organization_id))")
        .eq("campaigns.groups.organization_id", organizationUser.organization_id)
        .in("status", ["succeeded", "completed", "paid"])
        .order("created_at", { ascending: false })
        .limit(20);
      if (activeGroup) actOrdersQuery = actOrdersQuery.eq("campaigns.group_id", activeGroup.id);
      const { data: actOrders } = await actOrdersQuery;

      // Map attributed roster member -> name (from participants)
      const ouNameById: Record<string, string> = {};
      participants.forEach((p) => {
        const fn = p.profiles?.first_name || "";
        const ln = p.profiles?.last_name || "";
        ouNameById[p.id] = `${fn} ${ln}`.trim() || "a player";
      });

      const events: ActivityEvent[] = [];
      (actOrders || []).forEach((o: any) => {
        const amt = Number(o.items_total) || sumOrderItems(o.items);
        const donor = o.customer_name || o.customer_email?.split("@")[0] || "Someone";
        const player = o.attributed_roster_member_id ? ouNameById[o.attributed_roster_member_id] : null;
        events.push({
          id: `o-${o.id}`,
          kind: "donation",
          primary: player
            ? `${donor} gave $${amt.toLocaleString()} to ${player}`
            : `${donor} gave $${amt.toLocaleString()} to ${o.campaigns?.name || "your campaign"}`,
          meta: `${formatDistanceToNow(new Date(o.created_at), { addSuffix: true })} · ${o.campaigns?.name || "Campaign"}`,
          ts: new Date(o.created_at).getTime(),
        });
      });

      // Pitch-recorded events
      if (ouIds.length > 0) {
        const { data: pitchUpdates } = await supabase
          .from("roster_member_campaign_links")
          .select("id, roster_member_id, pitch_video_url, pitch_recorded_video_url, updated_at, campaigns:campaign_id(name)")
          .in("roster_member_id", ouIds)
          .or("pitch_video_url.not.is.null,pitch_recorded_video_url.not.is.null")
          .order("updated_at", { ascending: false })
          .limit(10);

        (pitchUpdates || []).forEach((p: any) => {
          const playerName = ouNameById[p.roster_member_id] || "A player";
          events.push({
            id: `p-${p.id}`,
            kind: "pitch",
            primary: `${playerName} recorded their pitch`,
            meta: `${formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })} · ${p.campaigns?.name || "Campaign"}`,
            ts: new Date(p.updated_at).getTime(),
          });
        });
      }

      // Recent roster joins (last 14 days)
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      participants
        .filter((p) => p.created_at && new Date(p.created_at) >= fourteenDaysAgo)
        .forEach((p) => {
          const name = ouNameById[p.id];
          events.push({
            id: `j-${p.id}`,
            kind: "join",
            primary: `${name} joined the roster`,
            meta: formatDistanceToNow(new Date(p.created_at), { addSuffix: true }),
            ts: new Date(p.created_at).getTime(),
          });
        });

      events.sort((a, b) => b.ts - a.ts);
      setActivity(events.slice(0, 10));

      // Build roster players (top 8 by amount raised)
      const players: RosterPlayer[] = participants.map((p) => {
        const fn = p.profiles?.first_name || "";
        const ln = p.profiles?.last_name || "";
        const amt = amountByOu[p.id] || 0;
        const sup = supportersByOu[p.id]?.size || 0;
        let pitchStatus: RosterPlayer["pitchStatus"] = "missing";
        if (!p.user_id) pitchStatus = "invited";
        else if (pitchByOu[p.id]) pitchStatus = "recorded";
        return {
          id: p.id,
          userId: p.user_id,
          firstName: fn || "Player",
          lastName: ln,
          amountRaised: amt,
          supporters: sup,
          pitchStatus,
        };
      });

      // Active = has user_id (accepted invite) AND any donation OR joined recently
      const activeCount = players.filter((p) => p.userId && (p.amountRaised > 0 || true)).length;
      setActiveParticipants(activeCount);

      players.sort((a, b) => b.amountRaised - a.amountRaised);
      setRosterPlayers(players);
    } catch (error) {
      console.error("Error fetching roster/activity:", error);
    }
  };

  useEffect(() => {
    if (organizationUser?.organization_id && !isPlayer) fetchRosterAndActivity();
  }, [organizationUser?.organization_id, activeGroup?.id, isPlayer]);

  // -------------------- Stats --------------------
  const getCampaignState = (c: any): "active" | "expired" | "scheduled" => {
    const today = new Date(new Date().toDateString());
    if (c.start_date && new Date(c.start_date) > today) return "scheduled";
    if (!c.end_date) return "active";
    return new Date(c.end_date) < today ? "expired" : "active";
  };

  const getCampaignTag = (c: any): "hot" | "lagging" | null => {
    const raised = c.amount_raised || 0;
    const goal = c.goal_amount || 0;
    if (goal <= 0) return null;
    const pct = (raised / goal) * 100;
    if (pct >= 80) return "hot";
    if (c.end_date) {
      const daysLeft = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (pct < 25 && daysLeft <= 30 && daysLeft > 0) return "lagging";
    }
    return null;
  };

  const activeCampaigns = campaigns.filter((c) => getCampaignState(c) === "active");
  const scheduledCampaigns = campaigns.filter((c) => getCampaignState(c) === "scheduled");
  const activeCampaignsCount = activeCampaigns.length;
  const totalAmountRaised = campaigns.reduce((s, c) => s + (c.amount_raised || 0), 0);
  const totalGoalAmount = campaigns.reduce((s, c) => s + (c.goal_amount || 0), 0);
  const leftToRaise = Math.max(0, totalGoalAmount - totalAmountRaised);
  const goalPercent = totalGoalAmount > 0 ? Math.min(100, (totalAmountRaised / totalGoalAmount) * 100) : 0;

  const endingSoonCount = activeCampaigns.filter((c) => {
    if (!c.end_date) return false;
    const days = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 && days < 14;
  }).length;

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (campaignFilter === "all") return true;
      if (campaignFilter === "active") return getCampaignState(c) === "active";
      if (campaignFilter === "scheduled") return getCampaignState(c) === "scheduled";
      if (campaignFilter === "hot") return getCampaignTag(c) === "hot";
      if (campaignFilter === "lagging") return getCampaignTag(c) === "lagging";
      return true;
    });
  }, [campaigns, campaignFilter]);

  const filteredDonors = useMemo(() => {
    if (!donorSearch.trim()) return donors;
    const q = donorSearch.toLowerCase();
    return donors.filter((d) => {
      const name = `${d.first_name || ""} ${d.last_name || ""}`.toLowerCase();
      return name.includes(q) || (d.email || "").toLowerCase().includes(q);
    });
  }, [donors, donorSearch]);

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return "—";
    if (!startDate) return endDate ? format(new Date(endDate), "MMM d, yyyy") : "—";
    if (!endDate) return format(new Date(startDate), "MMM d, yyyy");
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth())
      return `${format(start, "MMM d")}–${format(end, "d, yyyy")}`;
    if (start.getFullYear() === end.getFullYear())
      return `${format(start, "MMM d")}–${format(end, "MMM d, yyyy")}`;
    return `${format(start, "MMM d, yyyy")}–${format(end, "MMM d, yyyy")}`;
  };

  const daysLeftFor = (endDate: string | null) => {
    if (!endDate) return null;
    return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getDonorName = (donor: any) => {
    if (donor.first_name || donor.last_name)
      return `${donor.first_name || ""} ${donor.last_name || ""}`.trim();
    return donor.email.split("@")[0];
  };

  const getDonorInitials = (donor: any) => {
    if (donor.first_name && donor.last_name)
      return `${donor.first_name[0]}${donor.last_name[0]}`.toUpperCase();
    if (donor.first_name) return donor.first_name[0].toUpperCase();
    if (donor.last_name) return donor.last_name[0].toUpperCase();
    return donor.email[0].toUpperCase();
  };

  // -------------------- Pending requests --------------------
  const fetchPendingRequestsCount = async () => {
    if (!organizationUser?.organization_id || !canManageUsers) return;
    const { count } = await supabase
      .from("membership_requests")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationUser.organization_id)
      .eq("status", "pending");
    setPendingRequestsCount(count || 0);
  };

  useEffect(() => {
    if (organizationUser?.organization_id && canManageUsers) fetchPendingRequestsCount();
  }, [organizationUser?.organization_id, canManageUsers]);

  useEffect(() => {
    if (!organizationUser?.organization_id || !canManageUsers) return;
    const channel = supabase
      .channel("dashboard-membership-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "membership_requests",
          filter: `organization_id=eq.${organizationUser.organization_id}`,
        },
        () => fetchPendingRequestsCount(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationUser?.organization_id, canManageUsers]);

  // -------------------- Unconnected payments --------------------
  const fetchUnconnectedGroups = async () => {
    if (!organizationUser?.organization_id || !canManageUsers) return;

    let query = supabase
      .from("groups")
      .select("id, group_name, payment_processor_config, use_org_payment_account, organizations(payment_processor_config)")
      .eq("organization_id", organizationUser.organization_id)
      .eq("status", true);

    if (activeGroup) query = query.eq("id", activeGroup.id);

    const { data } = await query;
    const unconnected = (data || [])
      .filter((g: any) => {
        const groupEnabled = g.payment_processor_config?.account_enabled === true;
        const orgEnabled =
          g.use_org_payment_account === true &&
          g.organizations?.payment_processor_config?.account_enabled === true;
        return !(groupEnabled || orgEnabled);
      })
      .map((g: any) => ({ id: g.id, group_name: g.group_name }));
    setUnconnectedGroups(unconnected);
  };

  useEffect(() => {
    if (organizationUser?.organization_id && canManageUsers) fetchUnconnectedGroups();
  }, [organizationUser?.organization_id, canManageUsers, activeGroup?.id]);

  useEffect(() => {
    if (!paymentDialogOpen && organizationUser?.organization_id && canManageUsers) fetchUnconnectedGroups();
  }, [paymentDialogOpen]);

  // -------------------- Derived: greeting + headlines --------------------
  const firstName =
    (user?.user_metadata as any)?.first_name ||
    organizationUser?.organization?.name?.split(" ")[0] ||
    "there";
  const greeting = greetingFor();
  const orgOrGroupName = activeGroup?.group_name || organizationUser?.organization?.name || "Your team";

  // Players w/o pitch (only meaningful when roster attribution is in play)
  const playersMissingPitch = useMemo(() => {
    if (!hasRosterAttribution) return 0;
    return rosterPlayers.filter((p) => p.pitchStatus === "missing" && p.userId).length;
  }, [rosterPlayers, hasRosterAttribution]);

  // Build attention items
  const attentionItems = useMemo(() => {
    const items: Array<{
      key: string;
      label: string;
      count?: number;
      icon: React.ReactNode;
      onClick: () => void;
      tone: "amber" | "rose" | "blue" | "green";
    }> = [];

    if (canManageUsers && pendingRequestsCount > 0) {
      items.push({
        key: "pending",
        label: `Approve ${pendingRequestsCount} membership ${pendingRequestsCount === 1 ? "request" : "requests"}`,
        count: pendingRequestsCount,
        icon: <UserPlus className="h-4 w-4" />,
        onClick: () => navigate("/dashboard/users?tab=pending"),
        tone: "amber",
      });
    }

    if (hasRosterAttribution && playersMissingPitch > 0) {
      items.push({
        key: "pitch",
        label: `Remind ${playersMissingPitch} ${playersMissingPitch === 1 ? "player" : "players"} to record their pitch`,
        count: playersMissingPitch,
        icon: <Mic className="h-4 w-4" />,
        onClick: () => navigate("/dashboard/rosters"),
        tone: "blue",
      });
    }

    unconnectedGroups.forEach((g) => {
      items.push({
        key: `pay-${g.id}`,
        label: `Connect payment for ${g.group_name}`,
        icon: <CreditCard className="h-4 w-4" />,
        onClick: () => {
          setPaymentDialogGroup(g);
          setPaymentDialogOpen(true);
        },
        tone: "rose",
      });
    });

    if (recentDonorsCount > 0) {
      items.push({
        key: "thanks",
        label: `Schedule a thank-you for ${recentDonorsCount} new ${recentDonorsCount === 1 ? "donor" : "donors"}`,
        count: recentDonorsCount,
        icon: <Heart className="h-4 w-4" />,
        onClick: () => navigate("/dashboard/donors"),
        tone: "green",
      });
    }

    // Critical "Connect payment" rows always come first
    const sorted = [
      ...items.filter((i) => i.key.startsWith("pay-")),
      ...items.filter((i) => !i.key.startsWith("pay-")),
    ];
    return sorted;
  }, [canManageUsers, pendingRequestsCount, hasRosterAttribution, playersMissingPitch, unconnectedGroups, recentDonorsCount, navigate]);

  const toneClass = (t: "amber" | "rose" | "blue" | "green") => {
    switch (t) {
      case "amber":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
      case "rose":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
      case "blue":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
      case "green":
        return "bg-green-500/10 text-green-700 dark:text-green-300";
    }
  };

  const activityDot = (kind: ActivityEvent["kind"]) => {
    switch (kind) {
      case "donation":
        return "bg-green-500";
      case "pitch":
        return "bg-blue-500";
      case "join":
        return "bg-amber-500";
    }
  };

  // -------------------- Render --------------------
  return (
    <DashboardPageLayout showBreadcrumbs={false}>
      <div className="space-y-4 md:space-y-6">
        {isPlayer ? (
          <PlayerDashboard />
        ) : (
          <>
            {/* ============================== HERO ============================== */}
            <div className="relative overflow-hidden rounded-xl border border-sidebar-border bg-gradient-to-br from-sidebar via-sidebar to-primary/40 text-sidebar-foreground shadow-lg">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{
                  background:
                    "radial-gradient(circle at 85% 15%, hsl(var(--primary) / 0.35), transparent 55%), radial-gradient(circle at 10% 90%, hsl(var(--primary) / 0.20), transparent 50%)",
                }}
              />
              <div className="relative p-6 md:p-8">
                {/* Top row: pills + actions */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-white/20 bg-white/10 text-sidebar-foreground/90">
                      <Trophy className="h-3 w-3 mr-1" /> {seasonLabel()}
                    </Badge>
                    {thisWeekTotal > 0 && (
                      <Badge className="bg-primary/90 text-primary-foreground hover:bg-primary border-0">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +${thisWeekTotal.toLocaleString()} this week
                      </Badge>
                    )}
                    {totalParticipants > 0 && (
                      <Badge variant="outline" className="border-white/20 bg-white/10 text-sidebar-foreground/90">
                        <Users className="h-3 w-3 mr-1" />
                        {activeParticipants}/{totalParticipants} players active
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-white text-sidebar hover:bg-white/90 font-semibold"
                      onClick={() => navigate("/dashboard/fundraisers/ai-builder")}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Fundraiser
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                      onClick={() => navigate("/dashboard/messages")}
                    >
                      <Send className="h-4 w-4 mr-1" /> Send Roster Blast
                    </Button>
                  </div>
                </div>

                {/* Greeting + headline */}
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-[0.18em] text-sidebar-foreground/60 font-semibold">
                    {greeting}, {firstName}
                  </p>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mt-2 leading-tight">
                    <span className="text-sidebar-foreground/95">{orgOrGroupName} raised </span>
                    <span className="italic bg-gradient-to-r from-primary-foreground to-primary-foreground/70 bg-clip-text text-transparent">
                      ${totalAmountRaised.toLocaleString()}
                    </span>
                    <span className="text-sidebar-foreground/95"> toward </span>
                    <span className="italic bg-gradient-to-r from-primary-foreground to-primary-foreground/70 bg-clip-text text-transparent">
                      ${totalGoalAmount.toLocaleString()}
                    </span>
                    <span className="text-sidebar-foreground/95">.</span>
                  </h1>
                  <p className="mt-3 text-sm text-sidebar-foreground/75">
                    {activeCampaignsCount} {activeCampaignsCount === 1 ? "campaign" : "campaigns"} live · {donorCount} {donorCount === 1 ? "donor" : "donors"}
                    {hasRosterAttribution && totalParticipants > 0 && (
                      <> · {pitchRecordedCount} of {totalParticipants} players have recorded their pitch</>
                    )}
                  </p>
                </div>

                {/* Season goal bar */}
                {totalGoalAmount > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.15em] text-sidebar-foreground/60 font-semibold mb-2">
                      <span>Season Goal</span>
                      <span>{Math.round(goalPercent)}% to ${totalGoalAmount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-foreground/80 transition-all"
                        style={{ width: `${goalPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* KPI tiles */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/60 font-semibold">
                      Active Campaigns
                    </p>
                    <p className="text-2xl md:text-3xl font-bold mt-1 text-white">{activeCampaignsCount}</p>
                    <p className="text-xs text-sidebar-foreground/60 mt-1">
                      {endingSoonCount > 0 ? `${endingSoonCount} ending in <14 days` : `${scheduledCampaigns.length} scheduled`}
                    </p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/60 font-semibold">
                      Amount Raised
                    </p>
                    <p className="text-2xl md:text-3xl font-bold mt-1 text-white">
                      ${totalAmountRaised.toLocaleString()}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 mt-1">
                      Across {donorCount} {donorCount === 1 ? "donor" : "donors"}
                    </p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/60 font-semibold">
                      Total Donors
                    </p>
                    <p className="text-2xl md:text-3xl font-bold mt-1 text-white">{donorCount.toLocaleString()}</p>
                    <p className="text-xs text-sidebar-foreground/60 mt-1">
                      {recentDonorsCount > 0 ? `+${recentDonorsCount} this week` : "No new this week"}
                    </p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/60 font-semibold">
                      Left to Raise
                    </p>
                    <p className="text-2xl md:text-3xl font-bold mt-1 text-white">
                      ${leftToRaise.toLocaleString()}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 mt-1">
                      {totalGoalAmount > 0 ? `${Math.round(100 - goalPercent)}% remaining` : "Set a goal to track"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================== ATTENTION + ACTIVITY ============================== */}
            <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
              {/* Needs your attention */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertCircle className="h-4 w-4 text-amber-500" /> Needs your attention
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {attentionItems.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <CheckCircle2 className="h-4 w-4 text-green-500" /> All clear — nothing needs you right now.
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {attentionItems.map((item) => {
                        const isCritical = item.key.startsWith("pay-");
                        return (
                          <li key={item.key}>
                            <button
                              type="button"
                              onClick={item.onClick}
                              className={
                                isCritical
                                  ? "flex w-full items-center justify-between gap-3 py-3 px-3 -mx-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors border border-destructive shadow-sm"
                                  : "flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors"
                              }
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className={
                                    isCritical
                                      ? "p-2 rounded-md bg-white/15 text-destructive-foreground"
                                      : `p-2 rounded-md ${toneClass(item.tone)}`
                                  }
                                >
                                  {item.icon}
                                </span>
                                <span className={`text-sm truncate ${isCritical ? "font-semibold" : "font-medium"}`}>
                                  {item.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isCritical ? (
                                  <span className="bg-white/15 text-destructive-foreground text-[11px] px-2 py-0.5 rounded-full font-medium">
                                    Action required
                                  </span>
                                ) : (
                                  item.count !== undefined && (
                                    <Badge variant="secondary" className="text-xs">
                                      {item.count}
                                    </Badge>
                                  )
                                )}
                                <ChevronRight
                                  className={`h-4 w-4 ${isCritical ? "text-destructive-foreground/80" : "text-muted-foreground"}`}
                                />
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Recent activity */}
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-primary" /> Recent activity
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/donors")}>
                    View all
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  {activity.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4">No recent activity yet.</div>
                  ) : (
                    <ul className="space-y-3">
                      {activity.slice(0, 7).map((ev) => (
                        <li key={ev.id} className="flex items-start gap-3">
                          <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${activityDot(ev.kind)}`} />
                          <div className="min-w-0">
                            <p className="text-sm text-foreground truncate">{ev.primary}</p>
                            <p className="text-xs text-muted-foreground truncate">{ev.meta}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ============================== FUNDRAISERS ============================== */}
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Fundraisers</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeCampaignsCount} active · {scheduledCampaigns.length} scheduled · ${totalAmountRaised.toLocaleString()} raised this season
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Select value={campaignFilter} onValueChange={(v) => setCampaignFilter(v as any)}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="lagging">Lagging</SelectItem>
                      <SelectItem value="hot">Hot</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => navigate("/dashboard/fundraisers")}>
                    Manage All
                  </Button>
                  <Button size="sm" className="w-full sm:w-auto" onClick={() => navigate("/dashboard/fundraisers/ai-builder")}>
                    <Plus className="h-4 w-4 mr-1" /> Add Fundraiser
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {totalCampaigns === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-lg font-medium mb-2">Let's get started — Create a Fundraiser Now</div>
                    <div className="text-muted-foreground mb-4">Start fundraising by creating your first fundraiser</div>
                    <Button onClick={() => navigate("/dashboard/fundraisers/ai-builder")}>Create Fundraiser</Button>
                  </div>
                ) : filteredCampaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-lg font-medium mb-2">No fundraisers match this filter</div>
                    <div className="text-muted-foreground">Try a different filter or create a new fundraiser</div>
                  </div>
                ) : isMobile ? (
                  <div className="space-y-3">
                    {filteredCampaigns.map((campaign) => {
                      const state = getCampaignState(campaign);
                      const tag = getCampaignTag(campaign);
                      const raised = campaign.amount_raised || 0;
                      const goal = campaign.goal_amount || 0;
                      const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
                      const dl = daysLeftFor(campaign.end_date);
                      return (
                        <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2 gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold truncate">{campaign.name}</h4>
                                  {state === "active" ? (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400">
                                      Active
                                    </Badge>
                                  ) : state === "scheduled" ? (
                                    <Badge variant="outline">Scheduled</Badge>
                                  ) : (
                                    <Badge variant="secondary">Expired</Badge>
                                  )}
                                  {tag === "hot" && (
                                    <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20 hover:bg-orange-500/10">
                                      <Flame className="h-3 w-3 mr-1" /> Hot
                                    </Badge>
                                  )}
                                  {tag === "lagging" && (
                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400">
                                      Lagging
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{campaign.groups?.group_name}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/dashboard/fundraisers/${campaign.id}/edit`)}
                              >
                                Manage
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Raised</span>
                                <span className="font-semibold">
                                  ${raised.toLocaleString()} / ${goal.toLocaleString()}
                                </span>
                              </div>
                              {goal > 0 && <Progress value={pct} className="h-1.5" />}
                              <div className="text-xs text-muted-foreground flex items-center justify-between">
                                <span>{formatDateRange(campaign.start_date, campaign.end_date)}</span>
                                {dl !== null && dl > 0 && (
                                  <span className={dl < 14 ? "text-rose-600 dark:text-rose-400 font-medium" : ""}>
                                    {dl} {dl === 1 ? "day" : "days"} left
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[180px]">Campaign</TableHead>
                          <TableHead className="min-w-[120px]">Status</TableHead>
                          <TableHead className="min-w-[120px]">Group</TableHead>
                          <TableHead className="min-w-[180px]">Amount Raised</TableHead>
                          <TableHead className="min-w-[160px]">Dates</TableHead>
                          <TableHead className="w-[120px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCampaigns.map((campaign) => {
                          const state = getCampaignState(campaign);
                          const tag = getCampaignTag(campaign);
                          const raised = campaign.amount_raised || 0;
                          const goal = campaign.goal_amount || 0;
                          const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
                          const dl = daysLeftFor(campaign.end_date);
                          return (
                            <TableRow key={campaign.id}>
                              <TableCell className="font-medium">{campaign.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {state === "active" ? (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400">
                                      Active
                                    </Badge>
                                  ) : state === "scheduled" ? (
                                    <Badge variant="outline">Scheduled</Badge>
                                  ) : (
                                    <Badge variant="secondary">Expired</Badge>
                                  )}
                                  {tag === "hot" && (
                                    <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20 hover:bg-orange-500/10">
                                      <Flame className="h-3 w-3 mr-1" /> Hot
                                    </Badge>
                                  )}
                                  {tag === "lagging" && (
                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400">
                                      Lagging
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs text-muted-foreground">{campaign.groups?.group_name}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm font-medium">
                                  ${raised.toLocaleString()} / ${goal.toLocaleString()}
                                </div>
                                {goal > 0 && (
                                  <div className="mt-1.5 flex items-center gap-2">
                                    <Progress value={pct} className="h-1.5 w-24" />
                                    <span className="text-xs text-muted-foreground">{Math.round(pct)}%</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{formatDateRange(campaign.start_date, campaign.end_date)}</div>
                                {dl !== null && dl > 0 && (
                                  <div className={`text-xs mt-0.5 ${dl < 14 ? "text-rose-600 dark:text-rose-400 font-medium" : "text-muted-foreground"}`}>
                                    {dl} {dl === 1 ? "day" : "days"} left
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/dashboard/fundraisers/${campaign.id}/edit`)}
                                  >
                                    Manage
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ============================== ROSTER + DONORS ============================== */}
            <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
              {/* Roster card */}
              {activeGroup && rosterPlayers.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">Roster — {activeGroup.group_name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {rosterPlayers.length} {rosterPlayers.length === 1 ? "player" : "players"} · sorted by amount raised
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/rosters")}>
                        <Download className="h-4 w-4 mr-1" /> Export
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/dashboard/users?invite=participant&group=${activeGroup.id}`)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" /> Invite Player
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="divide-y divide-border">
                      {rosterPlayers.slice(0, 8).map((p, idx) => {
                        const initials = `${p.firstName?.[0] || ""}${p.lastName?.[0] || ""}`.toUpperCase() || "P";
                        const badge = PITCH_BADGES[p.pitchStatus];
                        return (
                          <li key={p.id} className="flex items-center gap-3 py-3">
                            <span className="w-6 text-xs text-muted-foreground tabular-nums">#{idx + 1}</span>
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {p.firstName} {p.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {p.supporters} {p.supporters === 1 ? "supporter" : "supporters"}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold tabular-nums">${p.amountRaised.toLocaleString()}</p>
                              <Badge variant="outline" className={`text-[10px] mt-0.5 ${badge.className}`}>
                                {badge.label}
                              </Badge>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    {rosterPlayers.length > 8 && (
                      <div className="pt-3 text-center">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/rosters")}>
                          View all <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Donors card */}
              <Card className={activeGroup && rosterPlayers.length > 0 ? "" : "lg:col-span-2"}>
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Donors</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{donorCount} total</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={donorSearch}
                        onChange={(e) => setDonorSearch(e.target.value)}
                        placeholder="Search donors"
                        className="pl-8 h-9 w-[180px]"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/donors")}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredDonors.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="text-sm font-medium mb-1">
                        {donorSearch ? "No donors match your search" : "No donors yet"}
                      </div>
                      <div className="text-muted-foreground text-xs mb-4">
                        {donorSearch ? "Try a different name or email" : "Donors will appear here once they contribute"}
                      </div>
                    </div>
                  ) : isMobile ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredDonors.map((donor) => (
                        <Card
                          key={donor.id}
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => navigate(`/dashboard/donors/${donor.id}`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate">{getDonorName(donor)}</h4>
                                <p className="text-xs text-muted-foreground truncate">{donor.email}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  ${(donor.total_donations || 0).toLocaleString()} donated
                                </p>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {donor.rfm_segment || "New"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[150px]">Name</TableHead>
                            <TableHead className="min-w-[180px]">Email</TableHead>
                            <TableHead className="min-w-[100px]">Total</TableHead>
                            <TableHead className="min-w-[90px]">Segment</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDonors.map((donor) => (
                            <TableRow
                              key={donor.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => navigate(`/dashboard/donors/${donor.id}`)}
                            >
                              <TableCell className="flex items-center gap-2.5">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">{getDonorInitials(donor)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">{getDonorName(donor)}</span>
                              </TableCell>
                              <TableCell className="text-sm">{donor.email}</TableCell>
                              <TableCell className="text-sm font-medium">
                                ${(donor.total_donations || 0).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {donor.rfm_segment || "New"}
                                </Badge>
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  asChild
                                >
                                  <a href={`mailto:${donor.email}`} aria-label={`Email ${getDonorName(donor)}`}>
                                    <Mail className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Setup Modal */}
        {user && (
          <OrganizationSetupModal
            open={showSetupModal}
            onComplete={handleSetupComplete}
            userId={user.id}
          />
        )}

        {/* Payment Setup Dialog */}
        {paymentDialogGroup && (
          <GroupPaymentSetupDialog
            open={paymentDialogOpen}
            onOpenChange={setPaymentDialogOpen}
            groupId={paymentDialogGroup.id}
            groupName={paymentDialogGroup.group_name}
          />
        )}
      </div>
    </DashboardPageLayout>
  );
};

export default Dashboard;
