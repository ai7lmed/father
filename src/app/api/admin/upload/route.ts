import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/auth/customers";

/* ============================================================
 * POST /api/admin/upload — رفع صورة إلى Supabase Storage
 * • bucket: product-media (عام للقراءة، الكتابة من الخادم فقط)
 * • المسار: products/<productId>/<random>.<ext>
 * • قبول: image/jpeg, png, webp, avif, gif — حتى 8MB للصورة
 * ============================================================ */

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, error: "invalid_form" }, { status: 400 });
  }

  const file = form.get("file");
  const productId = String(form.get("productId") ?? "").trim();
  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: "missing_file" }, { status: 400 });
  }
  if (!productId) {
    return Response.json({ ok: false, error: "missing_product" }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return Response.json({ ok: false, error: "unsupported_type" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ ok: false, error: "file_too_large" }, { status: 413 });
  }

  const safeId = productId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const path = `products/${safeId}/${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const admin = supabaseAdmin();
  const { error } = await admin.storage
    .from("product-media")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[admin/upload] storage:", error.message);
    return Response.json({ ok: false, error: "upload_failed" }, { status: 503 });
  }

  const { data } = admin.storage.from("product-media").getPublicUrl(path);
  return Response.json({ ok: true, url: data.publicUrl, path });
}
