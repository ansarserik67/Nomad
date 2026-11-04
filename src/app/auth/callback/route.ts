import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));
  const authError = url.searchParams.get("error");

  if (authError) {
    return NextResponse.redirect(
      new URL("/login?error=link", url.origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing", url.origin));
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/setup", url.origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=link", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
