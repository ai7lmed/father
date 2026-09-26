import { supabaseServer } from "@/lib/auth/supabase-server";
import { supabaseAdmin } from "@/lib/auth/customers";

/* ============================================================
 * GET /api/account/coupon — كوبون العميل (واحد كحد أقصى)
 * الجلسة إلزامية، والقراءة مقيدة بـ customer_id = auth.uid()
 * ============================================================ */

export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  const admin = supabaseAdmin();
  const { data: coupon } = await admin
    .from("coupons")
    .select("code, used_at, expires_at")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ code: string; used_at: string | null; expires_at: string | null }>();

  return Response.json({ ok: true, coupon: coupon ?? null });
}
