import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/auth/supabase-server";
import { supabaseAdmin } from "@/lib/auth/customers";

/* ============================================================
 * /api/addresses — عناوين العميل (قاعدة البيانات الحقيقية)
 * GET    → قائمة عناوين المستخدم الحالي
 * POST   → إضافة/تعديل عنوان
 * DELETE ?id=… → حذف
 * كل العمليات تتحقق من الجلسة — كل عميل يرى عناوينه فقط
 * ============================================================ */

type AddressInput = {
  id?: string;
  label: string;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
  isDefault?: boolean;
};

function normalizeOmaniPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const local = digits.replace(/^(?:968|00968)/, "");
  return /^9\d{7}$/.test(local) ? local : null;
}

async function currentUser() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/* ——— GET: قائمة العناوين ——— */
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("addresses")
    .select("*")
    .eq("customer_id", user.id)
    .order("is_default", { ascending: false });

  if (error) {
    console.error("[addresses] list:", error.message);
    return Response.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }
  return Response.json({ ok: true, addresses: data ?? [] });
}

/* ——— POST: إضافة/تعديل ——— */
export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return Response.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  let body: AddressInput;
  try {
    body = (await request.json()) as AddressInput;
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const phone = normalizeOmaniPhone(body.phone ?? "");
  if (!body.fullName?.trim() || !phone || !body.city?.trim() || !body.address?.trim())
    return Response.json({ ok: false, error: "invalid_address" }, { status: 400 });

  const admin = supabaseAdmin();
  const row = {
    customer_id: user.id,
    label: body.label?.trim() || "المنزل",
    full_name: body.fullName.trim(),
    phone,
    city: body.city.trim(),
    address: body.address.trim(),
    notes: body.notes?.trim() || null,
    is_default: Boolean(body.isDefault),
  };

  /* إذا الافتراضي: أزل الافتراضي عن البقية */
  if (row.is_default) {
    await admin
      .from("addresses")
      .update({ is_default: false } as never)
      .eq("customer_id", user.id)
      .neq("id", body.id ?? "");
  }

  if (body.id) {
    const { data, error } = await admin
      .from("addresses")
      .update(row as never)
      .eq("id", body.id)
      .eq("customer_id", user.id)
      .select()
      .maybeSingle();
    if (error || !data)
      return Response.json({ ok: false, error: "update_failed" }, { status: 400 });
    return Response.json({ ok: true, address: data });
  }

  const { data, error } = await admin
    .from("addresses")
    .insert(row as never)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[addresses] insert:", error.message);
    return Response.json({ ok: false, error: "insert_failed" }, { status: 503 });
  }
  return Response.json({ ok: true, address: data });
}

/* ——— DELETE: حذف ——— */
export async function DELETE(request: NextRequest) {
  const user = await currentUser();
  if (!user) return Response.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ ok: false, error: "missing_id" }, { status: 400 });

  const admin = supabaseAdmin();
  const { error } = await admin
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("customer_id", user.id);

  if (error) return Response.json({ ok: false, error: "delete_failed" }, { status: 400 });
  return Response.json({ ok: true });
}
