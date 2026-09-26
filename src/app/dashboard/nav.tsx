"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "نظرة عامة" },
  { href: "/dashboard/orders", label: "الطلبات" },
  { href: "/dashboard/products", label: "المنتجات" },
  { href: "/dashboard/categories", label: "الأقسام" },
  { href: "/dashboard/customers", label: "العملاء" },
  { href: "/dashboard/coupons", label: "الكوبونات" },
  { href: "/dashboard/transfers", label: "التحويلات" },
  { href: "/dashboard/settings", label: "الإعدادات" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-mist pb-px">
      {items.map((it) => {
        const active = pathname === it.href || (it.href !== "/dashboard" && pathname.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm transition-colors ${
              active ? "border-ink font-medium text-ink" : "border-transparent text-steel hover:text-ink"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
