import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  tone?: "default" | "subtle" | "accent";
  padded?: boolean;
  children?: ReactNode;
};

export function GlassCard({
  className,
  interactive = false,
  tone = "default",
  padded = true,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        tone === "subtle" ? "glass-subtle" : "glass",
        interactive && "glass-hover cursor-pointer",
        padded && "p-5 sm:p-6",
        tone === "accent" &&
          "border-accent/20 bg-[linear-gradient(150deg,rgba(139,157,255,0.16),rgba(101,214,206,0.06)_55%,rgba(255,255,255,0.02))]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  eyebrow,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  eyebrow?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="label-eyebrow mb-2">{eyebrow}</p> : null}
        <h2 className="font-display text-[17px] font-semibold tracking-[-0.01em] text-paper">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
