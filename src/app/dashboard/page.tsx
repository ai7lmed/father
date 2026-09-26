"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  formatOMR,
  Spinner,
  StatCard,
  STATUS_AR,
  STATUS_STYLE,
  EmptyCard,
  ErrorCard,
} from "./ui";

type Stats = {
  totalOrders: number;
  todayOrders: number;
  totalSales: number;
  totalProducts: number;
  outOfStock: number;
  totalCategories: number;
  totalSubcategories: number;
  lowStock: { product_id: string; qty: number }[];
  topProducts: { product_id: string; name: string; qty: number; revenue: number }[];
};

type Recent = {
  id: string;
  status: string;
  total: number;
  ship_name: string;
  placed_at: string;
};

type Sources = {
  dataQuality: "db" | "static" | "mixed";
  message: string;
};

export default function AdminOverview() {
  const { customer } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [sources, setSources] = useState<Sources | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/stats", { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      const d = await r.json();
      setStats(d.stats);
      setRecent(d.recentOrders ?? []);
      setSources(d.sources ?? null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner />;
  if (err || !stats)
    return <ErrorCard text="تعذر تحميل الإحصائيات." onRetry={load} />;

  const hasNewOrders = stats.todayOrders > 0;

  return (
    <div className="space-y-8">
      {/* ملاحظة جودة مصدر بيانات الكتالوج — تظهر فقط عند الحاجة */}
      {sources && sources.dataQuality !== "db" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm leading-6 text-amber-800">
          {sources.message}
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="إجمالي الطلبات" value={stats.totalOrders} />
        <StatCard
          label="طلبات اليوم (الجديدة)"
          value={stats.todayOrders}
          tone={hasNewOrders ? "warn" : "default"}
          hint={hasNewOrders ? "لديك طلبات بحاجة متابعة" : undefined}
        />
        <StatCard label="إجمالي المبيعات" value={formatOMR(stats.totalSales)} hint="بدون الملغي" />
        <StatCard label="إجمالي المنتجات" value={stats.totalProducts} />
        <StatCard
          label="منتجات نفدت"
          value={stats.outOfStock}
          tone={stats.outOfStock > 0 ? "danger" : "default"}
        />
        <StatCard label="إجمالي الأقسام" value={stats.totalCategories} hint={`فرعية: ${stats.totalSubcategories}`} />
        <StatCard
          label="مخزون منخفض (≤5)"
          value={stats.lowStock.length}
          tone={stats.lowStock.length > 0 ? "warn" : "default"}
        />
        <StatCard label="المدير الحالي" value={customer?.email ?? "—"} ltr />
      </div>

      {/* منخفض المخزون */}
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

      {/* الأكثر طلباً — من بيانات الطلبات الحقيقية */}
      {stats.topProducts.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">الأكثر طلباً (حسب الطلبات الفعلية)</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.topProducts.map((t, i) => (
              <Link
                key={t.product_id}
                href={`/dashboard/products?q=${encodeURIComponent(t.product_id)}`}
                className="flex items-center gap-3 rounded-xl border border-mist bg-white p-4 transition-colors hover:border-steel"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-paper text-xs font-bold text-ink ring-1 ring-mist">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{t.name}</span>
                  <span className="mt-0.5 block text-xs text-steel">
                    {t.qty} قطعة مباعة · {formatOMR(t.revenue)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* آخر الطلبات */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">آخر الطلبات</h2>
        {recent.length === 0 ? (
          <EmptyCard text="لا توجد طلبات بعد — ستظهر هنا فور وصول أول طلب." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-mist bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
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
                        <Link
                          href={`/dashboard/orders/${o.id}`}
                          dir="ltr"
                          className="font-medium text-ink hover:text-accent"
                        >
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
          </div>
        )}
      </section>
    </div>
  );
}
