"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Gamepad2, Heart, Search, MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";

export function MobileTabBar() {
  const { count, ready } = useCart();
  const { count: wishCount } = useWishlist();
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/shop", label: "المتجر", icon: ShoppingBag },
    { href: "/gaming", label: "Gaming", icon: Gamepad2 },
    { href: "/wishlist", label: "المفضلة", icon: Heart, badge: wishCount },
    { href: "/cart", label: "السلة", icon: ShoppingBag, badge: ready ? count : 0 },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-mist bg-paper2/95 backdrop-blur lg:hidden">
      <div className="grid grid-cols-5">
        {tabs.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.label}
              href={t.href}
              className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] transition-colors ${
                active ? "font-medium text-ink" : "text-steel"
              }`}
            >
              <span className="relative">
                <t.icon size={19} strokeWidth={active ? 2 : 1.6} />
                {typeof t.badge === "number" && t.badge > 0 && (
                  <span className="absolute -top-1.5 left-0 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-semibold text-white">
                    {t.badge}
                  </span>
                )}
              </span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function WhatsAppFab() {
  return (
    <a
      href="https://wa.me/96890000000"
      target="_blank"
      rel="noreferrer"
      aria-label="تواصل عبر واتساب"
      className="fixed bottom-20 end-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white shadow-lg shadow-ink/25 transition-transform hover:scale-105 active:scale-95 lg:bottom-6 lg:end-6"
    >
      <MessageCircle size={21} strokeWidth={1.75} />
    </a>
  );
}

export function SearchFab() {
  return (
    <Link
      href="/search"
      aria-label="بحث"
      className="fixed bottom-20 start-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-mist bg-white text-ink shadow-lg lg:hidden"
    >
      <Search size={20} strokeWidth={1.75} />
    </Link>
  );
}
