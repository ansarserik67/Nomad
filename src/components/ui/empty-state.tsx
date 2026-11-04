import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2.5 px-4 py-8" : "gap-3 px-6 py-12",
        className,
      )}
    >
      <span className="grid size-11 place-items-center rounded-2xl border border-line bg-surface-2 text-muted">
        <Icon className="size-5" strokeWidth={1.6} aria-hidden />
      </span>
      <div className="max-w-xs">
        <p className="font-display text-sm font-semibold text-paper">{title}</p>
        {description ? (
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-2">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("glass p-6", className)} aria-hidden>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-7 w-40" />
      <Skeleton className="mt-6 h-2 w-full" />
      <Skeleton className="mt-2 h-2 w-2/3" />
    </div>
  );
}
