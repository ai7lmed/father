"use client";

import { useCallback, useEffect, useState } from "react";
import { formatOMR, Spinner, STATUS_AR } from "../ui";

type Order = {
  id: string;
  status: string;
  total: number;
  ship_name: string;
  ship_phone: string;
  ship_city: string;
  placed_at: string;
  receipt_attached: boolean;
};

type Receipt = { id: string; data_url: string | null; storage_key: string | null };

export default function AdminTransfers() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [receipts, setReceipts] = useState<Record<string, Receipt>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch("/api/admin/receipts", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setOrders(d.orders ?? []);
    setReceipts(d.receipts ?? {});
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (orderId: string, action: "approve" | "reject") => {
    setBusy(orderId);
    await fetch("/api/admin/receipts", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId, action }),
    });
    setBusy(null);
    setOrders((os) => os.map((o) => (o.id === orderId ? { ...o, status: action === "approve" ? "confirmed" : "cancelled" } : o)));
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="rounded-xl border border-mist bg-paper p-8 text-center text-sm text-graphite">
          لا توجد طلبات تحويل بنكي بعد.
        </div>
      ) : (
        orders.map((o) => {
          const r = receipts[o.id];
          return (
            <div key={o.id} className="rounded-xl border border-mist bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <a href={`/dashboard/orders/${o.id}`} dir="ltr" className="text-sm font-semibold text-ink hover:text-accent">
                    {o.id}
                  </a>
                  <p className="mt-0.5 text-xs text-steel">
                    {o.ship_name} · {o.ship_city} · {formatOMR(Number(o.total))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] text-graphite ring-1 ring-mist">
                    {STATUS_AR[o.status] ?? o.status}
                  </span>
                  <button
                    type="button"
                    disabled={busy === o.id || o.status === "confirmed"}
                    onClick={() => act(o.id, "approve")}
                    className="h-8 rounded-lg bg-ink px-3 text-xs font-medium text-white hover:bg-accent disabled:opacity-30"
                  >
                    قبول
                  </button>
                  <button
                    type="button"
                    disabled={busy === o.id || o.status === "cancelled"}
                    onClick={() => act(o.id, "reject")}
                    className="h-8 rounded-lg border border-mist px-3 text-xs text-graphite hover:border-red-300 hover:text-red-600 disabled:opacity-30"
                  >
                    رفض
                  </button>
                </div>
              </div>

              {r?.data_url ? (
                <a href={r.data_url} target="_blank" rel="noreferrer" className="mt-4 block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.data_url} alt={`إيصال ${o.id}`} className="max-h-52 rounded-lg border border-mist object-contain" />
                </a>
              ) : (
                <p className="mt-3 text-xs text-steel">
                  {o.receipt_attached ? "الإيصال مخزّن في Storage." : "لم يُرفق إيصال بعد."}
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
    );
}
