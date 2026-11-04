import type { Metadata } from "next";
import { ArrowUpRight, Mail, Split, UserPlus, Users } from "lucide-react";
import Link from "next/link";

import { TripStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CardHeader, GlassCard } from "@/components/ui/glass-card";
import { Avatar, PageHeader } from "@/components/ui/primitives";
import { getAuthContext } from "@/lib/auth";
import { getTripSummaries } from "@/lib/data/trips";
import type { TripMember } from "@/lib/database.types";
import { getServerDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Group Travel" };
export const dynamic = "force-dynamic";

export default async function GroupPage() {
  const [{ t }, { supabase, viewer, configured }] = await Promise.all([
    getServerDictionary(),
    getAuthContext(),
  ]);
  const trips = supabase && viewer ? await getTripSummaries(supabase, viewer.id) : [];

  let members: Pick<
    TripMember,
    "id" | "trip_id" | "email" | "role" | "status" | "user_id"
  >[] = [];

  if (supabase && viewer && trips.length > 0) {
    const { data } = await supabase
      .from("trip_members")
      .select("id, trip_id, email, role, status, user_id")
      .in(
        "trip_id",
        trips.map((trip) => trip.id),
      )
      .order("created_at", { ascending: true });
    members = data ?? [];
  }

  const groupTrips = trips
    .map((trip) => ({
      trip,
      members: members.filter((member) => member.trip_id === trip.id),
    }))
    .filter((entry) => entry.members.length > 0);
  const pending = members.filter((member) => member.status === "pending");

  return (
    <div>
      <PageHeader
        eyebrow={t.pages.group.eyebrow}
        title={t.pages.group.title}
        description={t.pages.group.description}
      />

      <div className="mt-6 grid gap-4">
        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <GlassCard>
            <CardHeader
              eyebrow="Shared trips"
              title={
                groupTrips.length > 0
                  ? `${groupTrips.length} trip${groupTrips.length === 1 ? "" : "s"} with travellers`
                  : "No shared trips yet"
              }
              description="Owners can invite editors and viewers from each trip's Group tab."
            />

            {groupTrips.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Travelling solo for now"
                description={
                  configured
                    ? "Open any trip, choose Group, and invite someone by email. They see the same live trip."
                    : "Connect Supabase to invite travellers and share trips."
                }
                action={
                  <Link
                    href="/trips"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-accent transition-colors hover:text-accent-soft"
                  >
                    Open my trips <ArrowUpRight className="size-3" />
                  </Link>
                }
              />
            ) : (
              <ul className="mt-4 space-y-2">
                {groupTrips.map(({ trip, members: tripMembers }) => {
                  const active = tripMembers.filter((member) => member.status === "active");
                  return (
                    <li
                      key={trip.id}
                      className="rounded-[16px] border border-line bg-surface-1 p-3.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-medium text-paper">
                              {trip.destination_city}
                            </p>
                            <TripStatusBadge status={trip.phase} />
                          </div>
                          <p className="mt-0.5 text-[10.5px] text-muted-2">
                            {trip.title} · {active.length} active ·{" "}
                            {tripMembers.length - active.length} pending
                          </p>
                        </div>
                        <Link
                          href={`/trips/${trip.id}?tab=group`}
                          className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[10px] text-muted transition-colors hover:text-paper"
                        >
                          Manage <ArrowUpRight className="size-2.5" />
                        </Link>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div className="flex -space-x-2">
                          {tripMembers.slice(0, 5).map((member) => (
                            <Avatar
                              key={member.id}
                              email={member.email}
                              size="sm"
                              className="ring-2 ring-[#0d1626]"
                            />
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {tripMembers.slice(0, 3).map((member) => (
                            <span
                              key={`role-${member.id}`}
                              className="rounded-full border border-line bg-surface-1 px-2 py-0.5 text-[9px] text-muted-2"
                            >
                              {member.email.split("@")[0]} · {member.role}
                            </span>
                          ))}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </GlassCard>

          <div className="space-y-4">
            <GlassCard tone="accent">
              <p className="inline-flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.16em] text-accent-soft">
                <UserPlus className="size-3.5" /> Roles
              </p>
              <ul className="mt-3 space-y-2.5 text-[11.5px] leading-relaxed text-muted">
                <li>
                  <span className="font-medium text-paper">Owner</span> — full control,
                  invitations, and deleting the trip.
                </li>
                <li>
                  <span className="font-medium text-paper">Editor</span> — plans the
                  itinerary and records expenses.
                </li>
                <li>
                  <span className="font-medium text-paper">Viewer</span> — reads the plan and
                  budget without changing it.
                </li>
              </ul>
            </GlassCard>

            <GlassCard>
              <CardHeader
                eyebrow="Pending"
                title={
                  pending.length > 0
                    ? `${pending.length} invitation${pending.length === 1 ? "" : "s"} waiting`
                    : "No pending invitations"
                }
                description="Invited addresses activate automatically when they create a NOMAD account."
              />
              {pending.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {pending.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center gap-2 rounded-xl border border-line bg-surface-1 px-2.5 py-2"
                    >
                      <Mail className="size-3.5 shrink-0 text-warning" />
                      <span className="min-w-0 flex-1 truncate text-[11px] text-muted">
                        {member.email}
                      </span>
                      <span className="text-[9.5px] uppercase tracking-[0.1em] text-muted-2">
                        {member.role}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </GlassCard>

            <GlassCard tone="subtle">
              <p className="inline-flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-2">
                <Split className="size-3.5" /> Next for groups
              </p>
              <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
                The database already stores split expenses and contributions. The splitting
                interface is the next module update — it will use this same member list
                rather than a separate ledger.
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
