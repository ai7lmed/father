import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/auth/customers";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const admin = supabaseAdmin();
  const [settings, delivery, payment] = await Promise.all([
    admin.from("settings").select("key, value"),
    admin.from("delivery_methods").select("*").order("fee"),
    admin.from("payment_methods").select("*"),
  ]);

  if (settings.error || delivery.error || payment.error) {
    return Response.json({ ok: false, error: "db_unavailable" }, { status: 503 });
  }

  return Response.json({
    ok: true,
    settings: settings.data ?? [],
    delivery: delivery.data ?? [],
    payment: payment.data ?? [],
  });
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { key?: string; value?: unknown };
  try {
    body = (await request.json()) as { key?: string; value?: unknown };
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  if (!body.key) return Response.json({ ok: false, error: "missing_key" }, { status: 400 });

  const admin = supabaseAdmin();
  const { error } = await admin
    .from("settings")
    .upsert({ key: body.key, value: body.value ?? null } as never, { onConflict: "key" });

  if (error) {
    console.error("[admin/settings] upsert:", error.message);
    return Response.json({ ok: false, error: "update_failed" }, { status: 503 });
  }

  return Response.json({ ok: true });
}
