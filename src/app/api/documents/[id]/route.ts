import { NextResponse } from "next/server";

import { getAuthContext } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, viewer, configured } = await getAuthContext();

  if (!configured) {
    return NextResponse.json(
      { error: "Storage is not configured. Add your Supabase project keys." },
      { status: 503 },
    );
  }
  if (!viewer || !supabase) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid document." }, { status: 400 });
  }

  const { data: document } = await supabase
    .from("documents")
    .select("id, owner_id, file_path, file_name")
    .eq("id", id)
    .maybeSingle();

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }
  if (document.owner_id !== viewer.id) {
    return NextResponse.json(
      { error: "Only the document owner can download this file." },
      { status: 403 },
    );
  }

  const { data, error } = await supabase.storage
    .from("travel-documents")
    .createSignedUrl(document.file_path, 60, { download: document.file_name });

  if (error || !data?.signedUrl) {
    console.error("document download", error);
    return NextResponse.json(
      { error: "The file could not be signed. Check the storage bucket policies." },
      { status: 502 },
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
