import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  Coffee,
  Download,
  FileText,
  Hotel,
  MapPin,
  Plane,
  Receipt,
  Sparkles,
  Ticket,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DestinationArtwork } from "@/components/dashboard/destination-artwork";
import {
  AddExpenseForm,
  AddItineraryForm,
  DeleteConfirmButton,
  InviteMemberForm,
  UploadDocumentForm,
} from "@/components/trips/trip-forms";
import { Badge, TripStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CardHeader, GlassCard } from "@/components/ui/glass-card";
import { Avatar, PageHeader, Progress } from "@/components/ui/primitives";
import { format } from "@/lib/i18n/dictionaries";
import { getServerDictionary } from "@/lib/i18n/server";
import { getAuthContext } from "@/lib/auth";
import { getTripDetail } from "@/lib/data/trips";
import {
  clamp,
  EXPENSE_CATEGORY_LABEL,
  formatDate,
  formatDateRange,
  formatMoney,
  nightsBetween,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

const TABS = [{ key: "plan" }, { key: "budget" }, { key: "group" }, { key: "vault" }] as const;

const CATEGORY_ICON = {
  activity: MapPin,
  food: Coffee,
  transport: Plane,
  stay: Hotel,
  note: FileText,
} as const;

export default async function TripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; created?: string }>;
}) {
  const { id } = await params;
  const { tab = "plan", created } = await searchParams;
  const [{ t, locale }, { supabase, viewer, configured }] = await Promise.all([
    getServerDictionary(),
    getAuthContext(),
  ]);

  if (!configured || !supabase || !viewer) {
    return (
      <div>
        <PageHeader
          eyebrow={t.pages.tripDetail.eyebrow}
          title={t.pages.tripDetail.title}
          description={t.pages.tripDetail.description}
          actions={
            <Link href="/setup" className="text-[12px] font-medium text-accent">
              {t.common.setup} →
            </Link>
          }
        />
      </div>
    );
  }

  const detail = await getTripDetail(supabase, id, viewer.id);
  if (!detail) notFound();

  const { trip, members, itinerary, expenses, documents, role, canEdit } = detail;
  const activeTab = TABS.some((item) => item.key === tab) ? tab : "plan";

  const tabLabel: Record<string, string> = {
    plan: t.tripDetail.tabPlan,
    budget: t.tripDetail.tabBudget,
    group: t.tripDetail.tabGroup,
    vault: t.tripDetail.tabVault,
  };
  const documentLabel: Record<string, string> = {
    ticket: t.tripForms.docTicket,
    booking: t.tripForms.docBooking,
    passport: t.tripForms.docPassport,
    insurance: t.tripForms.docInsurance,
    receipt: t.tripForms.docReceipt,
    other: t.tripForms.docOther,
  };
  const roleLabel: Record<string, string> = {
    owner: t.tripDetail.owner,
    editor: t.tripForms.roleEditor,
    viewer: t.tripForms.roleViewer,
  };
  const statusLabel: Record<string, string> = {
    planned: t.tripDetail.statusPlanned,
    booked: t.tripDetail.statusBooked,
    done: t.tripDetail.statusDone,
    pending: t.tripDetail.statusPending,
  };

  const budget = Number(trip.budget_amount);
  const spent = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount) * Number(expense.exchange_rate),
    0,
  );
  const remaining = budget - spent;
  const used = budget > 0 ? clamp((spent / budget) * 100) : 0;
  const estimatedActivities = itinerary.reduce(
    (sum, item) => sum + Number(item.cost_amount),
    0,
  );
  const nights = nightsBetween(trip.start_date, trip.end_date);

  const grouped = itinerary.reduce<Record<string, typeof itinerary>>((groups, item) => {
    const key = item.day_date ?? "unscheduled";
    groups[key] = [...(groups[key] ?? []), item];
    return groups;
  }, {});
  const dayKeys = Object.keys(grouped).sort((a, b) =>
    a === "unscheduled" ? 1 : b === "unscheduled" ? -1 : a.localeCompare(b),
  );

  return (
    <div>
      <Link
        href="/trips"
        className="inline-flex items-center gap-1.5 text-[11.5px] text-muted transition-colors hover:text-paper"
      >
        <ArrowLeft className="size-3.5" /> {t.tripDetail.allTrips}
      </Link>

      <GlassCard className="relative mt-3 overflow-hidden p-0">
        <DestinationArtwork
          hue={trip.cover_hue}
          countryCode={trip.destination_country_code}
          watermark={false}
          className="pointer-events-none absolute inset-0 opacity-80"
        />
        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <TripStatusBadge status={trip.status} />
                <Badge tone={role === "owner" ? "accent" : "neutral"}>
                  {roleLabel[role] ?? role}
                </Badge>
                <span className="text-[10.5px] text-white/60">
                  {trip.destination_country}
                </span>
              </div>
              <h1 className="mt-3 font-display text-[30px] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-[36px]">
                {trip.title}
              </h1>
              <p className="mt-1.5 text-[12.5px] text-white/70">
                {trip.destination_city}
                {nights > 0
                  ? ` · ${format(
                      nights === 1 ? t.tripDetail.nightsOne : t.tripDetail.nights,
                      { count: nights },
                    )}`
                  : ""}
                {` · ${format(
                  trip.travelers === 1 ? t.tripDetail.travellersOne : t.tripDetail.travellers,
                  { count: trip.travelers },
                )}`}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {formatDateRange(trip.start_date, trip.end_date, locale)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Wallet className="size-3.5" />
                  {format(t.tripDetail.budgetSuffix, {
                    amount: formatMoney(budget, trip.currency, {}, locale),
                  })}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/assistant?trip=${trip.id}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-[#080d18]/40 px-3.5 text-[11.5px] font-medium text-paper backdrop-blur-md transition-colors hover:bg-[#080d18]/65"
              >
                <Sparkles className="size-3.5" /> {t.tripDetail.askNomad}
              </Link>
              <Link
                href={`/wallet?trip=${trip.id}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-[#080d18]/40 px-3.5 text-[11.5px] font-medium text-paper backdrop-blur-md transition-colors hover:bg-[#080d18]/65"
              >
                <Receipt className="size-3.5" /> {t.tripDetail.wallet}
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-1.5 flex items-center justify-between text-[10.5px] text-white/65">
              <span>
                {format(t.tripDetail.spentLeft, {
                  spent: formatMoney(spent, trip.currency, {}, locale),
                  left: formatMoney(Math.max(remaining, 0), trip.currency, {}, locale),
                })}
              </span>
              <span>{Math.round(used)}%</span>
            </div>
            <Progress
              value={used}
              tone={used >= 90 ? "danger" : used >= 70 ? "warning" : "teal"}
              label={t.tripDetail.budgetUsed}
            />
          </div>

          <nav
            className="mt-5 flex gap-1 overflow-x-auto rounded-full border border-line bg-[#080d18]/40 p-1 backdrop-blur-md no-scrollbar"
            aria-label={t.tripDetail.sections}
          >
            {TABS.map((item) => (
              <Link
                key={item.key}
                href={`/trips/${trip.id}?tab=${item.key}`}
                aria-current={activeTab === item.key ? "page" : undefined}
                className={
                  activeTab === item.key
                    ? "rounded-full bg-surface-4 px-4 py-2 text-[11.5px] font-medium text-white"
                    : "rounded-full px-4 py-2 text-[11.5px] font-medium text-white/60 transition-colors hover:text-white"
                }
              >
                {tabLabel[item.key]}
                {item.key === "plan" && itinerary.length > 0 ? ` · ${itinerary.length}` : ""}
                {item.key === "vault" && documents.length > 0 ? ` · ${documents.length}` : ""}
              </Link>
            ))}
          </nav>
        </div>
      </GlassCard>

      {created ? (
        <div className="mt-4 rounded-[14px] border border-positive/25 bg-positive/[0.07] px-4 py-3 text-[12px] text-positive">
          {t.tripDetail.createdNotice}
        </div>
      ) : null}

      {activeTab === "plan" ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <GlassCard>
            <CardHeader
              eyebrow={t.tripDetail.itineraryEyebrow}
              title={
                itinerary.length > 0
                  ? format(t.tripDetail.itineraryTitlePlanned, { count: itinerary.length })
                  : t.tripDetail.itineraryTitleEmpty
              }
              description={t.tripDetail.itineraryBody}
            />
            {itinerary.length === 0 ? (
              <EmptyState
                icon={CalendarPlus}
                title={t.tripDetail.noPlansTitle}
                description={t.tripDetail.noPlansBody}
              />
            ) : (
              <div className="mt-5 space-y-5">
                {dayKeys.map((key) => (
                  <div key={key}>
                    <div className="mb-2.5 flex items-center gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                        {key === "unscheduled"
                          ? t.tripDetail.unscheduled
                          : formatDate(
                              key,
                              { weekday: "short", day: "numeric", month: "short" },
                              locale,
                            )}
                      </p>
                      <span className="h-px flex-1 bg-surface-2" />
                      <span className="text-[10px] text-muted-2">
                        {format(
                          grouped[key].length === 1
                            ? t.tripDetail.itemsCountOne
                            : t.tripDetail.itemsCount,
                          { count: grouped[key].length },
                        )}
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {grouped[key].map((item) => {
                        const Icon = CATEGORY_ICON[item.category] ?? MapPin;
                        return (
                          <li
                            key={item.id}
                            className="group flex items-start gap-3 rounded-[14px] border border-line bg-surface-1 px-3.5 py-3 transition-colors hover:border-line"
                          >
                            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[10px] border border-line bg-surface-1 text-accent">
                              <Icon className="size-3.5" strokeWidth={1.7} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[12.5px] font-medium text-paper">
                                  {item.title}
                                </p>
                                {item.status !== "planned" ? (
                                  <Badge tone={item.status === "booked" ? "teal" : "positive"}>
                                    {statusLabel[item.status] ?? item.status}
                                  </Badge>
                                ) : null}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-muted-2">
                                {item.start_time ? (
                                  <span className="font-mono text-accent-soft/80">
                                    {item.start_time.slice(0, 5)}
                                  </span>
                                ) : null}
                                {item.location_name ? (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="size-2.5" /> {item.location_name}
                                  </span>
                                ) : null}
                                {Number(item.cost_amount) > 0 ? (
                                  <span>{formatMoney(Number(item.cost_amount), item.currency)}</span>
                                ) : null}
                              </div>
                              {item.description ? (
                                <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted">
                                  {item.description}
                                </p>
                              ) : null}
                            </div>
                            <DeleteConfirmButton
                              kind="itinerary"
                              id={item.id}
                              tripId={trip.id}
                              label={item.title}
                              canDelete={canEdit}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <div className="space-y-4">
            <GlassCard>
              <CardHeader
                eyebrow={t.tripDetail.addPlanEyebrow}
                title={t.tripDetail.addPlanTitle}
              />
              <div className="mt-4">
                <AddItineraryForm
                  tripId={trip.id}
                  currency={trip.currency}
                  suggestedDate={trip.start_date}
                  canEdit={canEdit}
                />
              </div>
            </GlassCard>

            {trip.notes ? (
              <GlassCard tone="subtle">
                <p className="label-eyebrow mb-2">{t.tripDetail.tripNotes}</p>
                <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-muted">
                  {trip.notes}
                </p>
              </GlassCard>
            ) : null}

            <GlassCard tone="subtle">
              <p className="label-eyebrow mb-2">{t.tripDetail.planningEstimate}</p>
              <p className="text-[12px] leading-relaxed text-muted">
                {format(t.tripDetail.planningEstimateBody, {
                  amount: formatMoney(estimatedActivities, trip.currency, {}, locale),
                })}
              </p>
            </GlassCard>
          </div>
        </div>
      ) : null}

      {activeTab === "budget" ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <GlassCard className="p-4">
                <p className="label-eyebrow">{t.tripDetail.budget}</p>
                <p className="mt-2 font-display text-[22px] font-semibold">
                  {formatMoney(budget, trip.currency)}
                </p>
              </GlassCard>
              <GlassCard className="p-4">
                <p className="label-eyebrow">{t.tripDetail.spent}</p>
                <p className="mt-2 font-display text-[22px] font-semibold">
                  {formatMoney(spent, trip.currency)}
                </p>
              </GlassCard>
              <GlassCard className="p-4">
                <p className="label-eyebrow">{t.tripDetail.remaining}</p>
                <p
                  className={`mt-2 font-display text-[22px] font-semibold ${
                    remaining < 0 ? "text-danger" : "text-teal"
                  }`}
                >
                  {formatMoney(remaining, trip.currency)}
                </p>
              </GlassCard>
            </div>

            <GlassCard>
              <CardHeader
                eyebrow={t.tripDetail.expensesEyebrow}
                title={
                  expenses.length > 0
                    ? format(t.tripDetail.expensesTitleRecorded, { count: expenses.length })
                    : t.tripDetail.expensesTitleEmpty
                }
                description={t.tripDetail.expensesBody}
              />
              {expenses.length === 0 ? (
                <EmptyState
                  compact
                  icon={Receipt}
                  title={t.tripDetail.nothingSpentTitle}
                  description={t.tripDetail.nothingSpentBody}
                />
              ) : (
                <ul className="mt-4 divide-y divide-white/[0.05]">
                  {expenses.map((expense) => (
                    <li key={expense.id} className="flex items-center gap-3 py-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-[10px] border border-line bg-surface-1 text-[9px] font-semibold uppercase text-muted">
                        {expense.category.slice(0, 2)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-medium text-paper">
                          {expense.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-2">
                          {EXPENSE_CATEGORY_LABEL[expense.category]} ·{" "}
                          {formatDate(expense.spent_on, undefined, locale)}
                          {Number(expense.exchange_rate) !== 1
                            ? ` · ${expense.currency} → ${trip.currency} @ ${expense.exchange_rate}`
                            : ""}
                        </p>
                      </div>
                      <p className="shrink-0 text-[12.5px] font-medium text-paper">
                        {formatMoney(
                          Number(expense.amount) * Number(expense.exchange_rate),
                          trip.currency,
                        )}
                      </p>
                      <DeleteConfirmButton
                        kind="expense"
                        id={expense.id}
                        tripId={trip.id}
                        label={expense.title}
                        canDelete={
                          role === "owner" || expense.created_by === viewer.id
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </div>

          <GlassCard>
            <CardHeader eyebrow={t.tripDetail.recordEyebrow} title={t.tripDetail.addExpenseTitle} />
            <div className="mt-4">
              <AddExpenseForm tripId={trip.id} currency={trip.currency} canEdit={canEdit} />
            </div>
          </GlassCard>
        </div>
      ) : null}

      {activeTab === "group" ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <GlassCard>
            <CardHeader
              eyebrow={t.tripDetail.travellersEyebrow}
              title={format(
                members.length === 0
                  ? t.tripDetail.peopleOnTripOne
                  : t.tripDetail.peopleOnTrip,
                { count: members.length + 1 },
              )}
              description={t.tripDetail.groupBody}
            />
            <ul className="mt-4 space-y-1.5">
              <li className="flex items-center gap-3 rounded-[14px] border border-accent/15 bg-accent/[0.05] px-3.5 py-3">
                <Avatar name={role === "owner" ? "Trip owner" : null} email={viewer.email} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium text-paper">
                    {trip.owner_id === viewer.id ? t.tripDetail.you : t.tripDetail.tripOwner}
                  </p>
                  <p className="truncate text-[10.5px] text-muted-2">
                    {trip.owner_id === viewer.id ? viewer.email : t.tripDetail.ownerAccount}
                  </p>
                </div>
                <Badge tone="accent">{t.tripDetail.owner}</Badge>
              </li>
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 rounded-[14px] border border-line bg-surface-1 px-3.5 py-3"
                >
                  <Avatar name={null} email={member.email} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-paper">
                      {member.email}
                    </p>
                    <p className="text-[10.5px] text-muted-2">
                      {member.status === "pending"
                        ? t.tripDetail.invitationPending
                        : t.tripDetail.active}{" "}
                      · {roleLabel[member.role] ?? member.role}
                    </p>
                  </div>
                  <Badge tone={member.status === "pending" ? "warning" : "teal"}>
                    {statusLabel[member.status] ?? member.status}
                  </Badge>
                  <DeleteConfirmButton
                    kind="member"
                    id={member.id}
                    tripId={trip.id}
                    label={member.email}
                    canDelete={role === "owner"}
                  />
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl border border-line bg-surface-1 px-3.5 py-3 text-[11px] leading-relaxed text-muted-2">
              {t.tripDetail.splittingNote}
            </p>
          </GlassCard>

          <GlassCard>
            <CardHeader
              eyebrow={t.tripDetail.inviteEyebrow}
              title={t.tripDetail.inviteTitle}
              description={t.tripDetail.inviteBody}
            />
            <div className="mt-4">
              <InviteMemberForm tripId={trip.id} canInvite={role === "owner"} />
            </div>
          </GlassCard>
        </div>
      ) : null}

      {activeTab === "vault" ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <GlassCard>
            <CardHeader
              eyebrow={t.tripDetail.vaultEyebrow}
              title={
                documents.length > 0
                  ? format(t.tripDetail.vaultTitleCount, { count: documents.length })
                  : t.tripDetail.vaultTitleEmpty
              }
              description={t.tripDetail.vaultBody}
            />
            {documents.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title={t.tripDetail.vaultEmptyTitle}
                description={t.tripDetail.vaultEmptyBody}
              />
            ) : (
              <ul className="mt-4 space-y-1.5">
                {documents.map((document) => (
                  <li
                    key={document.id}
                    className="flex items-center gap-3 rounded-[14px] border border-line bg-surface-1 px-3.5 py-3"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-line bg-surface-1 text-teal">
                      <FileText className="size-4" strokeWidth={1.6} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-paper">
                        {document.title}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-2">
                        {documentLabel[document.category] ?? document.category}
                        {document.file_size
                          ? ` · ${(document.file_size / 1024 / 1024).toFixed(1)} MB`
                          : ""}
                        {document.expires_on
                          ? ` · ${format(t.tripDetail.expires, {
                              date: formatDate(document.expires_on, undefined, locale),
                            })}`
                          : ""}
                      </p>
                    </div>
                    <a
                      href={`/api/documents/${document.id}`}
                      className="rounded-lg p-1.5 text-muted-2 transition-colors hover:bg-surface-2 hover:text-paper"
                      aria-label={format(t.tripDetail.download, { title: document.title })}
                    >
                      <Download className="size-3.5" />
                    </a>
                    <DeleteConfirmButton
                      kind="document"
                      id={document.id}
                      label={document.title}
                      canDelete={trip.owner_id === viewer.id}
                    />
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          <GlassCard>
            <CardHeader eyebrow={t.tripDetail.fileItEyebrow} title={t.tripDetail.uploadTitle} />
            <div className="mt-4">
              <UploadDocumentForm tripId={trip.id} canUpload={trip.owner_id === viewer.id} />
            </div>
          </GlassCard>
        </div>
      ) : null}
    </div>
  );
}
