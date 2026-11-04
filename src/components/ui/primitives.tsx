import type { ReactNode } from "react";

import { cn, clamp, initials } from "@/lib/utils";

export function Avatar({
  name,
  email,
  src,
  size = "md",
  className,
}: {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "size-8 text-[11px]", md: "size-10 text-xs", lg: "size-14 text-base" };
  const label = initials(name, email);
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-[linear-gradient(150deg,rgba(139,157,255,0.35),rgba(101,214,206,0.2))] font-display font-semibold text-paper",
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        label || "N"
      )}
    </span>
  );
}

export function Progress({
  value,
  tone = "accent",
  className,
  label,
}: {
  value: number;
  tone?: "accent" | "teal" | "warning" | "danger";
  className?: string;
  label?: string;
}) {
  const tones = {
    accent: "bg-[linear-gradient(90deg,#8b9dff,#b3bfff)]",
    teal: "bg-[linear-gradient(90deg,#65d6ce,#9ef0e9)]",
    warning: "bg-[linear-gradient(90deg,#f3c987,#ffe4b5)]",
    danger: "bg-[linear-gradient(90deg,#ff9b9b,#ffc4c4)]",
  };
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)}
      role="progressbar"
      aria-valuenow={clamp(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", tones[tone])}
        style={{ width: `${clamp(value)}%` }}
      />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? <p className="label-eyebrow mb-2.5">{eyebrow}</p> : null}
        <h1 className="font-display text-[26px] font-semibold leading-tight tracking-[-0.03em] text-paper sm:text-[32px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function KeyValue({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-2">{label}</dt>
      <dd className="mt-1.5 text-sm font-medium text-paper">{value}</dd>
    </div>
  );
}

export function SectionDivider() {
  return <div className="hairline my-5" />;
}
