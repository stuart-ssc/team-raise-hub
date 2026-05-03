import { ReactNode } from "react";

export function getDaysLeft(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export function formatHeadline(title: string, accent: string | null | undefined): ReactNode {
  if (!accent) return <>{title}</>;
  const idx = title.toLowerCase().indexOf(accent.toLowerCase());
  if (idx < 0) return <>{title}</>;
  const before = title.slice(0, idx);
  const match = title.slice(idx, idx + accent.length);
  const after = title.slice(idx + accent.length);
  return (
    <>
      {before}
      <span className="font-serif italic text-primary">{match}</span>
      {after}
    </>
  );
}

export function getVideoEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-background/15 bg-background/5 backdrop-blur p-4">
      <div className="text-[10px] uppercase tracking-widest text-background/60">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-background/60 mt-0.5">{sub}</div>}
    </div>
  );
}