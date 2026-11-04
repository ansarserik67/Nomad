import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/empty-state";

export default function AppLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-3 h-8 w-72 max-w-full" />
      <Skeleton className="mt-3 h-3 w-full max-w-lg" />
      <div className="mt-6 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <GlassCard className="min-h-[286px]">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="mt-14 h-9 w-48" />
          <Skeleton className="mt-3 h-3 w-64 max-w-full" />
          <Skeleton className="mt-12 h-2 w-full" />
        </GlassCard>
        <GlassCard className="min-h-[286px]">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-6 w-40" />
          <Skeleton className="mt-6 h-16 w-full" />
          <Skeleton className="mt-3 h-16 w-full" />
        </GlassCard>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <GlassCard className="min-h-[300px]">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-[240px] w-full rounded-2xl" />
        </GlassCard>
        <GlassCard className="min-h-[300px]">
          <Skeleton className="h-4 w-32" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-[105px] rounded-2xl" />
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
