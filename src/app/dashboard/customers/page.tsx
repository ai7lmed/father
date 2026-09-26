"use client";

import { useEffect, useState } from "react";
import { formatOMR, Spinner } from "../ui";

type Customer = {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  created_at: string;
  orders_count: number;
  total_spent: number;
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/customers", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="overflow-x-auto rounded-xl border border-mist bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-paper text-xs text-steel">
          <tr>
            <th className="px-4 py-3 text-start font-medium">العميل</th>
            <th className="px-4 py-3 text-start font-medium">البريد</th>
            <th className="px-4 py-3 text-start font-medium">الهاتف</th>
            <th className="px-4 py-3 text-start font-medium">الطلبات</th>
            <th className="px-4 py-3 text-start font-medium">إجمالي المشتريات</th>
            <th className="px-4 py-3 text-start font-medium">تاريخ التسجيل</th>
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-graphite">لا يوجد عملاء بعد.</td>
            </tr>
          ) : (
            customers.map((c) => (
              <tr key={c.id} className="border-t border-mist">
                <td className="px-4 py-3 font-medium text-ink">{c.full_name || "—"}</td>
                <td className="px-4 py-3 text-xs text-graphite" dir="ltr">{c.email || "—"}</td>
                <td className="px-4 py-3 text-xs text-graphite" dir="ltr">{c.phone ? `+968 ${c.phone}` : "—"}</td>
                <td className="px-4 py-3">{c.orders_count}</td>
                <td className="px-4 py-3">{formatOMR(c.total_spent)}</td>
                <td className="px-4 py-3 text-xs text-steel">
                  {new Date(c.created_at).toLocaleDateString("ar-OM")}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
