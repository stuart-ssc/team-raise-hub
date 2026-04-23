// Client-side mirror of supabase/functions/_shared/fundraiser-outreach-schedule.ts
// Used to render the cadence preview in the ContactFundraiserDialog.

export type DripStage = "intro" | "weekly" | "final_week" | "final_48h" | "last_chance";

export interface ScheduledStep {
  stage: DripStage;
  sendAt: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeOutreachSchedule(endDate: Date, now: Date = new Date()): ScheduledStep[] {
  const endMs = endDate.getTime();
  const nowMs = now.getTime();
  if (endMs <= nowMs) return [];

  const finalWindowStartMs = endMs - 7 * DAY_MS;
  const steps: ScheduledStep[] = [];

  let cursorMs = nowMs;
  let isFirst = true;
  while (cursorMs < finalWindowStartMs && steps.length < 5) {
    steps.push({ stage: isFirst ? "intro" : "weekly", sendAt: new Date(cursorMs).toISOString() });
    isFirst = false;
    cursorMs += 7 * DAY_MS;
  }

  const finalWeekAt = Math.max(nowMs, endMs - 7 * DAY_MS);
  const final48hAt = Math.max(nowMs, endMs - 3 * DAY_MS);
  const lastChanceAt = Math.max(nowMs, endMs - 1 * DAY_MS);

  if (finalWeekAt < endMs) steps.push({ stage: "final_week", sendAt: new Date(finalWeekAt).toISOString() });
  if (final48hAt < endMs && final48hAt > finalWeekAt)
    steps.push({ stage: "final_48h", sendAt: new Date(final48hAt).toISOString() });
  if (lastChanceAt < endMs && lastChanceAt > final48hAt)
    steps.push({ stage: "last_chance", sendAt: new Date(lastChanceAt).toISOString() });

  if (steps.length > 0 && new Date(steps[0].sendAt).getTime() > nowMs && cursorMs >= finalWindowStartMs) {
    steps[0] = { ...steps[0], sendAt: new Date(nowMs).toISOString() };
  }

  const dayMap = new Map<string, ScheduledStep>();
  for (const s of steps) dayMap.set(s.sendAt.slice(0, 16), s);
  return Array.from(dayMap.values())
    .sort((a, b) => new Date(a.sendAt).getTime() - new Date(b.sendAt).getTime())
    .slice(0, 8);
}

export const stageLabel: Record<DripStage, string> = {
  intro: "Intro",
  weekly: "Weekly check-in",
  final_week: "Final week",
  final_48h: "48 hours left",
  last_chance: "Last chance",
};