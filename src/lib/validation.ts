import { z } from "zod";

const uuid = z.string().uuid("Invalid identifier");

/**
 * Runtime guard for identifiers that arrive outside a Zod schema (server
 * action arguments). Defence in depth on top of RLS.
 */
export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()), "Use a valid date");
const currency = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use 72 characters or fewer");

export const authSignInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(72),
  next: z.string().optional(),
});

export const authSignUpSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  email: emailSchema,
  password: passwordSchema,
  next: z.string().optional(),
});

export const authEmailSchema = z.object({ email: emailSchema });

export const passwordUpdateSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const tripSchema = z
  .object({
    title: z.string().trim().min(2, "Give your trip a name").max(120),
    destinationCity: z.string().trim().min(2, "Enter a city").max(80),
    destinationCountry: z.string().trim().min(2, "Enter a country").max(80),
    destinationCountryCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, "Use a 2-letter country code")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    destinationLat: z.coerce.number().min(-90).max(90).optional(),
    destinationLng: z.coerce.number().min(-180).max(180).optional(),
    startDate: isoDate.optional().or(z.literal("").transform(() => undefined)),
    endDate: isoDate.optional().or(z.literal("").transform(() => undefined)),
    travelers: z.coerce.number().int().min(1).max(50),
    budgetAmount: z.coerce.number().min(0).max(100_000_000),
    currency,
    notes: optionalText(2000),
  })
  .refine(
    (trip) => !trip.startDate || !trip.endDate || trip.endDate >= trip.startDate,
    { message: "End date must be after the start date", path: ["endDate"] },
  );

export const itinerarySchema = z
  .object({
    tripId: uuid,
    title: z.string().trim().min(1, "Name this activity").max(160),
    description: optionalText(1000),
    category: z.enum(["activity", "food", "transport", "stay", "note"]),
    dayDate: isoDate.optional().or(z.literal("").transform(() => undefined)),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Use HH:MM")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    locationName: optionalText(160),
    costAmount: z.coerce.number().min(0).max(1_000_000),
    currency,
    status: z.enum(["planned", "booked", "done"]).default("planned"),
  })
  .refine(
    (item) => !item.dayDate || !item.startTime || item.startTime <= "23:59",
    { message: "Use a valid time", path: ["startTime"] },
  );

export const expenseSchema = z.object({
  tripId: uuid,
  title: z.string().trim().min(1, "Describe the expense").max(140),
  category: z.enum(["flights", "stay", "food", "transport", "activities", "shopping", "other"]),
  amount: z.coerce.number().positive("Enter an amount above zero").max(1_000_000_000),
  currency,
  exchangeRate: z.coerce.number().positive().max(1_000_000).default(1),
  spentOn: isoDate,
  notes: optionalText(1000),
});

export const inviteSchema = z.object({
  tripId: uuid,
  email: emailSchema,
  role: z.enum(["editor", "viewer"]),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name").max(80),
  homeCity: optionalText(80),
  homeCountry: optionalText(80),
  homeCurrency: currency,
  travelStyle: z.enum(["slow", "balanced", "fast", "luxury", "budget"]),
});

export const destinationSaveSchema = z.object({
  city: z.string().trim().min(1).max(80),
  country: z.string().trim().min(1).max(80),
  countryCode: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const aiChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(12),
  tripId: uuid.optional(),
  mode: z.enum(["assistant", "itinerary", "budget_analysis", "recommendations"]).default("assistant"),
  /**
   * Interface language, once the UI can set it. Omitted means "match the
   * traveller's own language", which is the correct default until the language
   * switcher exists.
   */
  locale: z.enum(["en", "ru", "kk"]).optional(),
});

export type TripInput = z.infer<typeof tripSchema>;
export type ItineraryInput = z.infer<typeof itinerarySchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
