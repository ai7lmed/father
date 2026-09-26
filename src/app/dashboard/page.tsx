"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { formatOMR, Spinner, StatCard, STATUS_AR, STATUS_STYLE } from "./ui";

type Stats = {
  totalOrders: number;
  todayOrders: number;
  totalSales: number;
  totalProducts: number;
  lowStock: { product_id: string; qty: number }[];
};

type Recent = {
  id: string;
  status: string;
  total: number;
  ship_name: string;
  placed_at: string;
};

export default function AdminOverview() {
  const { customer } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        setStats(d.stats);
        setRecent(d.recentOrders ?? []);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (err || !stats)
    return (
      <div className="rounded-xl border border-mist bg-paper p-8 text-sm text-graphite">
        تعذر تحميل الإحصائيات{err ? ` (${err})` : ""}.
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إجمالي الطلبات" value={stats.totalOrders} />
        <StatCard label="طلبات اليوم" value={stats.todayOrders} />
        <StatCard label="إجمالي المبيعات" value={formatOMR(stats.totalSales)} hint="بدون الملغي" />
        <StatCard label="عدد المنتجات" value={stats.totalProducts} />
      </div>

      {stats.lowStock.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">منتجات منخفضة المخزون (≤ 5)</h2>
          <div className="flex flex-wrap gap-2">
            {stats.lowStock.slice(0, 12).map((l) => (
              <Link
                key={l.product_id}
                href={`/dashboard/products?q=${encodeURIComponent(l.product_id)}`}
                className="rounded-lg border border-mist bg-white px-3 py-2 text-xs text-graphite transition-colors hover:border-ink"
              >
                <span dir="ltr">{l.product_id}</span>
                <span className="ms-2 font-semibold text-ink">{l.qty}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">آخر الطلبات</h2>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-mist bg-paper p-8 text-center text-sm text-graphite">
            لا توجد طلبات بعد.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-mist bg-white">
            <table className="w-full text-sm">
              <thead className="bg-paper text-xs text-steel">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">رقم الطلب</th>
                  <th className="px-4 py-3 text-start font-medium">العميل</th>
                  <th className="px-4 py-3 text-start font-medium">الإجمالي</th>
                  <th className="px-4 py-3 text-start font-medium">الحالة</th>
                  <th className="px-4 py-3 text-start font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-t border-mist">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/orders/${o.id}`} dir="ltr" className="font-medium text-ink hover:text-accent">
                        {o.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-graphite">{o.ship_name}</td>
                    <td className="px-4 py-3">{formatOMR(Number(o.total))}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] ${STATUS_STYLE[o.status] ?? ""}`}>
                        {STATUS_AR[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-steel">
                      {new Date(o.placed_at).toLocaleDateString("ar-OM")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-steel">
        المدير: <span dir="ltr">{customer?.email}</span>
      </p>
    </div>
  );
}
