/* ============================================================
 * ALDIRXON — Database-oriented schema (DB-agnostic types)
 * ------------------------------------------------------------
 * هذه الأنواع هي "العقد" بين الواجهة وقاعدة البيانات.
 * SQL DDL المقابل موثق في docs/DATABASE.md.
 * طبقة الوصول: src/lib/db/store.ts (واجهة QavenStore + محوّل
 * محلي حالياً — يُستبدل لاحقاً بمحول API/Prisma دون تغيير UI).
 * ============================================================ */

/* ——— Customers (→ `customers`) ——— */

export type Customer = {
  /** رقم الهاتف هو المعرّف الطبيعي للدخول بـ OTP */
  id: string;
  phone: string; // 8 أرقام عُماني، يُخزن بلا رمز دولة
  name?: string;
  email?: string;
  createdAt: string; // ISO
};

/* ——— Addresses (→ `addresses`) ——— */

export type CustomerAddress = {
  id: string;
  customerId: string;
  label: string; // "المنزل"، "العمل"…
  fullName: string;
  phone: string;
  city: string; // الولاية
  address: string; // الحي/الشارع/رقم المنزل
  notes?: string;
  isDefault: boolean;
};

/* ——— OTP (→ `otp_codes`) ——— */

export type OtpCode = {
  id: string;
  phone: string;
  code: string; // 4 أرقام (في الإنتاج: hash + TTL + محاولات)
  expiresAt: string;
  consumed: boolean;
};

/* ——— Sessions (→ `sessions` — رمز الجلسة بعد التحقق) ——— */

export type Session = {
  token: string;
  customerId: string;
  createdAt: string;
};

/* ——— Gaming subcategories (→ `subcategories` — FK → categories.slug) ———
 * تُدار من قاعدة البيانات لاحقاً — لا أسماء مكتوبة في الكود. */
export type SubcategoryRow = {
  slug: string; // PK منطقي
  parent: string; // FK → categories.slug (مثلاً "gaming")
  name: string;
  nameAr: string;
  img?: string;
  active: boolean;
  sortOrder: number;
};

/* ——— Categories (→ `categories`) ——— */

export type CategoryRow = {
  slug: string; // PK منطقي
  name: string; // الاسم اللاتيني/التجاري
  nameAr: string;
  img: string;
  /** يظهر في المتجر حتى قبل إضافة منتجات (مثل GPS السيارات) */
  active: boolean;
  sortOrder: number;
};

/* ——— Products (→ `products`) ——— */

export type ProductRow = {
  id: string; // SKU
  name: string;
  brand: string;
  category: string; // FK → categories.slug — يُحدَّد مرة واحدة
  subcategory?: string; // FK → subcategories.slug (اختياري)
  tags: string[]; // → جدول product_tags — بحث/ارتباطات، لا نسخ
  price: number; // OMR
  oldPrice?: number;
  img: string; // الصورة الرئيسية (FK منطقي → product_images)
  desc: string;
  specs: [string, string][]; // → صفوف جدول product_specs
  rating: number; // مفهرس من المراجعات لاحقاً
  reviews: number;
  sold: number;
  stock: number; // → inventory.qty
  badge?: "New" | "Best Seller" | "Limited" | "Sale";
  isFeatured?: boolean;
  isNew?: boolean;
};

/* ——— Delivery methods (→ `delivery_methods`) ——— */

export type DeliveryMethodRow = {
  code: "standard" | "fast" | (string & {});
  label: string;
  desc: string;
  fee: number; // OMR
  eta: string;
  active: boolean;
};

/* ——— Payment methods (→ `payment_methods`) ——— */

export type PaymentMethodRow = {
  code: "cod" | "bank_transfer" | (string & {});
  label: string;
  desc: string;
  /** يتطلب رفع إيصال تحويل */
  requiresReceipt?: boolean;
  active: boolean;
};

/* ——— Orders (→ `orders`) ——— */

export type OrderStatus =
  | "pending" // بانتظار تأكيد التحويل (بنكي) أو التجهيز
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderRow = {
  id: string; // QVN-XXXX
  customerId?: string; // FK — فارغ للضيوف
  status: OrderStatus;
  items: { productId: string; name: string; qty: number; unitPrice: number }[];
  subtotal: number;
  deliveryMethod: "standard" | "fast";
  deliveryFee: number;
  total: number;
  paymentMethod: "cod" | "bank_transfer";
  receiptAttached: boolean;
  address: {
    fullName: string;
    phone: string;
    city: string;
    address: string;
    notes?: string;
  };
  placedAt: string;
};

/* ——— Bank transfer receipts (→ `bank_transfer_receipts`) ———
 * في المحول المحلي: dataURL مخزن مع الطلب.
 * في الإنتاج: رفع إلى Object Storage وتخزين المفتاح فقط. */
export type ReceiptRef = {
  orderId: string;
  dataUrl?: string; // demo adapter فقط
  storageKey?: string; // adapter حقيقي
};

/* ——— Settings (→ `settings` — key/value JSON) ——— */

export type QavenSettings = {
  store: {
    name: string;
    currency: string;
    whatsapp: string;
    email: string;
    instagram: string;
  };
  deliveryMethods: DeliveryMethodRow[];
  paymentMethods: PaymentMethodRow[];
  freeShippingThreshold: number;
  bankAccount: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    iban: string;
  };
};
