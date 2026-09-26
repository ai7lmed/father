import { type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/auth/supabase-server";
import { supabaseAdmin } from "@/lib/auth/customers";

/* ============================================================
 * POST /api/coupons/validate — فحص الكوبون قبل الدفع (بدون استخدامه)
 * كل التحققات خادمية: الملكية، الاستخدام، الصلاحية، شرط 12 ر.ع
 * ============================================================ */

type Body = {
  code?: string;
  items?: { productId: string; price: number; qty: number }[];
};

export async function POST(request: NextRequest) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const code = body.code?.trim().toUpperCase();
  if (!code) return Response.json({ ok: false, error: "missing_code" }, { status: 400 });

  const admin = supabaseAdmin();

  /* الكوبون ملك لهذا العميل فقط */
  const { data: coupon } = await admin
    .from("coupons")
    .select("code, discount_amount, minimum_product_price, used_at, expires_at")
    .eq("code", code)
    .eq("customer_id", user.id)
    .maybeSingle<{
      code: string;
      discount_amount: number;
      minimum_product_price: number;
      used_at: string | null;
      expires_at: string | null;
    }>();

  if (!coupon) return Response.json({ ok: false, error: "coupon_not_found" }, { status: 404 });
  if (coupon.used_at) return Response.json({ ok: false, error: "coupon_already_used" }, { status: 409 });
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
    return Response.json({ ok: false, error: "coupon_expired" }, { status: 410 });

  /* شرط القيمة: أسعار حقيقية من قاعدة البيانات — لا ثقة بأسعار المتصفح */
  const ids = [...new Set((body.items ?? []).map((i) => i.productId))];
  if (ids.length === 0) return Response.json({ ok: false, error: "empty_cart" }, { status: 400 });

  const { data: dbProducts } = await admin
    .from("products")
    .select("id, price")
    .in("id", ids);

  const dbPrices = new Map((dbProducts ?? []).map((p: { id: string; price: number }) => [p.id, Number(p.price)]));
  const maxPrice = Math.max(0, ...ids.map((id) => dbPrices.get(id) ?? 0));

  if (maxPrice < Number(coupon.minimum_product_price))
    return Response.json({ ok: false, error: "coupon_min_product" }, { status: 409 });

  return Response.json({ ok: true, discount: Number(coupon.discount_amount) });
}
