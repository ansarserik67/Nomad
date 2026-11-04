import type { Metadata } from "next";
import {
  CalendarClock,
  Download,
  FileText,
  FolderLock,
  ShieldCheck,
  Upload,
} from "lucide-react";
import Link from "next/link";

import { DeleteConfirmButton, UploadDocumentForm } from "@/components/trips/trip-forms";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CardHeader, GlassCard } from "@/components/ui/glass-card";
import { PageHeader } from "@/components/ui/primitives";
import { getServerDictionary } from "@/lib/i18n/server";
import { getAuthContext } from "@/lib/auth";
import { getTripSummaries } from "@/lib/data/trips";
import type { DocumentCategory } from "@/lib/database.types";
import { cn, daysUntil, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Travel Vault" };
export const dynamic = "force-dynamic";

const CATEGORIES: { key: DocumentCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ticket", label: "Tickets" },
  { key: "booking", label: "Bookings" },
  { key: "passport", label: "Passport / ID" },
  { key: "insurance", label: "Insurance" },
  { key: "receipt", label: "Receipts" },
  { key: "other", label: "Other" },
];

function fileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function VaultPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ t }, { supabase, viewer, configured }] = await Promise.all([
    getServerDictionary(),
    getAuthContext(),
  ]);
  const { category = "all" } = await searchParams;

  const [documentsResult, trips] = await Promise.all([
    supabase && viewer
      ? supabase.from("documents").select("*").order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase && viewer ? getTripSummaries(supabase, viewer.id) : Promise.resolve([]),
  ]);

  const documents = documentsResult.data ?? [];
  const tripById = new Map(trips.map((trip) => [trip.id, trip]));
  const filtered =
    category === "all"
      ? documents
      : documents.filter((document) => document.category === category);

  const expiring = documents.filter((document) => {
    const days = daysUntil(document.expires_on);
    return days !== null && days >= 0 && days <= 60;
  }).length;
  const expired = documents.filter((document) => {
    const days = daysUntil(document.expires_on);
    return days !== null && days < 0;
  }).length;

  return (
    <div>
      <PageHeader
        eyebrow={t.pages.vault.eyebrow}
        title={t.pages.vault.title}
        description={t.pages.vault.description}
        actions={
          <a
            href="#upload"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[12.5px] font-medium text-on-accent transition-colors hover:bg-accent-soft"
          >
            <Upload className="size-3.5" /> Upload
          </a>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Documents", value: documents.length, icon: FolderLock, tone: "text-accent" },
          { label: "Expiring in 60 days", value: expiring, icon: CalendarClock, tone: "text-warning" },
          { label: "Expired", value: expired, icon: ShieldCheck, tone: expired > 0 ? "text-danger" : "text-positive" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.label} className="flex items-center justify-between p-4">
              <div>
                <p className="label-eyebrow">{stat.label}</p>
                <p className="mt-2 font-display text-[24px] font-semibold leading-none">
                  {stat.value}
                </p>
              </div>
              <Icon className={cn("size-5", stat.tone)} strokeWidth={1.6} />
            </GlassCard>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {CATEGORIES.map((item) => (
          <Link
            key={item.key}
            href={item.key === "all" ? "/vault" : `/vault?category=${item.key}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
              category === item.key
                ? "border-accent/30 bg-accent/10 text-accent-soft"
                : "border-line bg-surface-1 text-muted hover:border-line-strong hover:text-paper",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <GlassCard>
          <CardHeader
            eyebrow="Library"
            title={filtered.length > 0 ? `${filtered.length} document${filtered.length === 1 ? "" : "s"}` : "Your vault"}
            description="Only you can open these files. Deleting a document removes the stored file too."
          />

          {filtered.length === 0 ? (
            <EmptyState
              icon={FolderLock}
              title={documents.length === 0 ? "The vault is empty" : "No documents in this category"}
              description={
                documents.length === 0
                  ? "Upload a ticket or booking confirmation to keep it out of your inbox."
                  : "Choose another category or upload a new document."
              }
            />
          ) : (
            <ul className="mt-4 space-y-1.5">
              {filtered.map((document) => {
                const trip = document.trip_id ? tripById.get(document.trip_id) : null;
                const days = daysUntil(document.expires_on);
                return (
                  <li
                    key={document.id}
                    className="flex items-center gap-3 rounded-[14px] border border-line bg-surface-1 px-3.5 py-3 transition-colors hover:border-line"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-line bg-surface-1 text-teal">
                      <FileText className="size-4" strokeWidth={1.6} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-[12.5px] font-medium text-paper">
                          {document.title}
                        </p>
                        <Badge>{document.category}</Badge>
                        {document.expires_on ? (
                          <Badge
                            tone={
                              days !== null && days < 0
                                ? "danger"
                                : days !== null && days <= 60
                                  ? "warning"
                                  : "neutral"
                            }
                          >
                            {days !== null && days < 0
                              ? `expired ${formatDate(document.expires_on, { day: "numeric", month: "short" })}`
                              : `expires ${formatDate(document.expires_on, { day: "numeric", month: "short", year: "numeric" })}`}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-muted-2">
                        {trip ? `${trip.destination_city} · ` : "Personal · "}
                        {fileSize(document.file_size)} · added{" "}
                        {formatDate(document.created_at, { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    {configured && viewer ? (
                      <>
                        <a
                          href={`/api/documents/${document.id}`}
                          className="rounded-lg p-1.5 text-muted-2 transition-colors hover:bg-surface-2 hover:text-paper"
                          aria-label={`Download ${document.title}`}
                        >
                          <Download className="size-3.5" />
                        </a>
                        <DeleteConfirmButton
                          kind="document"
                          id={document.id}
                          label={document.title}
                          canDelete
                        />
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>

        <GlassCard id="upload" className="scroll-mt-24">
          <CardHeader
            eyebrow="Add to vault"
            title="Upload a document"
            description="PDF, JPG, PNG, WEBP or TXT · up to 10 MB."
          />
          <div className="mt-4">
            <UploadDocumentForm
              canUpload={Boolean(configured && viewer)}
              tripOptions={trips.map((trip) => ({ id: trip.id, city: trip.destination_city }))}
            />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
