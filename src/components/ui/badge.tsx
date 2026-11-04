import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "teal" | "positive" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-line bg-surface-2 text-muted",
  accent: "border-accent/25 bg-accent/10 text-accent-soft",
  teal: "border-teal/25 bg-teal/10 text-teal",
  positive: "border-positive/25 bg-positive/10 text-positive",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/25 bg-danger/10 text-danger",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none tracking-wide",
        tones[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

export function TripStatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    planning: { tone: "neutral", label: "Planning" },
    upcoming: { tone: "accent", label: "Upcoming" },
    active: { tone: "teal", label: "In progress" },
    completed: { tone: "positive", label: "Completed" },
    archived: { tone: "neutral", label: "Archived" },
  };
  const entry = map[status] ?? { tone: "neutral" as Tone, label: status };
  return (
    <Badge tone={entry.tone} dot>
      {entry.label}
    </Badge>
  );
}
