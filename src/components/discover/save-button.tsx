"use client";

import { Bookmark } from "lucide-react";
import { useState, useTransition } from "react";

import { toggleSavedDestination } from "@/app/(app)/discover/actions";
import { cn } from "@/lib/utils";

export function SaveDestinationButton({
  city,
  country,
  countryCode,
  lat,
  lng,
  initialSaved,
  canSave,
}: {
  city: string;
  country: string;
  countryCode: string;
  lat?: number;
  lng?: number;
  initialSaved: boolean;
  canSave: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canSave) return null;

  function onToggle() {
    setError(null);
    const previous = saved;
    setSaved(!previous);
    startTransition(async () => {
      const result = await toggleSavedDestination({
        city,
        country,
        countryCode,
        lat,
        lng,
      });
      if (result.error) {
        setSaved(previous);
        setError(result.error);
        return;
      }
      setSaved(result.saved);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${city} from saved` : `Save ${city}`}
        className={cn(
          "grid size-8 place-items-center rounded-full border backdrop-blur-md transition-colors",
          saved
            ? "border-accent/35 bg-accent/20 text-accent-soft"
            : "border-line-strong bg-[#080d18]/45 text-white/70 hover:text-white",
          pending && "opacity-60",
        )}
      >
        <Bookmark className={cn("size-3.5", saved && "fill-current")} />
      </button>
      {error ? (
        <span role="alert" className="max-w-[120px] text-right text-[9px] leading-tight text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
