import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getAiQuota } from "@/lib/ai/quota";
import { getAuthContext } from "@/lib/auth";
import { getNotifications, type AppNotification } from "@/lib/data/notifications";
import { getTravelStatus, type TravelStatus } from "@/lib/data/trips";
import type { AiQuota } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, viewer, configured } = await getAuthContext();
  if (configured && !viewer) redirect("/login");

  let quota: AiQuota | null = null;
  let travelStatus: TravelStatus | null = null;
  let notifications: AppNotification[] = [];

  if (supabase && viewer) {
    const [quotaResult, statusResult, notificationResult] = await Promise.all([
      getAiQuota(supabase).catch(() => null),
      getTravelStatus(supabase),
      getNotifications(supabase),
    ]);
    quota = quotaResult;
    travelStatus = statusResult;
    notifications = notificationResult;
  }

  return (
    <AppShell
      configured={configured}
      quota={quota}
      travelStatus={
        travelStatus && configured
          ? {
              state: travelStatus.state,
              label: travelStatus.label,
              city: travelStatus.city,
              country: travelStatus.country,
              days: travelStatus.days,
            }
          : null
      }
      notifications={notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        detail: notification.detail,
        href: notification.href,
        tone: notification.tone,
      }))}
      viewer={
        viewer
          ? {
              displayName: viewer.displayName,
              email: viewer.email,
              avatarUrl: viewer.profile?.avatar_url ?? null,
              homeCity: viewer.profile?.home_city ?? null,
            }
          : null
      }
    >
      {children}
    </AppShell>
  );
}
