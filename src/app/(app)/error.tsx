"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <GlassCard className="w-full max-w-md text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-2xl border border-warning/20 bg-warning/10 text-warning">
          <TriangleAlert className="size-5" />
        </span>
        <h1 className="mt-4 font-display text-lg font-semibold">We could not load this view</h1>
        <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
          The data request failed. This usually means the Supabase migration has not been
          applied yet, or the connection lapsed. Nothing was saved or lost.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-[10px] text-muted-2">ref {error.digest}</p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={reset} size="sm">
            <RefreshCw className="size-3.5" /> Try again
          </Button>
          <Link
            href="/setup"
            className="inline-flex h-9 items-center rounded-full border border-line bg-surface-2 px-3.5 text-[12px] text-paper transition-colors hover:bg-surface-3"
          >
            Check setup
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
