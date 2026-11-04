"use client";

import { FileUp, Plus, Trash2, UserPlus, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import {
  addExpenseAction,
  addItineraryAction,
  deleteDocumentAction,
  deleteExpenseAction,
  deleteItineraryAction,
  inviteMemberAction,
  removeMemberAction,
  uploadDocumentAction,
} from "@/app/(app)/trips/[id]/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { initialActionState } from "@/lib/form-state";
import { format } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/provider";
import { cn, todayIso } from "@/lib/utils";

function Feedback({ status, message }: { status: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      role={status === "error" ? "alert" : "status"}
      className={cn(
        "rounded-[12px] px-3 py-2 text-[11.5px] leading-relaxed",
        status === "error"
          ? "border border-danger/25 bg-danger/[0.07] text-danger"
          : "border border-positive/25 bg-positive/[0.07] text-positive",
      )}
    >
      {message}
    </p>
  );
}

export function AddItineraryForm({
  tripId,
  currency,
  suggestedDate,
  canEdit,
}: {
  tripId: string;
  currency: string;
  suggestedDate?: string | null;
  canEdit: boolean;
}) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(addItineraryAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  if (!canEdit) {
    return (
      <p className="rounded-xl border border-line bg-surface-1 px-3.5 py-3 text-[11.5px] text-muted-2">
        {t.tripForms.viewerItinerary}
      </p>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="tripId" value={tripId} />
      <Feedback status={state.status} message={state.message} />

      <div className="grid gap-3 sm:grid-cols-[1.4fr_0.8fr]">
        <Field label={t.tripForms.labelActivity} htmlFor="itinerary-title" error={state.fieldErrors?.title}>
          <Input
            id="itinerary-title"
            name="title"
            placeholder={t.tripForms.placeholderActivity}
            required
          />
        </Field>
        <Field label={t.tripForms.labelType} htmlFor="itinerary-category">
          <Select id="itinerary-category" name="category" defaultValue="activity">
            <option value="activity">{t.tripForms.typeActivity}</option>
            <option value="food">{t.tripForms.typeFood}</option>
            <option value="transport">{t.tripForms.typeTransport}</option>
            <option value="stay">{t.tripForms.typeStay}</option>
            <option value="note">{t.tripForms.typeNote}</option>
          </Select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          label={t.tripForms.labelDay}
          htmlFor="itinerary-date"
          error={state.fieldErrors?.dayDate}
          optional
        >
          <Input
            id="itinerary-date"
            name="dayDate"
            type="date"
            defaultValue={suggestedDate ?? ""}
          />
        </Field>
        <Field
          label={t.tripForms.labelStartTime}
          htmlFor="itinerary-time"
          error={state.fieldErrors?.startTime}
          optional
        >
          <Input id="itinerary-time" name="startTime" type="time" />
        </Field>
        <Field
          label={t.tripForms.labelCost}
          htmlFor="itinerary-cost"
          error={state.fieldErrors?.costAmount}
          optional
        >
          <Input
            id="itinerary-cost"
            name="costAmount"
            type="number"
            min={0}
            step="0.01"
            placeholder="0"
          />
        </Field>
      </div>

      <input type="hidden" name="currency" value={currency} />
      <input type="hidden" name="status" value="planned" />

      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] text-muted-2">{t.tripForms.costHint}</p>
        <Button type="submit" size="sm" loading={pending}>
          <Plus className="size-3.5" /> {t.tripForms.add}
        </Button>
      </div>
    </form>
  );
}

const EXPENSE_CATEGORIES = [
  { value: "flights", key: "catFlights" },
  { value: "stay", key: "catStay" },
  { value: "food", key: "catFood" },
  { value: "transport", key: "catTransport" },
  { value: "activities", key: "catActivities" },
  { value: "shopping", key: "catShopping" },
  { value: "other", key: "catOther" },
] as const;

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR", "KRW", "MXN", "NZD", "SGD", "ZAR", "AED", "THB", "TRY", "BRL"];

export function AddExpenseForm({
  tripId,
  currency,
  canEdit,
}: {
  tripId: string;
  currency: string;
  canEdit: boolean;
}) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(addExpenseAction, initialActionState);
  const [expenseCurrency, setExpenseCurrency] = useState(currency);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  if (!canEdit) {
    return (
      <p className="rounded-xl border border-line bg-surface-1 px-3.5 py-3 text-[11.5px] text-muted-2">
        {t.tripForms.viewerExpenses}
      </p>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="tripId" value={tripId} />
      <Feedback status={state.status} message={state.message} />

      <div className="grid gap-3 sm:grid-cols-[1.5fr_0.9fr]">
        <Field label={t.tripForms.labelExpense} htmlFor="expense-title" error={state.fieldErrors?.title}>
          <Input
            id="expense-title"
            name="title"
            placeholder={t.tripForms.placeholderExpense}
            required
          />
        </Field>
        <Field label={t.tripForms.labelAmount} htmlFor="expense-amount" error={state.fieldErrors?.amount}>
          <Input
            id="expense-amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            required
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t.tripForms.labelCategory} htmlFor="expense-category">
          <Select id="expense-category" name="category" defaultValue="other">
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {t.tripForms[category.key]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.tripForms.labelDate} htmlFor="expense-date" error={state.fieldErrors?.spentOn}>
          <Input id="expense-date" name="spentOn" type="date" defaultValue={todayIso()} required />
        </Field>
        <Field label={t.tripForms.labelCurrency} htmlFor="expense-currency">
          <Select
            id="expense-currency"
            name="currency"
            value={expenseCurrency}
            onChange={(event) => setExpenseCurrency(event.target.value)}
          >
            {[...new Set([currency, ...CURRENCIES])].map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {expenseCurrency !== currency ? (
        <Field
          label={format(t.tripForms.rateLabel, { currency })}
          htmlFor="expense-rate"
          hint={format(t.tripForms.rateHint, { from: expenseCurrency, to: currency })}
          error={state.fieldErrors?.exchangeRate}
        >
          <Input
            id="expense-rate"
            name="exchangeRate"
            type="number"
            min="0.000001"
            step="any"
            defaultValue={1}
            required
          />
        </Field>
      ) : (
        <input type="hidden" name="exchangeRate" value={1} />
      )}

      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={pending}>
          <Plus className="size-3.5" /> {t.tripForms.recordExpense}
        </Button>
      </div>
    </form>
  );
}

export function InviteMemberForm({ tripId, canInvite }: { tripId: string; canInvite: boolean }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(inviteMemberAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  if (!canInvite) {
    return (
      <p className="rounded-xl border border-line bg-surface-1 px-3.5 py-3 text-[11.5px] text-muted-2">
        {t.tripForms.ownerInvite}
      </p>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="tripId" value={tripId} />
      <Feedback status={state.status} message={state.message} />

      <div className="grid gap-3 sm:grid-cols-[1.5fr_0.8fr_auto] sm:items-end">
        <Field label={t.tripForms.labelEmail} htmlFor="invite-email" error={state.fieldErrors?.email}>
          <Input
            id="invite-email"
            name="email"
            type="email"
            placeholder={t.tripForms.placeholderEmail}
            required
          />
        </Field>
        <Field label={t.tripForms.labelRole} htmlFor="invite-role">
          <Select id="invite-role" name="role" defaultValue="viewer">
            <option value="viewer">{t.tripForms.roleViewer}</option>
            <option value="editor">{t.tripForms.roleEditor}</option>
          </Select>
        </Field>
        <Button type="submit" size="md" loading={pending} className="mb-0">
          <UserPlus className="size-3.5" /> {t.tripForms.invite}
        </Button>
      </div>
    </form>
  );
}

export function UploadDocumentForm({
  tripId,
  canUpload,
  tripOptions,
}: {
  tripId?: string;
  canUpload: boolean;
  tripOptions?: { id: string; city: string }[];
}) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(uploadDocumentAction, initialActionState);
  const [fileName, setFileName] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setFileName(null);
    }
  }, [state]);

  if (!canUpload) {
    return (
      <p className="rounded-xl border border-line bg-surface-1 px-3.5 py-3 text-[11.5px] text-muted-2">
        {t.tripForms.ownerDocuments}
      </p>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-3">
      {tripId ? <input type="hidden" name="tripId" value={tripId} /> : null}
      <Feedback status={state.status} message={state.message} />

      {!tripId && tripOptions ? (
        <Field label={t.tripForms.labelAttachTrip} htmlFor="document-trip" optional>
          <Select id="document-trip" name="tripId" defaultValue="">
            <option value="">{t.tripForms.personalDocument}</option>
            {tripOptions.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.city}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.tripForms.labelTitle} htmlFor="document-title">
          <Input
            id="document-title"
            name="title"
            placeholder={t.tripForms.placeholderDocument}
            required
          />
        </Field>
        <Field label={t.tripForms.labelCategory} htmlFor="document-category">
          <Select id="document-category" name="category" defaultValue="booking">
            <option value="ticket">{t.tripForms.docTicket}</option>
            <option value="booking">{t.tripForms.docBooking}</option>
            <option value="passport">{t.tripForms.docPassport}</option>
            <option value="insurance">{t.tripForms.docInsurance}</option>
            <option value="receipt">{t.tripForms.docReceipt}</option>
            <option value="other">{t.tripForms.docOther}</option>
          </Select>
        </Field>
        <Field label={t.tripForms.labelExpiry} htmlFor="document-expiry" optional>
          <Input id="document-expiry" name="expiresOn" type="date" />
        </Field>
        <Field label={t.tripForms.labelNotes} htmlFor="document-notes" optional>
          <Input id="document-notes" name="notes" placeholder={t.tripForms.placeholderNotes} />
        </Field>
      </div>

      <label
        htmlFor="document-file"
        className="flex cursor-pointer items-center gap-3 rounded-[14px] border border-dashed border-line bg-surface-1 px-3.5 py-3 transition-colors hover:border-accent/35 hover:bg-accent/[0.04]"
      >
        <FileUp className="size-4 shrink-0 text-muted-2" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-medium text-paper">
            {fileName ?? t.tripForms.chooseFile}
          </span>
          <span className="block text-[10px] text-muted-2">{t.tripForms.fileHint}</span>
        </span>
        <input
          id="document-file"
          name="file"
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp,text/plain"
          className="sr-only"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
          required
        />
      </label>

      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={pending}>
          <FileUp className="size-3.5" /> {t.tripForms.uploadToVault}
        </Button>
      </div>
    </form>
  );
}

type DeleteKind = "itinerary" | "expense" | "member" | "document";

export function DeleteConfirmButton({
  kind,
  id,
  tripId,
  label,
  canDelete = true,
}: {
  kind: DeleteKind;
  id: string;
  tripId?: string;
  label: string;
  canDelete?: boolean;
}) {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canDelete) return null;

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const result =
        kind === "itinerary" && tripId
          ? await deleteItineraryAction(id, tripId)
          : kind === "expense" && tripId
            ? await deleteExpenseAction(id, tripId)
            : kind === "member" && tripId
              ? await removeMemberAction(id, tripId)
              : kind === "document"
                ? await deleteDocumentAction(id)
                : { ok: false, error: t.tripForms.deleteError };

      if (!result.ok) {
        setError(result.error ?? t.tripForms.deleteError);
        setConfirming(false);
        return;
      }
      setConfirming(false);
    });
  }

  if (!confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={format(t.tripForms.deleteItem, { label })}
          className="rounded-lg p-1.5 text-muted-2 transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="size-3.5" />
        </button>
        {error ? <span className="text-[9px] text-danger">{error}</span> : null}
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="rounded-md border border-danger/30 bg-danger/10 px-1.5 py-1 text-[9px] font-medium text-danger transition-colors hover:bg-danger/15"
      >
        {pending ? "…" : t.tripForms.delete}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        aria-label={t.tripForms.cancelDelete}
        className="rounded-md p-1 text-muted-2 transition-colors hover:text-paper"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}
