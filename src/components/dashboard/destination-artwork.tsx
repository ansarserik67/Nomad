import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DestinationArtwork({
  hue,
  countryCode,
  className,
  children,
  watermark = true,
}: {
  hue: number;
  countryCode?: string | null;
  className?: string;
  children?: ReactNode;
  watermark?: boolean;
}) {
  return (
    <div
      className={cn("mesh-art", className)}
      style={{ "--art-hue": hue } as CSSProperties}
      aria-hidden={children ? undefined : true}
    >
      {watermark && countryCode ? (
        <span className="pointer-events-none absolute right-4 top-3 font-display text-[42px] font-bold leading-none text-white/[0.09]">
          {countryCode}
        </span>
      ) : null}
      {children}
    </div>
  );
}
