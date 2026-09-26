"use client";

import { Loader2 } from "lucide-react";

export const STATUS_AR: Record<string, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكد",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

export const STATUS_STYLE: Record<string, string> = {
  pending: "bg-paper text-graphite ring-1 ring-mist",
  confirmed: "bg-emerald-50 text-emerald-700",
  processing: "bg-paper text-graphite ring-1 ring-mist",
  shipped: "bg-paper text-ink ring-1 ring-silver",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-mist text-steel",
};

export const PAYMENT_AR: Record<string, string> = {
  cod: "عند الاستلام",
  bank_transfer: "تحويل بنكي",
};

export const DELIVERY_AR: Record<string, string> = {
  standard: "عادي · مجاني",
  fast: "سريع · 2.500",
};

export function Spinner() {
  return (
    <div className="flex justify-center py-14">
      <Loader2 className="spin-ring text-steel" size={24} />
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-mist bg-white p-5">
      <p className="text-xs text-steel">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-steel">{hint}</p>}
    </div>
  );
}

export function formatOMR(n: number) {
  return `${Number(n).toFixed(3)} ر.ع`;
}
