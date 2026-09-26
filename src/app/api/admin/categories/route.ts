import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/auth/customers";

/* ============================================================
 * /api/admin/categories
 * GET  — التصنيفات + الفرعية
 * POST — إضافة category أو subcategory (حسب body.type)
 * ============================================================ */

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const admin = supabaseAdmin();
  const [cats, subs] = await Promise.all([
    admin.from("categories").select("*").order("sort_order"),
    admin.from("subcategories").select("*").order("sort_order"),
  ]);

  if (cats.error || subs.error) {
    return Response.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  return Response.json({ ok: true, categories: cats.data ?? [], subcategories: subs.data ?? [] });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: {
    type?: "category" | "subcategory";
    slug?: string;
    parent?: string;
    name?: string;
    name_ar?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const slug = body.slug?.trim().toLowerCase();
  const name = body.name?.trim();
  const nameAr = body.name_ar?.trim();
  if (!slug || !name || !nameAr) return Response.json({ ok: false, error: "missing_fields" }, { status: 400 });

  const admin = supabaseAdmin();

  if (body.type === "subcategory") {
    if (!body.parent?.trim()) return Response.json({ ok: false, error: "missing_parent" }, { status: 400 });
    const { error } = await admin.from("subcategories").insert({
      slug,
      parent: body.parent.trim(),
      name,
      name_ar: nameAr,
    } as never);
    if (error) return Response.json({ ok: false, error: "insert_failed" }, { status: 503 });
    return Response.json({ ok: true });
  }

  const { error } = await admin.from("categories").insert({
    slug,
    name,
    name_ar: nameAr,
  } as never);
  if (error) return Response.json({ ok: false, error: "insert_failed" }, { status: 503 });
  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const sp = new URL(request.url).searchParams;
  const type = sp.get("type");
  const slug = sp.get("slug");
  if (!slug) return Response.json({ ok: false, error: "missing_slug" }, { status: 400 });

  const admin = supabaseAdmin();
  const { error } =
    type === "subcategory"
      ? await admin.from("subcategories").delete().eq("slug", slug)
      : await admin.from("categories").delete().eq("slug", slug);

  if (error) {
    console.error("[admin/categories] delete:", error.message);
    return Response.json({ ok: false, error: "delete_failed" }, { status: 503 });
  }
  return Response.json({ ok: true });
}
