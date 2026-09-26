import type {
  QavenSettings,
  DeliveryMethodRow,
  PaymentMethodRow,
  ProductRow,
  CategoryRow,
  SubcategoryRow,
} from "./db/schema";

/* ============================================================
 * ALDIRXON catalog — settings + categories + products
 * ------------------------------------------------------------
 * DB PATH: الإعدادات والتصنيفات والمنتجات هنا مصممة بنفس أنواع
 * جدول قاعدة البيانات (schema.ts) — عند الربط تُقرأ عبر
 * src/lib/db/store.ts أو server fetch دون تغيير أي مكوّن.
 * ============================================================ */

/* ——— Store settings (→ `settings` table) ——— */

export const settings: QavenSettings = {
  store: {
    name: "ALDIRXON",
    currency: "OMR",
    whatsapp: "+96895535100",
    email: "support@aldirxon.om",
    instagram: "https://instagram.com",
  },
  deliveryMethods: [
    {
      code: "standard",
      label: "التوصيل العادي",
    desc: "3 – 5 أيام عمل داخل عُمان",
      fee: 0,
      eta: "3 – 5 أيام عمل",
      active: true,
    },
    {
      code: "fast",
      label: "التوصيل السريع",
    desc: "خلال 24 – 48 ساعة",
      fee: 2.5,
      eta: "24 – 48 ساعة",
      active: true,
    },
  ] satisfies DeliveryMethodRow[],
  paymentMethods: [
    {
      code: "cod",
      label: "الدفع عند الاستلام",
    desc: "الدفع نقداً عند استلام الطلب.",
      active: true,
    },
    {
      code: "bank_transfer",
      label: "تحويل بنكي",
    desc: "حوّل المبلغ ثم ارفع صورة الإيصال.",
      requiresReceipt: true,
      active: true,
    },
  ] satisfies PaymentMethodRow[],
  freeShippingThreshold: 25,
  bankAccount: {
    bankName: "بنك مسقط",
    accountName: "شركة الدايركسون للتجارة",
    accountNumber: "0301-234567-001",
    iban: "OM45BOMR0301234567001",
  },
};

export const FREE_SHIPPING_THRESHOLD = settings.freeShippingThreshold;
export const FAST_DELIVERY_FEE = settings.deliveryMethods.find((d) => d.code === "fast")?.fee ?? 2.5;

/** Gaming hub subcategories (→ `subcategories` table — قابلة للتعديل من قاعدة البيانات) */
export const gamingSubs: SubcategoryRow[] = [
  { slug: "gaming-pcs", parent: "gaming", name: "Gaming PCs", nameAr: "أجهزة ألعاب", img: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80", active: true, sortOrder: 1 },
  { slug: "gaming-laptops", parent: "gaming", name: "Gaming Laptops", nameAr: "لابتوبات ألعاب", img: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=900&q=80", active: true, sortOrder: 2 },
  { slug: "gaming-monitors", parent: "gaming", name: "Gaming Monitors", nameAr: "شاشات ألعاب", img: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80", active: true, sortOrder: 3 },
  { slug: "gaming-headsets", parent: "gaming", name: "Gaming Headsets", nameAr: "سماعات ألعاب", img: "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=900&q=80", active: true, sortOrder: 4 },
  { slug: "gaming-keyboards", parent: "gaming", name: "Gaming Keyboards", nameAr: "لوحات مفاتيح ألعاب", img: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=900&q=80", active: true, sortOrder: 5 },
  { slug: "gaming-mice", parent: "gaming", name: "Gaming Mice", nameAr: "فأرات ألعاب", img: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=900&q=80", active: true, sortOrder: 6 },
  { slug: "gaming-controllers", parent: "gaming", name: "Gaming Controllers", nameAr: "أذرع تحكم", img: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=900&q=80", active: true, sortOrder: 7 },
  { slug: "racing-wheels", parent: "gaming", name: "Racing Wheels", nameAr: "مقود سباقات", img: "https://images.unsplash.com/photo-1611821064430-0d40291d0f0b?auto=format&fit=crop&w=900&q=80", active: true, sortOrder: 8 },
  { slug: "gaming-accessories", parent: "gaming", name: "Gaming Accessories", nameAr: "ملحقات ألعاب", img: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=900&q=80", active: true, sortOrder: 9 },
  { slug: "gaming-vr", parent: "gaming", name: "VR", nameAr: "واقع افتراضي", img: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&w=900&q=80", active: true, sortOrder: 10 },
  { slug: "gaming-chairs", parent: "gaming", name: "Gaming Chairs", nameAr: "كراسي ألعاب", img: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=900&q=80", active: true, sortOrder: 11 },
];

/* ——— Categories (→ `categories` table) ——— */

export type CategorySlug =
  | "phones"
  | "wearables"
  | "audio"
  | "gaming"
  | "accessories"
  | "charging"
  | "smart-home"
  | "solar-cameras"
  | "car-gps";

export type Category = CategoryRow & {
  tagline: string;
};

export const categories: Category[] = [
  {
    slug: "phones",
    name: "Smartphones",
    nameAr: "الهواتف الذكية",
    tagline: "أحدث الإصدارات بضمان الوكيل",
    img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
    active: true,
    sortOrder: 1,
  },
  {
    slug: "wearables",
    name: "Smartwatches",
    nameAr: "الساعات الذكية",
    tagline: "لياقة وتنبيهات على معصمك",
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
    active: true,
    sortOrder: 2,
  },
  {
    slug: "audio",
    name: "Audio",
    nameAr: "الصوتيات",
    tagline: "سماعات ومكبرات بجودة استوديو",
    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    active: true,
    sortOrder: 3,
  },
  {
    slug: "gaming",
    name: "Gaming",
    nameAr: "الألعاب",
    tagline: "كل ما يحتاجه اللاعب",
    img: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=1200&q=80",
    active: true,
    sortOrder: 4,
  },
  {
    slug: "accessories",
    name: "Accessories",
    nameAr: "الملحقات",
    tagline: "لوحات مفاتيح وفأرات وحقيب",
    img: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1200&q=80",
    active: true,
    sortOrder: 5,
  },
  {
    slug: "charging",
    name: "Charging",
    nameAr: "الشواحن والطاقة",
    tagline: "شحن سريع وبنوك طاقة موثوقة",
    img: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1200&q=80",
    active: true,
    sortOrder: 6,
  },
  {
    slug: "smart-home",
    name: "Smart Home",
    nameAr: "المنزل الذكي",
    tagline: "إضاءة وأمان ومراقبة",
    img: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80",
    active: true,
    sortOrder: 7,
  },
  {
    slug: "solar-cameras",
    name: "Solar Cameras",
    nameAr: "كاميرات شمسية",
    tagline: "مراقبة لاسلكية تعمل بالطاقة الشمسية",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
    active: true,
    sortOrder: 8,
  },
  {
    slug: "car-gps",
    name: "Car GPS",
    nameAr: "GPS السيارات",
    tagline: "قريباً — أجهزة تحديد المواقع للسيارات",
    img: "https://images.unsplash.com/photo-1616763355603-9755a640a287?auto=format&fit=crop&w=1200&q=80",
    active: true,
    sortOrder: 9,
  },
];

/* ——— Products (→ `products` + `product_specs` + `product_images` + `inventory`) ——— */

export type Product = ProductRow & {
  /** DB PATH: مجموعة الصور تأتي من جدول product_images */
  gallery?: string[];
};

export const products: Product[] = [
  /* ——— كاميرات شمسية (بيانات عرض — ستدار من قاعدة البيانات لاحقاً) ——— */
  {
    id: "solar-cam-2k",
    name: "كاميرا شمسية لاسلكية 2K",
    brand: "ALDIRXON Select",
    category: "solar-cameras",
    tags: ["solar", "security-camera", "wireless"],
    price: 49,
    oldPrice: 59,
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=80",
    gallery: ["https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=1000&q=80"],
    desc: "كاميرا مراقبة لاسلكية تعمل بالطاقة الشمسية — تركيب بدون أسلاك، بطارية كبيرة، ومراقبة مباشرة من الهاتف.",
    specs: [
      ["الدقة", "2K (2304×1296)"],
      ["البطارية", "6700mAh + لوح شمسي"],
      ["المقاومة", "IP66"],
      ["الرؤية الليلية", "ملونة حتى 10م"],
      ["الضمان", "سنة"],
    ],
    rating: 4.6,
    reviews: 34,
    sold: 75,
    stock: 18,
    badge: "New",
    isFeatured: true,
  },
  {
    id: "solar-cam-4g",
    name: "كاميرا شمسية 4G للمواقع البعيدة",
    brand: "ALDIRXON Select",
    category: "solar-cameras",
    tags: ["solar", "security-camera", "4g"],
    price: 89,
    img: "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=1000&q=80",
    desc: "كاميرا بشرائح 4G LTE تعمل في المواقع التي لا يوجد فيها إنترنت — مزرعة، مخزن، موقع بناء.",
    specs: [
      ["الاتصال", "4G LTE + بطاقة SIM"],
      ["الدقة", "2K"],
      ["البطارية", "9000mAh + لوح شمسي"],
      ["المقاومة", "IP66"],
      ["الضمان", "سنة"],
    ],
    rating: 4.5,
    reviews: 21,
    sold: 40,
    stock: 12,
    badge: "New",
  },

  /* ——— Smartphones ——— */
  {
    id: "galaxy-s24",
    name: "Samsung Galaxy S24 5G — 256GB",
    brand: "Samsung",
    category: "phones",
    tags: ["samsung", "android", "flagship"],
    price: 269,
    oldPrice: 299,
    img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=80",
    desc: "شاشة Dynamic AMOLED 2X بمعدل 120Hz، كاميرا 50MP مع معالجة ذكية، وأداء ثابت للاستخدام اليومي المكثف. إصدار الشرق الأوسط بضمان الوكيل.",
    specs: [
      ["الشاشة", '6.2" Dynamic AMOLED 2X — 120Hz'],
      ["المعالج", "Exynos 2400"],
      ["الذاكرة", "8GB RAM / 256GB"],
      ["الكاميرا", "50MP + 12MP + 10MP"],
      ["البطارية", "4000mAh — شحن سريع 25W"],
      ["الضمان", "سنة — وكيل الشرق الأوسط"],
    ],
    rating: 4.7,
    reviews: 184,
    sold: 320,
    stock: 14,
    badge: "Best Seller",
    isFeatured: true,
  },
  {
    id: "iphone-15",
    name: "Apple iPhone 15 — 128GB",
    brand: "Apple",
    category: "phones",
    tags: ["apple", "ios", "iphone"],
    price: 329,
    oldPrice: 349,
    img: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80",
    desc: "هاتف آيفون 15 بكاميرا 48MP ومنفذ USB-C وشريحة A16 Bionic — الأداء المعتاد من آبل مع كاميرا محسّنة.",
    specs: [
      ["الشاشة", '6.1" Super Retina XDR'],
      ["المعالج", "A16 Bionic"],
      ["الذاكرة", "128GB"],
      ["الكاميرا", "48MP + 12MP"],
      ["البطارية", "حتى 20 ساعة تشغيل فيديو"],
      ["الضمان", "سنة — وكيل معتمد"],
    ],
    rating: 4.9,
    reviews: 241,
    sold: 410,
    stock: 8,
    badge: "Best Seller",
    isFeatured: true,
  },
  {
    id: "pixel-8a",
    name: "Google Pixel 8a — 128GB",
    brand: "Google",
    category: "phones",
    tags: ["google", "android", "pixel"],
    price: 189,
    img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=80",
    desc: "كاميرا ذكية بمعالجة Google المميزة، تحديثات 7 سنوات، وتصميم عملي بسعر مناسب.",
    specs: [
      ["الشاشة", '6.1" OLED — 120Hz'],
      ["المعالج", "Google Tensor G3"],
      ["الذاكرة", "8GB / 128GB"],
      ["الكاميرا", "64MP + 13MP"],
      ["البطارية", "4492mAh"],
      ["الضمان", "سنة"],
    ],
    rating: 4.6,
    reviews: 96,
    sold: 120,
    stock: 21,
    isFeatured: true,
  },
  {
    id: "redmi-note-13",
    name: "Xiaomi Redmi Note 13 Pro — 256GB",
    brand: "Xiaomi",
    category: "phones",
    tags: ["xiaomi", "android", "budget"],
    price: 119,
    oldPrice: 139,
    img: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80",
    desc: "شاشة AMOLED 120Hz وكاميرا 200MP بسعر اقتصادي — أفضل قيمة في فئته.",
    specs: [
      ["الشاشة", '6.67" AMOLED — 120Hz'],
      ["المعالج", "Snapdragon 7s Gen 2"],
      ["الذاكرة", "8GB / 256GB"],
      ["الكاميرا", "200MP OIS"],
      ["البطارية", "5100mAh — 67W"],
      ["الضمان", "سنة"],
    ],
    rating: 4.5,
    reviews: 152,
    sold: 280,
    stock: 30,
    badge: "Sale",
  },

  /* ——— Smartwatches ——— */
  {
    id: "watch-s9",
    name: "Apple Watch Series 9 — 45mm",
    brand: "Apple",
    category: "wearables",
    tags: ["apple", "smartwatch", "fitness"],
    price: 219,
    oldPrice: 239,
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
    desc: "شاشة Always-On بسطوع 2000 nits، إيماءة النقر المزدوج، وتتبع صحي شامل بدقة آبل المعروفة.",
    specs: [
      ["الشاشة", "45mm Retina LTPO — 2000 nits"],
      ["الشرائح", "S9 SiP"],
      ["البطارية", "18 ساعة — شحن سريع"],
      ["المقاومة", "50 متر — WR50"],
      ["المستشعرات", "ECG، أكسجين الدم، الحرارة"],
      ["الضمان", "سنة"],
    ],
    rating: 4.8,
    reviews: 167,
    sold: 260,
    stock: 11,
    badge: "Best Seller",
    isFeatured: true,
  },
  {
    id: "watch-gw6",
    name: "Samsung Galaxy Watch 6 — 44mm",
    brand: "Samsung",
    category: "wearables",
    tags: ["samsung", "smartwatch", "fitness"],
    price: 129,
    oldPrice: 149,
    img: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1000&q=80",
    desc: "دوران إطار مريح، تتبع نوم متقدم، وتوافق ممتاز مع هواتف أندرويد.",
    specs: [
      ["الشاشة", "44mm Super AMOLED"],
      ["المعالج", "Exynos W930"],
      ["البطارية", "425mAh"],
      ["المستشعرات", "BioActive — 3 في 1"],
      ["الضمان", "سنة"],
    ],
    rating: 4.5,
    reviews: 88,
    sold: 140,
    stock: 17,
  },

  /* ——— Audio ——— */
  {
    id: "sony-wh1000xm5",
    name: "Sony WH-1000XM5 Wireless ANC",
    brand: "Sony",
    category: "audio",
    tags: ["sony", "headphones", "anc"],
    price: 179,
    oldPrice: 205,
    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80",
    gallery: ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1000&q=80"],
    desc: "أفضل إلغاء ضجيج في فئته، صوت Hi-Res مع LDAC، وراحة مثالية للسفر والعمل الطويل.",
    specs: [
      ["المعالج", "V1 + QN1 مزدوج"],
      ["إلغاء الضجيج", "ANC تكيفي مع 8 مايك"],
      ["البطارية", "30 ساعة — شحن 3 دقائق = 3 ساعات"],
      ["الصوت", "Hi-Res / LDAC / DSEE"],
      ["المكالمات", "4 مايك beamforming"],
      ["الضمان", "سنة"],
    ],
    rating: 4.9,
    reviews: 312,
    sold: 540,
    stock: 6,
    badge: "Best Seller",
    isFeatured: true,
  },
  {
    id: "anker-liberty-4",
    name: "Anker Soundcore Liberty 4 NC",
    brand: "Anker",
    category: "audio",
    tags: ["anker", "earbuds", "anc"],
    price: 39.9,
    oldPrice: 49,
    img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1000&q=80",
    desc: "إلغاء ضجيج 98.5% وصوت Hi-Res بسعر صغير — اختيارنا الأول في الأيربودز الاقتصادية.",
    specs: [
      ["إلغاء الضجيج", "ANC تكيفي 2.0"],
      ["البطارية", "10 ساعات + 40 بالعلبة"],
      ["الشحن", "USB-C + لاسلكي"],
      ["البلوتوث", "5.3 — أزواج متعددة"],
      ["الضمان", "18 شهر"],
    ],
    rating: 4.6,
    reviews: 203,
    sold: 380,
    stock: 25,
    badge: "Sale",
    isFeatured: true,
  },
  {
    id: "jbl-flip6",
    name: "JBL Flip 6 Portable Speaker",
    brand: "JBL",
    category: "audio",
    tags: ["jbl", "speaker", "portable"],
    price: 54.5,
    oldPrice: 62,
    img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1000&q=80",
    desc: "صوت JBL Pro مع باس عميق، مقاومة IP67 للماء والغبار، و12 ساعة تشغيل — رفيق النزهات.",
    specs: [
      ["الصوت", "20W — JBL Pro Sound"],
      ["المقاومة", "IP67"],
      ["البطارية", "12 ساعة"],
      ["البلوتوث", "5.1 — PartyBoost"],
      ["الضمان", "سنة"],
    ],
    rating: 4.7,
    reviews: 145,
    sold: 210,
    stock: 19,
    badge: "Sale",
  },
  {
    id: "pixel-buds-pro",
    name: "Google Pixel Buds Pro",
    brand: "Google",
    category: "audio",
    tags: ["google", "earbuds", "anc"],
    price: 89,
    img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1000&q=80",
    desc: "صوت متوازن مع ANC وتكامل سلس مع أجهزة Google.",
    specs: [
      ["إلغاء الضجيج", "Silent Seal"],
      ["البطارية", "7 ساعات + 23 بالعلبة"],
      ["الشحن", "لاسلكي Qi"],
      ["الضمان", "سنة"],
    ],
    rating: 4.4,
    reviews: 74,
    sold: 90,
    stock: 22,
    isNew: true,
  },

  /* ——— Gaming ——— */
  {
    id: "logi-g502",
    name: "Logitech G502 X Lightspeed",
    brand: "Logitech",
    category: "accessories",
    subcategory: "gaming-mice",
    tags: ["gaming", "mouse", "wireless"],
    price: 62,
    oldPrice: 72,
    img: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1000&q=80",
    desc: "أسطورة ألعاب FPS بحساس HERO 25K وأزرار هجينة — دقة وثبات بدون أي تأخير.",
    specs: [
      ["الحساس", "HERO 25K — 25600 DPI"],
      ["الاتصال", "Lightspeed لاسلكي / USB-C"],
      ["الأزرار", "13 — هجينة قابلة للبرمجة"],
      ["الوزن", "89 جرام"],
      ["البطارية", "حتى 140 ساعة"],
      ["الضمان", "سنتان"],
    ],
    rating: 4.8,
    reviews: 276,
    sold: 460,
    stock: 9,
    badge: "Best Seller",
    isFeatured: true,
  },
  {
    id: "dualsense",
    name: "Sony DualSense Wireless Controller",
    brand: "Sony",
    category: "accessories",
    subcategory: "gaming-controllers",
    tags: ["gaming", "controller", "playstation"],
    price: 42,
    oldPrice: 49,
    img: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=1000&q=80",
    desc: "يد تحكم PlayStation الرسمية: تغذية راجعة لمسية هابتيك ومشغلات تكيفية.",
    specs: [
      ["الاهتزاز", "Haptic feedback متقدم"],
      ["المشغلات", "تكيفية ديناميكية"],
      ["الميكروفون", "مدمج مع إلغاء ضجيج"],
      ["البطارية", "1560mAh"],
      ["التوافق", "PS5 / PC / Mobile"],
      ["الضمان", "سنة"],
    ],
    rating: 4.9,
    reviews: 358,
    sold: 610,
    stock: 23,
    badge: "Best Seller",
    isFeatured: true,
  },
  {
    id: "hyperx-cloud3",
    name: "HyperX Cloud III Gaming Headset",
    brand: "HyperX",
    category: "accessories",
    subcategory: "gaming-headsets",
    tags: ["gaming", "headset", "dts"],
    price: 69,
    oldPrice: 79,
    img: "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=1000&q=80",
    desc: "راحة أسطورية مع صوت محيطي DTS وميكروفون مرشح للضجيج — الاختيار الأول للاعبين الجادين.",
    specs: [
      ["الصوت", "53mm — DTS Spatial Audio"],
      ["الميكروفون", "قابل للفصل — 10mm"],
      ["الراحة", "وسائد ذاكرة فائقة النعومة"],
      ["التوصيل", "USB-C / 3.5mm"],
      ["الضمان", "سنتان"],
    ],
    rating: 4.7,
    reviews: 189,
    sold: 290,
    stock: 12,
    badge: "Sale",
    isFeatured: true,
  },
  {
    id: "logi-gpro-x",
    name: "Logitech G Pro X Superlight 2",
    brand: "Logitech",
    category: "accessories",
    subcategory: "gaming-mice",
    tags: ["gaming", "mouse", "esports"],
    price: 89,
    img: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1000&q=80",
    desc: "60 جراماً فقط مع Lightspeed وحساس HERO 2 — فأرة بطولات المحترفين.",
    specs: [
      ["الوزن", "60 جرام"],
      ["الحساس", "HERO 2 — 32000 DPI"],
      ["الاتصال", "Lightspeed — 2K Hz polling"],
      ["المفاتيح", "LIGHTFORCE هجينة"],
      ["الضمان", "سنتان"],
    ],
    rating: 4.8,
    reviews: 121,
    sold: 160,
    stock: 7,
    isNew: true,
  },
  {
    id: "keychron-k8",
    name: "Keychron K8 Pro Mechanical",
    brand: "Keychron",
    category: "accessories",
    subcategory: "gaming-keyboards",
    tags: ["gaming", "keyboard", "mechanical"],
    price: 78,
    img: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1000&q=80",
    desc: "لوحة ميكانيكية Hot-swap بجسم ألمنيوم واتصال ثلاثي — للعمل واللعب.",
    specs: [
      ["التخطيط", "TKL — 87 مفتاح"],
      ["المفاتيح", "Gateron G Pro Brown — Hot-swap"],
      ["الجسم", "ألمنيوم مع إضاءة خلفية"],
      ["الاتصال", "Bluetooth / 2.4GHz / USB-C"],
      ["الضمان", "سنة"],
    ],
    rating: 4.6,
    reviews: 98,
    sold: 130,
    stock: 10,
    isNew: true,
  },
  {
    id: "steelseries-qck",
    name: "SteelSeries QcK Heavy XXL",
    brand: "SteelSeries",
    category: "accessories",
    subcategory: "gaming-accessories",
    tags: ["gaming", "mousepad", "esports"],
    price: 18.5,
    oldPrice: 22,
    img: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1000&q=80",
    desc: "السجادة القياسية في عالم eSports: قاعدة ثقيلة وسطح ناعم متوازن.",
    specs: [
      ["المقاس", "900 × 400 مم — 6 مم سماكة"],
      ["السطح", "قماش مصقول"],
      ["القاعدة", "مطاط ثقيل مانع للانزلاق"],
      ["الحواف", "مخيطة"],
    ],
    rating: 4.8,
    reviews: 210,
    sold: 340,
    stock: 28,
    badge: "Sale",
  },

  /* ——— Accessories ——— */
  {
    id: "logi-mx-master",
    name: "Logitech MX Master 3S",
    brand: "Logitech",
    category: "accessories",
    tags: ["logitech", "mouse", "productivity"],
    price: 68,
    oldPrice: 76,
    img: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1000&q=80",
    desc: "أفضل فأرة إنتاجية: تمرير 1000 سطر/ثانية، نقرات صامتة، وتعدد أجهزة بسلاسة.",
    specs: [
      ["الحساس", "8000 DPI — يعمل على الزجاج"],
      ["التمرير", "MagSpeed 1000 سطر/ث"],
      ["النقرات", "Quiet Clicks"],
      ["الاتصال", "Bluetooth + Logi Bolt"],
      ["البطارية", "70 يوم — شحن سريع"],
      ["الضمان", "سنة"],
    ],
    rating: 4.9,
    reviews: 234,
    sold: 350,
    stock: 15,
    badge: "Best Seller",
    isFeatured: true,
  },
  {
    id: "keychron-k3",
    name: "Keychron K3 Ultra-slim",
    brand: "Keychron",
    category: "accessories",
    tags: ["keychron", "keyboard", "slim"],
    price: 52,
    img: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?auto=format&fit=crop&w=1000&q=80",
    desc: "لوحة ميكانيكية نحيفة (75%) بمفاتيح Low-profile — مكتبي أنيق.",
    specs: [
      ["التخطيط", "75% — 84 مفتاح"],
      ["النوع", "Low-profile Optical"],
      ["الاتصال", "Bluetooth 5.1 / USB-C"],
      ["الإضاءة", "خلفية بيضاء"],
      ["الضمان", "سنة"],
    ],
    rating: 4.5,
    reviews: 67,
    sold: 85,
    stock: 16,
    isNew: true,
  },
  {
    id: "samsung-t7",
    name: "Samsung T7 Shield 1TB SSD",
    brand: "Samsung",
    category: "accessories",
    tags: ["samsung", "ssd", "storage"],
    price: 74,
    oldPrice: 85,
    img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1000&q=80",
    desc: "قرص خارجي بسرعة 1050MB/s ومقاومة IP65 — مكتبك في جيبك.",
    specs: [
      ["السعة", "1TB NVMe"],
      ["السرعة", "حتى 1050 MB/s"],
      ["المقاومة", "IP65 — سقوط 3م"],
      ["التوافق", "USB-C / USB-A / الهواتف"],
      ["الضمان", "3 سنوات"],
    ],
    rating: 4.8,
    reviews: 176,
    sold: 240,
    stock: 13,
    badge: "Sale",
  },

  /* ——— Charging ——— */
  {
    id: "anker-737",
    name: "Anker 737 Power Bank 24000mAh 140W",
    brand: "Anker",
    category: "charging",
    tags: ["anker", "powerbank", "fast-charge"],
    price: 89,
    oldPrice: 99,
    img: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80",
    desc: "بنك طاقة يشحن اللابتوب: 140W مع شاشة ذكية — طاقة كاملة في اليد.",
    specs: [
      ["السعة", "24000mAh / 86.4Wh"],
      ["الإخراج", "140W USB-C PD 3.1"],
      ["الشاشة", "PowerIQ 4.0 ذكية"],
      ["المنافذ", "2× USB-C + 1× USB-A"],
      ["الضمان", "18 شهر"],
    ],
    rating: 4.8,
    reviews: 198,
    sold: 300,
    stock: 18,
    badge: "Sale",
    isFeatured: true,
  },
  {
    id: "anker-gan-65",
    name: "Anker 735 Charger GaNPrime 65W",
    brand: "Anker",
    category: "charging",
    tags: ["anker", "charger", "gan"],
    price: 24.9,
    oldPrice: 29,
    img: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1000&q=80",
    desc: "شاحن صغير بقوة لابتوب: 65W عبر ثلاث منافذ بتقنية GaN.",
    specs: [
      ["القوة", "65W إجمالي"],
      ["المنافذ", "2× USB-C + USB-A"],
      ["التقنية", "GaNPrime — حجم أصغر 50%"],
      ["الضمان", "18 شهر"],
    ],
    rating: 4.7,
    reviews: 165,
    sold: 260,
    stock: 32,
    badge: "Sale",
  },
  {
    id: "ugreen-6in1",
    name: "UGREEN Revodok 6-in-1 USB-C Hub",
    brand: "UGREEN",
    category: "accessories",
    tags: ["ugreen", "hub", "usb-c"],
    price: 19.9,
    img: "https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=1000&q=80",
    desc: "ستة منافذ في جسم ألمنيوم واحد — مكتبك المتنقل.",
    specs: [
      ["المنافذ", "HDMI 4K / 3× USB 3.0 / SD+TF"],
      ["الشحن", "PD 100W تمريري"],
      ["الجسم", "ألمنيوم"],
      ["الضمان", "18 شهر"],
    ],
    rating: 4.6,
    reviews: 88,
    sold: 140,
    stock: 24,
    isNew: true,
  },
  {
    id: "belkin-3in1",
    name: "Belkin 3-in-1 Wireless Charger",
    brand: "Belkin",
    category: "charging",
    tags: ["belkin", "wireless-charger", "magsafe"],
    price: 69,
    img: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1000&q=80",
    desc: "شحن لاسلكي لهاتف وساعة وإيربودز في محطة واحدة أنيقة.",
    specs: [
      ["القوة", "15W للهاتف + 5W للساعة"],
      ["التوافق", "Magsafe / Qi2"],
      ["التصميم", "قابل للطي — سفر"],
      ["الضمان", "سنتان"],
    ],
    rating: 4.5,
    reviews: 71,
    sold: 95,
    stock: 20,
  },

  /* ——— Smart Home ——— */
  {
    id: "nest-cam",
    name: "Google Nest Cam (Battery)",
    brand: "Google",
    category: "smart-home",
    tags: ["google", "security-camera", "wireless"],
    price: 109,
    img: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=1000&q=80",
    desc: "كاميرا أمنية لاسلكية بذكاء Google: تمييز الأشخاص عن الحيوانات، وتسجيل محلي بدون رسوم.",
    specs: [
      ["الدقة", "1080p HDR — رؤية 10م"],
      ["البطارية", "قابلة للشحن — لاسلكية"],
      ["الذكاء", "تمييز أشخاص/حيوانات/مركبات"],
      ["التخزين", "3 ساعات محلي مجاناً"],
      ["الضمان", "سنة"],
    ],
    rating: 4.5,
    reviews: 62,
    sold: 80,
    stock: 9,
    isNew: true,
  },
  {
    id: "hue-bulb",
    name: "Philips Hue White & Color Starter",
    brand: "Philips",
    category: "smart-home",
    tags: ["philips", "smart-light", "hue"],
    price: 89,
    oldPrice: 99,
    img: "https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=1000&q=80",
    desc: "بداية الإضاءة الذكية: 3 مصابيح 16 مليون لون مع Bridge.",
    specs: [
      ["المصابيح", "3× E27 — 16M لون"],
      ["المحور", "Bridge مضمّن — Zigbee"],
      ["التكامل", "Alexa / Google / HomeKit"],
      ["الضمان", "سنتان"],
    ],
    rating: 4.7,
    reviews: 104,
    sold: 150,
    stock: 14,
    badge: "Sale",
  },
  {
    id: "aqara-hub",
    name: "Aqara Hub M2 + Door Sensor",
    brand: "Aqara",
    category: "smart-home",
    tags: ["aqara", "smart-hub", "zigbee"],
    price: 44,
    img: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80",
    desc: "مركز منزل ذكي مع مستشعر باب: أتمتة كاملة بدون أسلاك.",
    specs: [
      ["الاتصال", "Zigbee 3.0 + IR"],
      ["التكامل", "HomeKit / Google / Alexa"],
      ["المستشعرات", "باب + حركة قابلة للتوسيع"],
      ["الضمان", "سنة"],
    ],
    rating: 4.4,
    reviews: 45,
    sold: 60,
    stock: 26,
    isNew: true,
  },
  {
    id: "sonos-era",
    name: "Sonos Era 100 Smart Speaker",
    brand: "Sonos",
    category: "smart-home",
    tags: ["sonos", "speaker", "alexa"],
    price: 169,
    img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1000&q=80",
    desc: "صوت استوديو عملي مع Alexa — مكبر واحد يملأ الغرفة بوضوح استثنائي.",
    specs: [
      ["المكبرات", "2× تويتر + ووفر"],
      ["الذكاء", "Alexa مدمجة"],
      ["الاتصال", "Wi-Fi 6 + Bluetooth"],
      ["الضمان", "سنة"],
    ],
    rating: 4.8,
    reviews: 92,
    sold: 110,
    stock: 10,
  },
];

/* ——— Derived collections ——— */

export const featuredProducts = products.filter((p) => p.isFeatured);
export const newArrivals = products.filter((p) => p.isNew);
export const bestSellers = [...products].sort((a, b) => b.sold - a.sold).slice(0, 8);

/* المنتجات تُصنَّف من قاعدة البيانات (category/subcategory) — لا فلترة بالبراند */
export const gamingProducts = products.filter((p) => p.category === "gaming");
export const featuredGear = gamingProducts.filter((p) => p.badge);
export const gamingNewArrivals = gamingProducts.filter((p) => p.isNew);
export const topPicks = [...gamingProducts].sort((a, b) => b.rating - a.rating).slice(0, 4);

/* Setup bundles for the Gaming page */
export const setupBundles: { id: string; name: string; items: string[] }[] = [
  {
    id: "starter",
    name: "SETUP — البداية الصحيحة",
    items: ["dualsense", "logi-g502", "steelseries-qck"],
  },
  {
    id: "competitive",
    name: "SETUP — تنافسي كامل",
    items: ["hyperx-cloud3", "keychron-k8", "logi-gpro-x", "steelseries-qck"],
  },
  {
    id: "streamer",
    name: "SETUP — صناعة المحتوى",
    items: ["sony-wh1000xm5", "ugreen-6in1", "sonos-era"],
  },
];

/* ——— Helpers ——— */

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function relatedProducts(p: Product): Product[] {
  const same = products.filter((x) => x.id !== p.id && x.category === p.category);
  const rest = products.filter((x) => x.id !== p.id && x.category !== p.category);
  return [...same, ...rest].slice(0, 4);
}

export function categoryName(slug: string): string {
  return categories.find((c) => c.slug === slug)?.nameAr ?? slug;
}

export function categoryExists(slug: string): boolean {
  return categories.some((c) => c.slug === slug);
}

export function discountPercent(p: Product): number {
  return p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
}

export function formatPrice(value: number): string {
  return `${value.toFixed(3)} ر.ع`;
}

export function soldLabel(sold: number): string {
  return sold >= 1000 ? `${(sold / 1000).toFixed(1)}k+ مبيع` : `${sold}+ مبيع`;
}

export function inStockLabel(stock: number): string {
  if (stock === 0) return "نفد من المخزون";
  if (stock <= 5) return `آخر ${stock} قطع`;
  return "متوفر";
}

export function categoryHref(slug: string): string {
  return `/shop?cat=${slug}`;
}
