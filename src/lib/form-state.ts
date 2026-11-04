/**
 * Form state for `useActionState` around the server actions.
 *
 * A `"use server"` module may only export async functions, so these types and
 * their initial values live here rather than next to the actions — exporting an
 * object from an actions file fails with:
 *   "A use server file can only export async functions, found object."
 */

export type AuthFormState = {
  status: "idle" | "error" | "notice";
  message?: string;
  fieldErrors?: Record<string, string>;
  resetKey?: number;
};

export const initialAuthState: AuthFormState = { status: "idle" };

export type TripFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const initialTripFormState: TripFormState = { status: "idle" };

export type ProfileFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const initialProfileState: ProfileFormState = { status: "idle" };

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const initialActionState: ActionState = { status: "idle" };
