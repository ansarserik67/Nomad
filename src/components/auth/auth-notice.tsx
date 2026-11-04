/** Status banner used by every auth form. Works in both server and client trees. */
export function AuthNotice({
  status,
  message,
}: {
  status: "error" | "notice";
  message: string;
}) {
  const isError = status === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live="polite"
      className={
        isError
          ? "rounded-[14px] border border-danger/25 bg-danger/[0.08] px-3.5 py-3 text-[12.5px] leading-relaxed text-danger"
          : "rounded-[14px] border border-teal/25 bg-teal/[0.08] px-3.5 py-3 text-[12.5px] leading-relaxed text-teal"
      }
    >
      {message}
    </div>
  );
}
