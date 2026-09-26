"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  Heart,
  Zap,
  UserRound,
  LayoutDashboard,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/lib/auth";

const links = [
  { href: "/", label: "الرئيسية" },
  { href: "/shop", label: "المتجر" },
  { href: "/gaming", label: "Gaming" },
  { href: "/about", label: "من نحن" },
  { href: "/contact", label: "تواصل" },
];

export function SiteHeader() {
  const { count, ready } = useCart();
  const { count: wishCount } = useWishlist();
  const { customer, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [pop, setPop] = useState(false);
  const pathname = usePathname();
  const prevCount = useRef(count);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (count > prevCount.current) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 450);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement bar */}
      <div className="bg-ink text-white">
        <div className="shell flex h-9 items-center justify-center gap-2 text-[12px]">
          <Zap size={13} strokeWidth={1.75} className="text-silver" />
          <span>التوصيل العادي مجاني لجميع الطلبات داخل سلطنة عُمان</span>
          <span className="hidden text-steel sm:inline">·</span>
          <span className="hidden text-silver sm:inline">السريع 24-48 ساعة بـ 2.500 ر.ع</span>
          <span className="hidden text-steel md:inline">·</span>
          <span className="hidden text-silver md:inline">+968 9553 5100</span>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-mist bg-paper2/95 backdrop-blur supports-[backdrop-filter]:bg-paper2/85">
        <div className="shell flex h-16 items-center justify-between">
          <div className="flex items-center gap-9">
            <Link href="/"            className="text-lg font-bold tracking-[0.24em] text-ink">
              ALDIRXON
            </Link>
            <nav className="hidden items-center gap-7 lg:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`text-sm transition-colors ${
                    l.href !== "/" && pathname.startsWith(l.href)
                      ? "font-medium text-ink"
                      : pathname === l.href
                        ? "font-medium text-ink"
                        : "text-steel hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
                )
              )}
            </nav>
          </div>

          <div className="flex items-center gap-0.5">
            <Link
              href="/search"
              aria-label="البحث"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-graphite transition-colors hover:bg-cloud hover:text-ink"
            >
              <Search size={19} strokeWidth={1.75} />
            </Link>
            <Link
              href="/wishlist"
              aria-label="المفضلة"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-graphite transition-colors hover:bg-cloud hover:text-ink"
            >
              <Heart size={19} strokeWidth={1.75} />
              {wishCount > 0 && (
                <span className="absolute -top-0.5 left-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                  {wishCount}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              aria-label="سلة التسوق"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-graphite transition-colors hover:bg-cloud hover:text-ink"
            >
              <ShoppingBag size={19} strokeWidth={1.75} />
              {ready && count > 0 && (
                <span
                  className={`absolute -top-0.5 left-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-white ${
                    pop ? "badge-pop" : ""
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
            <Link
              href="/account"
              aria-label={customer ? "حسابي" : "تسجيل الدخول"}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-cloud ${
                customer ? "text-accent" : "text-graphite hover:text-ink"
              }`}
            >
              <UserRound size={19} strokeWidth={customer ? 2 : 1.75} />
            </Link>
            {isAdmin && (
              <Link
                href="/dashboard"
                aria-label="لوحة التحكم"
                title="لوحة التحكم"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-graphite transition-colors hover:bg-cloud hover:text-ink"
              >
                <LayoutDashboard size={19} strokeWidth={1.75} />
              </Link>
            )}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="القائمة"
              aria-expanded={open}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-graphite transition-colors hover:bg-cloud hover:text-ink lg:hidden"
            >
              {open ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-b border-mist bg-paper2 lg:hidden">
          <div className="shell flex flex-col py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`py-2.5 text-sm transition-colors ${
                  pathname === l.href ? "font-medium text-ink" : "text-steel hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
