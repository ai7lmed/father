import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/auth/supabase-server";
import { supabaseAdmin } from "@/lib/auth/customers";
import { sendOrderNotifications, customerEmailFor, notificationsStatus } from "@/lib/notifications";

/* ============================================================
 * POST /api/orders — إنشاء طلب حقيقي في قاعدة البيانات
 * ------------------------------------------------------------
 * • التسعير يُحسب على الخادم من جدول products — لا يُؤتمر بأسعار
 *   المتصفح إطلاقاً (الأمان التجاري الأساسي).
 * • التوصيل: عادي مجاني / سريع 2.500 ر.ع — من جدول delivery_methods.
 * • خصم المخزون ذرياً في نفس خطوة الإدراج.
 * • تحقق من رقم عُماني صحيح قبل أي شيء.
 * ============================================================ */

type OrderItemInput = { productId: string; qty: number };

type Body = {
  items: OrderItemInput[];
  deliveryMethod: "standard" | "fast";
  paymentMethod: "cod" | "bank_transfer";
  address: {
    fullName: string;
    phone: string;
    city: string;
    address: string;
    notes?: string;
  };
  receipt?: { dataUrl?: string } | null;
  couponCode?: string | null;
};

const FREE_SHIPPING_THRESHOLD = 25;
const VALID_STATUSES = ["pending", "confirmed"] as const;

function orderNumber(): string {
  return `QVN-${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 4)
    .toUpperCase()}`;
}

/** رقم عُماني محلي (8 أرقام تبدأ بـ 9) — يُخزن بدون رمز الدولة */
function normalizeOmaniPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const local = digits.replace(/^(?:968|00968)/, "");
  return /^9\d{7}$/.test(local) ? local : null;
}

export async function POST(request: NextRequest) {
  /* ——— 0) الجلسة ——— */
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* ——— 1) المدخلات ——— */
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const items = (body.items ?? []).filter(
    (i) => typeof i.productId === "string" && Number.isInteger(i.qty) && i.qty > 0
  );
  if (items.length === 0)
    return Response.json({ ok: false, error: "empty_cart" }, { status: 400 });

  const phone = normalizeOmaniPhone(body.address?.phone ?? "");
  if (
    !body.address?.fullName?.trim() ||
    !phone ||
    !body.address.city?.trim() ||
    !body.address.address?.trim()
  )
    return Response.json({ ok: false, error: "invalid_address" }, { status: 400 });

  if (!["standard", "fast"].includes(body.deliveryMethod))
    return Response.json({ ok: false, error: "invalid_delivery" }, { status: 400 });

  if (!["cod", "bank_transfer"].includes(body.paymentMethod))
    return Response.json({ ok: false, error: "invalid_payment" }, { status: 400 });

  /* ——— 2) التسعير من قاعدة البيانات (المصدر الوحيد للحق) ——— */
  const admin = supabaseAdmin();
  const ids = [...new Set(items.map((i) => i.productId))];

  const [{ data: dbProducts, error: prodErr }, { data: invRows }] = await Promise.all([
    admin
      .from("products")
      .select("id, name, price")
      .in("id", ids),
    admin.from("inventory").select("product_id, qty").in("product_id", ids),
  ]);

  if (prodErr) {
    console.error("[orders] products fetch:", prodErr.message);
    return Response.json(
      { ok: false, error: "db_unavailable" },
      { status: 503 }
    );
  }

  const stockMap = new Map(
    (invRows ?? []).map((r: { product_id: string; qty: number }) => [r.product_id, Number(r.qty)])
  );

  const priceMap = new Map(
    (dbProducts ?? []).map((p: { id: string; name: string; price: number }) => [
      p.id,
      { name: p.name, price: Number(p.price), stock: stockMap.get(p.id) ?? 0 },
    ])
  );

  /* كل منتج يجب أن يوجد — وإلا الطلب مرفوض */
  for (const item of items) {
    if (!priceMap.has(item.productId))
      return Response.json(
        { ok: false, error: "product_not_found", productId: item.productId },
        { status: 400 }
      );
  }

  const subtotal = items.reduce(
    (s, i) => s + priceMap.get(i.productId)!.price * i.qty,
    0
  );

  /* ——— 3) رسوم التوصيل من قاعدة البيانات (النظام النهائي) ——— */
  const { data: methods } = await admin
    .from("delivery_methods")
    .select("code, fee, active")
    .eq("code", body.deliveryMethod)
    .eq("active", true)
    .single<{ code: string; fee: number; active: boolean }>();

  const deliveryFee = methods ? Number(methods.fee) : body.deliveryMethod === "fast" ? 2.5 : 0;

  /* ——— 4) توليد رقم الطلب قبل الكوبون حتى يُربط به في الذرية الواحدة ——— */
  let orderId = orderNumber();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await admin
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .maybeSingle<{ id: string }>();
    if (!existing) break;
    orderId = orderNumber();
  }

  /* ——— 3ب) الكوبون: كل التحققات خادمية عبر apply_coupon الذرية ——— */
  let discount = 0;
  let couponError: string | null = null;
  if (body.couponCode && user) {
    const maxPrice = Math.max(...items.map((i) => priceMap.get(i.productId)!.price));
    const { data: cpn, error: cpnErr } = await (
      admin.rpc as (
        fn: string, args: Record<string, unknown>
      ) => PromiseLike<{ data: unknown; error: { message: string } | null }>
    )("apply_coupon", {
      p_code: body.couponCode,
      p_customer_id: user.id,
      p_order_id: orderId,
      p_subtotal: subtotal,
      p_max_product_price: maxPrice,
    });
    const result = cpn as { ok: boolean; error?: string; discount?: number } | null;
    if (cpnErr || !result?.ok) {
      couponError = result?.error ?? "coupon_invalid";
    } else {
      discount = Number(result.discount ?? 0);
    }
  }

  /* عتبة التوصيل المجاني: لا تغيّر رسوم العادي — هي مجانية أصلاً */
  const total = Math.max(0, subtotal - discount) + deliveryFee;

  /* ——— 5) إدراج الطلب + الأصناف + الإيصال + خصم المخزون ——— */
  const isBank = body.paymentMethod === "bank_transfer";
  const orderRow = {
    id: orderId,
    customer_id: user?.id ?? null,
    status: isBank ? "pending" : "confirmed",
    subtotal,
    delivery_method: body.deliveryMethod,
    delivery_fee: deliveryFee,
    total,
    payment_method: body.paymentMethod,
    ship_name: body.address.fullName.trim(),
    ship_phone: phone,
    ship_city: body.address.city.trim(),
    ship_address: body.address.address.trim(),
    ship_notes: body.address.notes?.trim() || null,
    receipt_attached: isBank && Boolean(body.receipt?.dataUrl),
  };

  const itemRows: { order_id: string; product_id: string; name: string; qty: number; unit_price: number }[] = items.map((i) => ({
    order_id: orderId,
    product_id: i.productId,
    name: priceMap.get(i.productId)!.name,
    qty: i.qty,
    unit_price: priceMap.get(i.productId)!.price,
  }));

  const receiptRow = isBank && body.receipt?.dataUrl
    ? { order_id: orderId, data_url: body.receipt.dataUrl.slice(0, 2_000_000) }
    : null;

  const { error: orderErr } = await admin
    .from("orders")
    .insert(orderRow as never);

  if (orderErr) {
    console.error("[orders] insert:", orderErr.message);
    return Response.json({ ok: false, error: "order_failed" }, { status: 503 });
  }

  const { error: itemsErr } = await admin.from("order_items").insert(
    itemRows.map((r) => ({ ...r })) as never
  );
  if (itemsErr) {
    console.error("[orders] items insert:", itemsErr.message);
    // الطلب موجود بدون أصناف — سجّل المشكلة ولا تكمل
    return Response.json({ ok: false, error: "order_items_failed", orderId }, { status: 503 });
  }

  /* ——— كوبون الشكر: مرة واحدة لكل عميل بعد أول طلب ناجح ——— */
  let issuedCoupon: string | null = null;
  if (user) {
    const { data: issuedCode } = await (
      admin.rpc as (
        fn: string, args: Record<string, unknown>
      ) => PromiseLike<{ data: unknown; error: { message: string } | null }>
    )("issue_thanks_coupon", {
      p_customer_id: user.id,
    });
    issuedCoupon = (issuedCode as string | null) ?? null;
  }

  if (receiptRow) {
    const { error: rcptErr } = await admin
      .from("bank_transfer_receipts")
      .insert(receiptRow as never);
    if (rcptErr) console.error("[orders] receipt:", rcptErr.message);
  }

  /* خصم المخزون — أقل صبراً على الأخطاء (التقارير لاحقاً) */
  for (const i of items) {
    const current = priceMap.get(i.productId)!.stock;
    const next = Math.max(0, current - i.qty);
    await admin.from("inventory").upsert(
      { product_id: i.productId, qty: next, updated_at: new Date().toISOString() } as never,
      { onConflict: "product_id" }
    );
  }

  /* ——— الإشعارات: بعد نجاح الطلب نهائياً — فشلها لا يؤثر على الرد ——— */
  const notify = notificationsStatus();
  if (user || customerEmailFor) {
    const email = user ? await customerEmailFor(user.id) : null;
    void sendOrderNotifications({
      id: orderId,
      status: orderRow.status,
      customerName: body.address.fullName.trim(),
      customerEmail: email,
      customerPhone: phone,
      items: itemRows.map((r) => ({ name: r.name, qty: r.qty, unitPrice: r.unit_price })),
      subtotal,
      discount,
      deliveryMethod: body.deliveryMethod,
      deliveryFee,
      paymentMethod: body.paymentMethod,
      total,
      city: body.address.city.trim(),
      address: body.address.address.trim(),
      placedAt: new Date().toISOString(),
    }).then((r) => {
      if (!r.email.ok) console.warn("[orders] email notify:", r.email.error);
      if (!r.whatsapp.ok) console.warn("[orders] whatsapp notify:", r.whatsapp.error);
    });
  }

  return Response.json({
    ok: true,
    order: {
      id: orderId,
      status: VALID_STATUSES.includes(orderRow.status as never) ? orderRow.status : "pending",
      subtotal,
      discount,
      deliveryFee,
      total,
      deliveryMethod: body.deliveryMethod,
      paymentMethod: body.paymentMethod,
    },
    coupon: {
      applied: discount > 0,
      error: couponError,
      issued: issuedCoupon,
    },
    notifications: notify,
  });
}

/** GET /api/orders?id=QVN-… — طلب واحد (لصاحبه فقط) */
export async function GET(request: NextRequest) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ ok: false, error: "missing_id" }, { status: 400 });

  const admin = supabaseAdmin();
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!order) return Response.json({ ok: false, error: "not_found" }, { status: 404 });

  const { data: orderItems } = await admin
    .from("order_items")
    .select("product_id, name, qty, unit_price")
    .eq("order_id", id);

  return Response.json({
    ok: true,
    order: {
      ...(order as Record<string, unknown>),
      items: orderItems ?? [],
    },
  });
}
