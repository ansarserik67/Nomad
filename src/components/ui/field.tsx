import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

export function FieldLabel({
  htmlFor,
  children,
  optional,
}: {
  htmlFor?: string;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 flex items-center justify-between text-[12.5px] font-medium text-muted"
    >
      <span>{children}</span>
      {optional ? <span className="text-[11px] text-muted-2">Optional</span> : null}
    </label>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-[12px] leading-snug text-danger">
      {children}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  className,
}: {
  label?: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label ? (
        <FieldLabel htmlFor={htmlFor} optional={optional}>
          {label}
        </FieldLabel>
      ) : null}
      {children}
      {error ? <FieldError>{error}</FieldError> : hint ? (
        <p className="mt-1.5 text-[12px] leading-snug text-muted-2">{hint}</p>
      ) : null}
    </div>
  );
}

const control =
  "glass-field w-full px-3.5 text-sm text-paper placeholder:text-muted-2/80 outline-none disabled:cursor-not-allowed disabled:opacity-50";

export function Input({
  className,
  leadingIcon,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { leadingIcon?: ReactNode }) {
  if (leadingIcon) {
    return (
      <div className="glass-field flex h-11 items-center gap-2.5 px-3.5">
        <span className="text-muted-2">{leadingIcon}</span>
        <input
          className={cn(
            "h-full w-full min-w-0 bg-transparent text-sm text-paper outline-none placeholder:text-muted-2/80 disabled:opacity-50",
            className,
          )}
          {...props}
        />
      </div>
    );
  }
  return <input className={cn(control, "h-11", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-24 resize-y py-3", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        control,
        "h-11 cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 fill=%22none%22><path d=%22M1 1.5L6 6.5L11 1.5%22 stroke=%22%239BA9C1%22 stroke-width=%221.5%22 stroke-linecap=%22round%22/></svg>')] bg-[position:right_14px_center] bg-no-repeat pr-9",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
