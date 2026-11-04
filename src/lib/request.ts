import "server-only";

import { headers } from "next/headers";

import { appUrl } from "@/lib/env";

const LOOPBACK_ORIGIN = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;

function normalize(origin: string): string {
  return origin.trim().replace(/\/+$/, "");
}

/**
 * Origin used to build auth redirect links (email confirmation, password reset).
 *
 * NEXT_PUBLIC_APP_URL is authoritative. A request header such as
 * x-forwarded-host can be supplied by any intermediary and must never decide
 * where a confirmation link points, otherwise an attacker can redirect the
 * token to their own domain.
 *
 * The request host is honoured only for loopback development, so `next dev` on
 * a non-default port keeps working while externally supplied hosts are ignored.
 */
export async function getRequestOrigin(): Promise<string> {
  const configured = normalize(appUrl);
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");

  if (!host) return configured;

  const proto =
    headerList.get("x-forwarded-proto") ??
    (LOOPBACK_ORIGIN.test(`http://${host}`) ? "http" : "https");
  const candidate = normalize(`${proto}://${host}`);

  if (LOOPBACK_ORIGIN.test(candidate) && LOOPBACK_ORIGIN.test(configured)) {
    return candidate;
  }

  return configured;
}
