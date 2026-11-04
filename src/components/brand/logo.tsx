import Link from "next/link";

import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid size-9 place-items-center rounded-[12px] border border-line bg-[linear-gradient(145deg,rgba(139,157,255,0.9),rgba(101,214,206,0.55))] shadow-[0_8px_24px_-10px_rgba(139,157,255,0.7)]",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[19px] text-[#08101e]" fill="none">
        <path
          d="M12 3.4 14.6 9.4 20.6 12 14.6 14.6 12 20.6 9.4 14.6 3.4 12 9.4 9.4Z"
          fill="currentColor"
          opacity="0.92"
        />
        <circle cx="12" cy="12" r="2.2" fill="#0b1322" opacity="0.55" />
      </svg>
    </span>
  );
}

export function Logo({
  compact = false,
  href = "/dashboard",
  className,
}: {
  compact?: boolean;
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group flex items-center gap-2.5 rounded-xl", className)}
      aria-label="NOMAD home"
    >
      <LogoMark className="transition-transform duration-300 group-hover:rotate-[8deg]" />
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-bold tracking-[0.24em] text-paper">
            NOMAD
          </span>
          <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.2em] text-muted-2">
            Travel space
          </span>
        </span>
      ) : null}
    </Link>
  );
}
