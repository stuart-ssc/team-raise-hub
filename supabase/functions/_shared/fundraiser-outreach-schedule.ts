// Shared schedule computation. Used by both the enrollment edge function
// (for actual scheduling) and the client dialog (for preview).

export type DripStage = "intro" | "weekly" | "final_week" | "final_48h" | "last_chance";

export interface ScheduledStep {
  stage: DripStage;
  // ISO timestamp string (UTC).
  sendAt: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Compute the drip schedule for a fundraiser.
 *
 * Rules:
 * - If the campaign has already ended → returns [].
 * - Final 7 days: schedule 3 emails (Day-7 final_week, Day-3 final_48h, Day-1 last_chance).
 * - Before the final 7 days: schedule weekly emails starting now (intro, then weekly each 7 days).
 * - First step is always "now" (intro or final_week, depending on remaining time).
 * - Hard cap of 8 steps.
 * - Steps with the same calendar day are deduped (keeping the latest stage).
 */
export function computeOutreachSchedule(
  endDate: Date,
  now: Date = new Date(),
): ScheduledStep[] {
  const endMs = endDate.getTime();
  const nowMs = now.getTime();
  if (endMs <= nowMs) return [];

  const finalWindowStartMs = endMs - 7 * DAY_MS;
  const steps: ScheduledStep[] = [];

  // Pre-final-week weekly cadence
  let cursorMs = nowMs;
  let isFirst = true;
  while (cursorMs < finalWindowStartMs && steps.length < 5) {
    steps.push({
      stage: isFirst ? "intro" : "weekly",
      sendAt: new Date(cursorMs).toISOString(),
    });
    isFirst = false;
    cursorMs += 7 * DAY_MS;
  }

  // Final week steps (clamped so we never schedule before "now")
  const finalWeekAt = Math.max(nowMs, endMs - 7 * DAY_MS);
  const final48hAt = Math.max(nowMs, endMs - 3 * DAY_MS);
  const lastChanceAt = Math.max(nowMs, endMs - 1 * DAY_MS);

  // Only schedule each final-week stage if it's strictly before the end
  if (finalWeekAt < endMs) {
    steps.push({ stage: "final_week", sendAt: new Date(finalWeekAt).toISOString() });
  }
  if (final48hAt < endMs && final48hAt > finalWeekAt) {
    steps.push({ stage: "final_48h", sendAt: new Date(final48hAt).toISOString() });
  }
  if (lastChanceAt < endMs && lastChanceAt > final48hAt) {
    steps.push({ stage: "last_chance", sendAt: new Date(lastChanceAt).toISOString() });
  }

  // If no pre-final cadence ran (campaign is already inside the final 7 days),
  // make sure the very first step fires immediately.
  if (steps.length > 0 && new Date(steps[0].sendAt).getTime() > nowMs && cursorMs >= finalWindowStartMs) {
    steps[0] = { ...steps[0], sendAt: new Date(nowMs).toISOString() };
  }

  // Dedupe steps that fall on the same calendar minute, keeping the latest stage
  // (so e.g. final_week at "now" wins over an earlier intro at the same instant).
  const dayMap = new Map<string, ScheduledStep>();
  for (const s of steps) {
    const dayKey = s.sendAt.slice(0, 16); // minute precision
    dayMap.set(dayKey, s);
  }
  const deduped = Array.from(dayMap.values()).sort(
    (a, b) => new Date(a.sendAt).getTime() - new Date(b.sendAt).getTime(),
  );

  return deduped.slice(0, 8);
}