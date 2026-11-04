import { NextResponse } from "next/server";

import { getRates } from "@/lib/fx";
import { getAuthContext } from "@/lib/auth";

export async function GET(request: Request) {
  const { configured, viewer } = await getAuthContext();
  if (configured && !viewer) {
    return NextResponse.json({ error: "Sign in to use exchange rates." }, { status: 401 });
  }

  const base = new URL(request.url).searchParams.get("base") ?? "USD";
  const result = await getRates(base);

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  // The endpoint is auth-gated, so the response must not land in a shared cache.
  // Upstream Frankfurter calls are cached for an hour inside getRates().
  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "private, max-age=0, no-store" },
  });
}
