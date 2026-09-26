"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatOMR, PAYMENT_AR, Spinner, STATUS_AR, STATUS_STYLE } from "../../ui";

type Item = { product_id: string | null; name: string; qty: number; unit_price: number };
type Order = Record<string, unknown> & { id: string; status: string };
type Receipt = { id: string; data_url: string | null; storage_key: string | null; created_at: string };

export default function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/orders/${id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        setOrder(d.order);
        setItems(d.items ?? []);
        setReceipt(d.receipt);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const setStatus = async (status: string) => {
    if (!id) return;
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOrder((o) => (o ? { ...o, status } : o));
  };

  if (loading) return <Spinner />;
  if (!order)
    return (
      <div className="rounded-xl border border-mist bg-paper p-8 text-sm text-graphite">
        الطلب غير موجود. <Link href="/dashboard/orders" className="text-accent">رجوع للطلبات</Link>
      </div>
    );

  const subtotal = Number(order.subtotal);
  const fee = Number(order.delivery_fee);
  const total = Number(order.total);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-steel">تفاصيل الطلب</p>
          <h2 dir="ltr" className="mt-1 text-xl font-semibold tracking-tight text-ink">
            {order.id}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs ${STATUS_STYLE[order.status] ?? ""}`}>
            {STATUS_AR[order.status] ?? order.status}
          </span>
          <select
            value={order.status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 rounded-lg border border-mist bg-white px-3 text-sm outline-none focus:border-accent"
          >
            {Object.keys(STATUS_AR).map((s) => (
              <option key={s} value={s}>
                {STATUS_AR[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-mist bg-white p-5">
        <h3 className="text-sm font-semibold text-ink">الأصناف</h3>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-t border-mist">
                <td className="py-2.5 pe-3 text-graphite">{it.name}</td>
                <td className="py-2.5 text-center text-steel">× {it.qty}</td>
                <td className="py-2.5 ps-3 text-end font-medium text-ink">{formatOMR(it.unit_price * it.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 space-y-1.5 border-t border-mist pt-4 text-sm">
          <div className="flex justify-between text-graphite">
            <span>المجموع الفرعي</span>
            <span>{formatOMR(subtotal)}</span>
          </div>
          <div className="flex justify-between text-graphite">
            <span>التوصيل ({order.delivery_method === "fast" ? "سريع" : "عادي"})</span>
            <span>{fee === 0 ? "مجاني" : formatOMR(fee)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-ink">
            <span>الإجمالي</span>
            <span>{formatOMR(total)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-mist bg-white p-5 text-sm">
          <h3 className="font-semibold text-ink">العميل والعنوان</h3>
          <p className="mt-2 text-graphite">{String(order.ship_name ?? "")}</p>
          <p dir="ltr" className="text-steel">{String(order.ship_phone ?? "")}</p>
          <p className="mt-1 text-graphite">
            {String(order.ship_city ?? "")} — {String(order.ship_address ?? "")}
          </p>
          {order.ship_notes ? <p className="mt-1 text-xs text-steel">ملاحظات: {String(order.ship_notes)}</p> : null}
          <p className="mt-3 text-xs text-steel">
            الدفع: {PAYMENT_AR[String(order.payment_method)] ?? String(order.payment_method)}
          </p>
        </div>

        <div className="rounded-xl border border-mist bg-white p-5 text-sm">
          <h3 className="font-semibold text-ink">إيصال التحويل</h3>
          {receipt?.data_url ? (
            <a href={receipt.data_url} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={receipt.data_url}
                alt="إيصال التحويل"
                className="mt-3 max-h-64 w-full rounded-lg border border-mist object-contain"
              />
            </a>
          ) : receipt ? (
            <p className="mt-2 text-xs text-steel">إيصال مخزّن في Storage: {receipt.storage_key}</p>
          ) : (
            <p className="mt-2 text-xs text-steel">لا يوجد إيصال.</p>
          )}
        </div>
      </div>
    </div>
  );
}
