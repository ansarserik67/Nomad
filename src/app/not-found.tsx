import { Compass } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <div className="w-full max-w-md text-center">
        <Logo href="/dashboard" className="mx-auto justify-center" />
        <p className="mt-10 font-display text-[64px] font-semibold leading-none tracking-[-0.05em] text-white/10">
          404
        </p>
        <h1 className="mt-2 font-display text-[24px] font-semibold tracking-[-0.03em]">
          This route does not exist
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          The page may have moved, or the trip is no longer available to your account.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[12.5px] font-medium text-on-accent"
          >
            <Compass className="size-4" /> Back to overview
          </Link>
          <Link
            href="/trips"
            className="inline-flex h-10 items-center rounded-full border border-line bg-surface-2 px-4 text-[12.5px] font-medium text-paper"
          >
            My trips
          </Link>
        </div>
      </div>
    </div>
  );
}
