import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  userId: string;
  rosterMemberId: string;
  firstName: string;
  lastName: string;
  totalRaised: number;
  donationCount: number;
  isCurrentUser: boolean;
}

/**
 * Fetch a fully-aggregated, sorted roster leaderboard.
 * - Sort by totalRaised desc when any donations exist.
 * - Otherwise alphabetical fallback.
 * - Returns ALL active roster members (no slice).
 */
export async function fetchRosterLeaderboard(
  rosterIds: number[],
  currentUserId?: string | null
): Promise<LeaderboardEntry[]> {
  if (!rosterIds || rosterIds.length === 0) return [];

  const { data: teammates, error: teammatesError } = await supabase
    .from("organization_user")
    .select("id, user_id")
    .in("roster_id", rosterIds)
    .eq("active_user", true);

  if (teammatesError) throw teammatesError;
  if (!teammates || teammates.length === 0) return [];

  const rosterMemberIds = teammates.map((t) => t.id);
  const userIds = teammates.map((t) => t.user_id).filter(Boolean) as string[];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", userIds);

  if (profilesError) throw profilesError;

  const profilesMap: Record<string, { first_name: string | null; last_name: string | null }> = {};
  profiles?.forEach((p) => {
    profilesMap[p.id] = { first_name: p.first_name, last_name: p.last_name };
  });

  const { data: donationData, error: donationError } = await supabase
    .from("orders")
    .select("attributed_roster_member_id, items")
    .in("attributed_roster_member_id", rosterMemberIds)
    .in("status", ["succeeded", "completed"]);

  if (donationError) throw donationError;

  const donationsByMember: Record<string, { total: number; count: number }> = {};
  donationData?.forEach((order) => {
    const memberId = order.attributed_roster_member_id;
    if (!memberId) return;
    if (!donationsByMember[memberId]) {
      donationsByMember[memberId] = { total: 0, count: 0 };
    }
    const itemsTotal =
      (order.items as any[])?.reduce(
        (sum, item) => sum + (item.price_at_purchase || 0) * (item.quantity || 1),
        0
      ) || 0;
    donationsByMember[memberId].total += itemsTotal;
    donationsByMember[memberId].count += 1;
  });

  const allEntries: LeaderboardEntry[] = teammates.map((teammate) => {
    const profile = profilesMap[teammate.user_id] || null;
    const donations = donationsByMember[teammate.id] || { total: 0, count: 0 };
    return {
      userId: teammate.user_id,
      rosterMemberId: teammate.id,
      firstName: profile?.first_name || "Unknown",
      lastName: profile?.last_name || "",
      totalRaised: donations.total,
      donationCount: donations.count,
      isCurrentUser: !!currentUserId && teammate.user_id === currentUserId,
    };
  });

  const hasAnyDonations = allEntries.some((e) => e.totalRaised > 0);
  return hasAnyDonations
    ? [...allEntries].sort((a, b) => b.totalRaised - a.totalRaised)
    : [...allEntries].sort(
        (a, b) =>
          (a.firstName || "").localeCompare(b.firstName || "") ||
          (a.lastName || "").localeCompare(b.lastName || "")
      );
}
