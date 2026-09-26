import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { AuthProvider } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RouteFade } from "@/components/motion";
import { MobileTabBar, WhatsAppFab } from "@/components/mobile-widgets";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"], // بدون 300 — غير مستخدمة
  variable: "--font-plex",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
  adjustFontFallback: false, // IBM Plex تدعم العربية كاملة — توفير ~15KB CSS
});

export const metadata: Metadata = {
  title: {
    default: "QAVEN — Technology. Simplified.",
    template: "%s — QAVEN",
  },
  description:
    "QAVEN — متجر الإلكترونيات والأجهزة الذكية في سلطنة عُمان. هواتف، سماعات، أجهزة Gaming ومنتجات المنزل الذكي، أصلية بضمان الوكيل مع توصيل لكل المحافظات.",
};

export const viewport: Viewport = {
  themeColor: "#10151d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={plex.variable}>
      <body className="min-h-screen bg-paper2 font-sans text-ink antialiased">
        <CartProvider>
          <WishlistProvider>
            <AuthProvider>
              <SiteHeader />
              <main className="pb-16 lg:pb-0">
                <RouteFade key="route">{children}</RouteFade>
              </main>
              <SiteFooter />
              <MobileTabBar />
              <WhatsAppFab />
            </AuthProvider>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
