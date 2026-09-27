/* ============================================================
 * ALDIRXON — الفاتورة المستضافة (hosted invoice)
 * • صفحة HTML نظيفة بعلامة المتجر، عربية RTL افتراضياً مع نسخة EN
 * • الطباعة → PDF من أي متصفح عبر @page A4 + إخفاء أزرار الإطار
 * • لا يحتوي أي سر — تُعرض فقط لصاحب الطلب أو المدير (حماية المسار)
 * ============================================================ */

const OMR = (n: number) =>
  `${Number(n || 0).toFixed(3)} ${"ر.ع"}`;

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export type InvoiceData = {
  id: string;
  status: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  city: string;
  address: string;
  notes?: string | null;
  items: { name: string; qty: number; unitPrice: number }[];
  subtotal: number;
  discount: number;
  couponCode?: string | null;
  deliveryMethod: string;
  deliveryFee: number;
  paymentMethod: string;
  total: number;
};

const STATUS_AR: Record<string, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكد — قيد التجهيز",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};
const STATUS_EN: Record<string, string> = {
  pending: "Pending confirmation",
  confirmed: "Confirmed — preparing",
  processing: "Preparing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const PAY_AR: Record<string, string> = {
  cod: "الدفع عند الاستلام",
  bank_transfer: "تحويل بنكي",
};
const PAY_EN: Record<string, string> = {
  cod: "Cash on delivery",
  bank_transfer: "Bank transfer",
};
const DELIV_AR: Record<string, string> = {
  standard: "توصيل عادي",
  fast: "توصيل سريع",
};
const DELIV_EN: Record<string, string> = {
  standard: "Standard delivery",
  fast: "Express delivery",
};

const fmtDate = (iso: string, lang: "ar" | "en") => {
  try {
    return new Date(iso).toLocaleString(lang === "ar" ? "ar-OM" : "en-GB", {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
};

export function renderInvoiceHtml(d: InvoiceData, lang: "ar" | "en" = "ar"): string {
  const ar = lang === "ar";
  const t = {
    invoice: ar ? "فاتورة" : "INVOICE",
    orderNo: ar ? "رقم الطلب" : "Order no.",
    date: ar ? "التاريخ" : "Date",
    status: ar ? "الحالة" : "Status",
    billTo: ar ? "بيانات العميل" : "Billed to",
    name: ar ? "الاسم" : "Name",
    phone: ar ? "الهاتف" : "Phone",
    email: ar ? "البريد" : "Email",
    address: ar ? "عنوان التوصيل" : "Delivery address",
    item: ar ? "المنتج" : "Item",
    qty: ar ? "الكمية" : "Qty",
    unit: ar ? "سعر الوحدة" : "Unit price",
    line: ar ? "الإجمالي" : "Total",
    subtotal: ar ? "المجموع الفرعي" : "Subtotal",
    discount: ar ? "الخصم" : "Discount",
    coupon: ar ? "كوبون" : "Coupon",
    delivery: ar ? "التوصيل" : "Delivery",
    free: ar ? "مجاني" : "Free",
    payment: ar ? "طريقة الدفع" : "Payment method",
    grand: ar ? "الإجمالي النهائي" : "Grand total",
    thanks: ar
      ? "شكراً لتسوقك من ALDIRXON — سنتواصل معك لتأكيد التوصيل."
      : "Thank you for shopping with ALDIRXON — we'll contact you to confirm delivery.",
    support: ar ? "للاستفسار والدعم عبر واتساب" : "Support via WhatsApp",
    store: ar
      ? "ALDIRXON — متجر الإلكترونيات والأجهزة الذكية · سلطنة عُمان"
      : "ALDIRXON — Electronics & Smart Devices · Sultanate of Oman",
    print: ar ? "طباعة / حفظ PDF" : "Print / Save PDF",
    english: ar ? "English" : "العربية",
    notes: ar ? "ملاحظات" : "Notes",
  };

  const rows = d.items
    .map(
      (it) => `
      <tr>
        <td class="c-name">${esc(it.name)}</td>
        <td class="c-qty">${it.qty}</td>
        <td class="c-num">${OMR(it.unitPrice)}</td>
        <td class="c-num c-strong">${OMR(it.unitPrice * it.qty)}</td>
      </tr>`
    )
    .join("");

  const statusLabel = (ar ? STATUS_AR : STATUS_EN)[d.status] ?? esc(d.status);
  const waHref = `https://wa.me/96895535100`;

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${ar ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${t.invoice} ${esc(d.id)} — ALDIRXON</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f4f5f7; color: #0b0b0d;
    font-family: ${ar ? "'Segoe UI', Tahoma, 'Noto Naskh Arabic', Arial" : "'Segoe UI', Helvetica, Arial"}, sans-serif; }
  .wrap { max-width: 820px; margin: 0 auto; padding: 28px 14px 48px; }
  .sheet { background: #fff; border: 1px solid #e4e4e7; border-radius: 14px;
    box-shadow: 0 1px 2px rgba(0,0,0,.04); overflow: hidden; }
  .head { padding: 30px 34px 0; text-align: center; }
  .brand { font-size: 21px; font-weight: 800; letter-spacing: .34em; margin: 0; }
  .inv-title { margin: 14px 0 0; font-size: 15px; font-weight: 700; color: #52525b; letter-spacing: .12em; }
  .meta { display: flex; flex-wrap: wrap; gap: 10px 26px; justify-content: center;
    padding: 16px 34px 0; font-size: 12.5px; color: #52525b; }
  .meta b { color: #0b0b0d; font-weight: 700; }
  .badge { display: inline-block; border-radius: 999px; padding: 3px 12px;
    background: #ecfdf5; color: #047857; font-weight: 600; font-size: 12px; }
  .badge.pending { background: #fffbeb; color: #b45309; }
  .badge.cancelled { background: #f4f4f5; color: #71717a; }
  hr.sep { border: 0; border-top: 1px solid #e4e4e7; margin: 22px 34px 0; }
  .cols { display: flex; flex-wrap: wrap; gap: 18px; padding: 20px 34px 0; }
  .col { flex: 1 1 240px; }
  .col h3 { margin: 0 0 8px; font-size: 11.5px; letter-spacing: .08em; color: #a1a1aa;
    text-transform: uppercase; font-weight: 700; }
  .col p { margin: 2px 0; font-size: 13.5px; line-height: 1.9; color: #3f3f46; }
  table.items { width: calc(100% - 68px); margin: 22px auto 0; border-collapse: collapse; font-size: 13.5px; }
  table.items th { text-align: start; font-size: 11.5px; color: #71717a; font-weight: 600;
    border-bottom: 1px solid #e4e4e7; padding: 0 8px 9px; }
  table.items td { padding: 11px 8px; border-bottom: 1px solid #f4f4f5; vertical-align: top; }
  .c-qty { text-align: center; width: 56px; }
  .c-num { text-align: end; white-space: nowrap; }
  .c-strong { font-weight: 700; }
  th.c-num { text-align: end; } th.c-qty { text-align: center; }
  .totals { width: calc(100% - 68px); margin: 6px auto 0; border-collapse: collapse; font-size: 13.5px; }
  .totals td { padding: 7px 8px; }
  .totals .lbl { color: #52525b; }
  .totals .val { text-align: end; white-space: nowrap; }
  .totals tr.grand td { border-top: 1px solid #e4e4e7; padding-top: 14px;
    font-size: 16px; font-weight: 800; color: #0b0b0d; }
  .disc { color: #047857; }
  .foot { padding: 24px 34px 30px; text-align: center; color: #71717a; font-size: 12px; line-height: 2; }
  .foot a { color: #0b0b0d; font-weight: 600; text-decoration: none; }
  .bar { display: flex; gap: 10px; justify-content: center; margin: 18px 0 0; }
  .bar a, .bar button { height: 42px; padding: 0 22px; border-radius: 10px; font-size: 13.5px;
    font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
  .bar .print { border: 0; background: #0b0b0d; color: #fff; }
  .bar .alt { border: 1px solid #d4d4d8; background: #fff; color: #0b0b0d; }
  @media (max-width: 560px) {
    .head, .foot { padding-inline: 20px; }
    hr.sep { margin-inline: 20px; }
    .cols { padding-inline: 20px; }
    table.items, .totals { width: calc(100% - 40px); }
  }
  @media print {
    @page { size: A4; margin: 12mm; }
    body { background: #fff; }
    .wrap { padding: 0; max-width: none; }
    .sheet { border: 0; box-shadow: none; border-radius: 0; }
    .bar { display: none !important; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="sheet">
      <div class="head">
        <p class="brand">ALDIRXON</p>
        <p class="inv-title">${t.invoice}</p>
      </div>

      <div class="meta">
        <span>${t.orderNo}: <b dir="ltr">${esc(d.id)}</b></span>
        <span>${t.date}: <b dir="ltr">${fmtDate(d.createdAt, lang)}</b></span>
        <span>${t.status}: <b><span class="badge ${esc(d.status)}">${statusLabel}</span></b></span>
      </div>

      <hr class="sep" />

      <div class="cols">
        <div class="col">
          <h3>${t.billTo}</h3>
          <p><b>${esc(d.customerName)}</b></p>
          <p dir="ltr" style="text-align:${ar ? "right" : "left"};">${esc(d.customerPhone)}</p>
          ${d.customerEmail ? `<p dir="ltr" style="text-align:${ar ? "right" : "left"};">${esc(d.customerEmail)}</p>` : ""}
        </div>
        <div class="col">
          <h3>${t.address}</h3>
          <p>${esc(d.city)}</p>
          <p>${esc(d.address)}</p>
          ${d.notes ? `<p style="color:#71717a;">${t.notes}: ${esc(d.notes)}</p>` : ""}
        </div>
      </div>

      <table class="items">
        <thead>
          <tr>
            <th>${t.item}</th>
            <th class="c-qty">${t.qty}</th>
            <th class="c-num">${t.unit}</th>
            <th class="c-num">${t.line}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <table class="totals">
        <tr><td class="lbl">${t.subtotal}</td><td class="val">${OMR(d.subtotal)}</td></tr>
        ${d.discount > 0 ? `<tr><td class="lbl">${t.discount}${d.couponCode ? ` (${t.coupon}: ${esc(d.couponCode)})` : ""}</td><td class="val disc">- ${OMR(d.discount)}</td></tr>` : ""}
        <tr><td class="lbl">${t.delivery} — ${(ar ? DELIV_AR : DELIV_EN)[d.deliveryMethod] ?? esc(d.deliveryMethod)}</td>
            <td class="val">${d.deliveryFee === 0 ? t.free : OMR(d.deliveryFee)}</td></tr>
        <tr><td class="lbl">${t.payment}</td><td class="val">${(ar ? PAY_AR : PAY_EN)[d.paymentMethod] ?? esc(d.paymentMethod)}</td></tr>
        <tr class="grand"><td>${t.grand}</td><td class="val">${OMR(d.total)}</td></tr>
      </table>

      <div class="foot">
        <p style="margin:0 0 6px;">${t.thanks}</p>
        <p style="margin:0;">${t.support}: <a href="${waHref}" target="_blank" rel="noopener" dir="ltr">+968 9553 5100</a></p>
        <p style="margin:6px 0 0; color:#a1a1aa;">${t.store}</p>
      </div>
    </div>

    <div class="bar">
      <button class="print" onclick="window.print()">${t.print}</button>
      <a class="alt" href="?lang=${ar ? "en" : "ar"}">${t.english}</a>
      <a class="alt" href="/" target="_blank" rel="noopener">ALDIRXON</a>
    </div>
  </div>
</body>
</html>`;
}

/** تمرير بيانات الطلب → InvoiceData (يُستخدم في مسار الفاتورة والإشعارات) */
export function toInvoiceData(input: {
  order: Record<string, unknown>;
  items: { name: string; qty: number; unit_price: number }[];
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  couponCode?: string | null;
}): InvoiceData {
  const o = input.order as Record<string, string | number | null>;
  return {
    id: String(o.id ?? ""),
    status: String(o.status ?? "pending"),
    createdAt: String(o.placed_at ?? o.created_at ?? new Date().toISOString()),
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    city: String(o.ship_city ?? ""),
    address: String(o.ship_address ?? ""),
    notes: (o.ship_notes as string | null) ?? null,
    items: input.items.map((it) => ({
      name: it.name,
      qty: it.qty,
      unitPrice: Number(it.unit_price),
    })),
    subtotal: Number(o.subtotal ?? 0),
    discount: Number(o.discount ?? 0),
    couponCode: input.couponCode ?? null,
    deliveryMethod: String(o.delivery_method ?? "standard"),
    deliveryFee: Number(o.delivery_fee ?? 0),
    paymentMethod: String(o.payment_method ?? "cod"),
    total: Number(o.total ?? 0),
  };
}
