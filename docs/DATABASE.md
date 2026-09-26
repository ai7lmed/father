# ALDIRXON — مخطط قاعدة البيانات وخطة الربط

هذا المستند هو العقد بين واجهة ALDIRXON وقاعدة البيانات المستقبلية.
كل الأنواع في `src/lib/db/schema.ts` تقابل الجداول أدناه حرفياً، وكل
قراءة/كتابة تمر عبر واجهة واحدة: `QavenStore` في `src/lib/db/store.ts`.

> عند الربط: لا يُعدَّل أي مكوّن واجهة — يُستبدل محول التخزين فقط.

---

## 1. جداول النظام التجاري

### customers — العملاء
```sql
CREATE TABLE customers (
  id          TEXT PRIMARY KEY,            -- ULID/UUID
  phone       TEXT NOT NULL UNIQUE,        -- 8 أرقام عُماني بلا رمز دولة
  name        TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### otp_codes — رموز التحقق
```sql
CREATE TABLE otp_codes (
  id         TEXT PRIMARY KEY,
  phone      TEXT NOT NULL,
  code_hash  TEXT NOT NULL,                -- hash في الإنتاج
  expires_at TIMESTAMPTZ NOT NULL,
  consumed   BOOLEAN NOT NULL DEFAULT false,
  attempts   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_phone ON otp_codes(phone);
-- ملاحظة: المرسل (SMS provider) يعمل على السيرفر فقط.
-- devCode الحالي موجود في LocalStore لأغراض العرض فقط.
```

### sessions — جلسات الدخول
```sql
CREATE TABLE sessions (
  token       TEXT PRIMARY KEY,            -- random 32B, httpOnly cookie
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
);
```

### addresses — عناوين العملاء
```sql
CREATE TABLE addresses (
  id          TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,               -- "المنزل"، "العمل"
  full_name   TEXT NOT NULL,
  phone       TEXT NOT NULL,
  city        TEXT NOT NULL,               -- الولاية
  address     TEXT NOT NULL,               -- تفاصيل التوصيل
  notes       TEXT,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_addresses_customer ON addresses(customer_id);
-- قيد: عنوان افتراضي واحد لكل عميل (يُعالج في طبقة التطبيق كما في LocalStore)
```

---

## 2. جداول الكتالوج

### categories — التصنيفات
```sql
CREATE TABLE categories (
  slug       TEXT PRIMARY KEY,             -- phones, solar-cameras, car-gps…
  name       TEXT NOT NULL,                -- اسم لاتيني/تجاري
  name_ar    TEXT NOT NULL,
  tagline    TEXT,
  img        TEXT NOT NULL,                -- رابط الصورة
  active     BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0
);
-- التصنيفات الحالية تسقى مباشرة من products.ts (9 تصنيفات، شاملة
-- solar-cameras و car-gps — الأخير بلا منتجات حتى إرسال مواصفاته).
```

### products — المنتجات
```sql
CREATE TABLE products (
  id         TEXT PRIMARY KEY,             -- SKU: galaxy-s24, solar-cam-2k…
  name       TEXT NOT NULL,
  brand      TEXT NOT NULL,
  category   TEXT NOT NULL REFERENCES categories(slug),
  price      NUMERIC(10,3) NOT NULL,       -- OMR بثلاث خانات عشرية
  old_price  NUMERIC(10,3),
  desc       TEXT NOT NULL,
  rating     NUMERIC(2,1) NOT NULL DEFAULT 0,
  reviews    INT NOT NULL DEFAULT 0,
  sold       INT NOT NULL DEFAULT 0,
  badge      TEXT CHECK (badge IN ('New','Best Seller','Limited','Sale')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_new     BOOLEAN NOT NULL DEFAULT false,
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON products(category);
```

### product_images — صور المنتج (المعرض)
```sql
CREATE TABLE product_images (
  id         TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  alt        TEXT,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_images_product ON product_images(product_id);
-- الصورة الأولى حسب sort_order = الصورة الرئيسية (products.img تقابلها)
```

### product_specs — مواصفات المنتج (مفتاح/قيمة)
```sql
CREATE TABLE product_specs (
  id         TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  spec_key   TEXT NOT NULL,                -- "الدقة"
  spec_value TEXT NOT NULL,                -- "2K (2304×1296)"
  sort_order INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_specs_product ON product_specs(product_id);
```

### inventory — المخزون
```sql
CREATE TABLE inventory (
  product_id TEXT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  qty        INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 5,  -- "آخر N قطع"
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- حالات العرض: qty=0 → "نفد"، qty<=threshold → "آخر N قطع"، غير ذلك "متوفر"
```

---

## 3. جداول الطلبات

### delivery_methods — طرق التوصيل
```sql
CREATE TABLE delivery_methods (
  code   TEXT PRIMARY KEY,                 -- standard | fast
  label  TEXT NOT NULL,
  desc   TEXT NOT NULL,
  fee    NUMERIC(10,3) NOT NULL,           -- standard: 0, fast: 2.500
  eta    TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO delivery_methods VALUES
  ('standard','التوصيل العادي','3 – 5 أيام عمل داخل عُمان',0,'3 – 5 أيام عمل',true),
  ('fast','التوصيل السريع','خلال 24 – 48 ساعة',2.500,'24 – 48 ساعة',true);
```

### payment_methods — طرق الدفع
```sql
CREATE TABLE payment_methods (
  code             TEXT PRIMARY KEY,       -- cod | bank_transfer
  label            TEXT NOT NULL,
  desc             TEXT NOT NULL,
  requires_receipt BOOLEAN NOT NULL DEFAULT false,
  active           BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO payment_methods VALUES
  ('cod','الدفع عند الاستلام','الدفع نقداً عند استلام الطلب.',false,true),
  ('bank_transfer','تحويل بنكي','حوّل المبلغ ثم ارفع صورة الإيصال.',true,true);
```

### orders — الطلبات
```sql
CREATE TABLE orders (
  id              TEXT PRIMARY KEY,        -- QVN-XXXXXX
  customer_id     TEXT REFERENCES customers(id) ON DELETE SET NULL,  -- NULL = ضيف
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  subtotal        NUMERIC(10,3) NOT NULL,
  delivery_method TEXT NOT NULL REFERENCES delivery_methods(code),
  delivery_fee    NUMERIC(10,3) NOT NULL,
  total           NUMERIC(10,3) NOT NULL,
  payment_method  TEXT NOT NULL REFERENCES payment_methods(code),
  -- لقطة العنوان وقت الطلب (لا FK — العنوان قد يتغير لاحقاً)
  ship_full_name  TEXT NOT NULL,
  ship_phone      TEXT NOT NULL,
  ship_city       TEXT NOT NULL,
  ship_address    TEXT NOT NULL,
  ship_notes      TEXT,
  placed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_customer ON orders(customer_id);
```

### order_items — أصناف الطلب
```sql
CREATE TABLE order_items (
  id         TEXT PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  name       TEXT NOT NULL,                -- لقطة اسم المنتج وقت الطلب
  qty        INT NOT NULL,
  unit_price NUMERIC(10,3) NOT NULL        -- لقطة السعر وقت الطلب
);
CREATE INDEX idx_items_order ON order_items(order_id);
```

### bank_transfer_receipts — إيصالات التحويل
```sql
CREATE TABLE bank_transfer_receipts (
  id         TEXT PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,               -- مفتاح الملف في Object Storage (S3/R2)
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- المحول المحلي يخزن dataURL في receipts[].dataUrl — في الإنتاج يُرفع
-- الملف إلى Storage ويُخزن المفتاح فقط.
```

### settings — إعدادات المتجر
```sql
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,                  -- 'store' | 'bankAccount' | 'freeShippingThreshold'…
  value JSONB NOT NULL
);
-- freeShippingThreshold = 25 (ر.ع) — العادي مجاني دائماً في المنطق الحالي؛
-- هذا الحقل لعرض شريط "مؤهل للتوصيل المجاني" وحسابات مستقبلية.
```

---

## 4. تدفقات أساسية

### تسجيل الدخول بـ OTP
```
1. sendOtp(phone)        → تحقق من صيغة 9XXXXXXX → إدراج otp_codes (TTL 10د)
                         → إرسال SMS (server-side)
2. verifyOtp(phone,code) → فحص + استهلاك الرمز
                         → upsert customers بالهاتف
                         → إنشاء sessions → httpOnly cookie
3. currentCustomer()     → قراءة الجلسة → بيانات العميل
```

### إنشاء طلب
```
createOrder({ customer, address, items, deliveryMethod, paymentMethod, receipt })
  → subtotal من unit_price × qty (لقطة أسعار)
  → delivery_fee من delivery_methods (standard=0، fast=2.5)
  → total = subtotal + delivery_fee
  → status: cod → 'confirmed' | bank_transfer → 'pending'
  → إدراج orders + order_items (+ receipts إن وجد إيصال)
  → خصم inventory.qty (transaction)
```

### تدفق الإيصال البنكي
```
العميل يرفع الصورة في Checkout → upload API → Object Storage
  → storage_key → bank_transfer_receipts
لوحة إدارة لاحقاً: مراجعة الإيصال → orders.status = 'confirmed'
```

---

## 5. خطة التبديل (خطوات التنفيذ لاحقاً)

1. **اختيار الطبقة:** Next.js API routes + Prisma/Drizzle (أو Supabase مباشرة).
2. **كتابة `ApiStore implements QavenStore`** في `src/lib/db/store.ts` — نفس
   التواقيع تماماً، لكن كل دالة تستدعي endpoint:
   | QavenStore | Endpoint مقترح |
   |---|---|
   | sendOtp | `POST /api/auth/otp/send` |
   | verifyOtp | `POST /api/auth/otp/verify` |
   | currentCustomer | `GET /api/me` |
   | updateCustomer | `PATCH /api/me` |
   | listAddresses | `GET /api/me/addresses` |
   | saveAddress | `PUT /api/me/addresses/:id` |
   | deleteAddress | `DELETE /api/me/addresses/:id` |
   | createOrder | `POST /api/orders` |
   | getOrder | `GET /api/orders/:id` |
   | listOrders | `GET /api/me/orders` |
3. **تبديل سطر واحد** في `getStore()`:
   ```ts
   // store = new LocalStore();   // قبل
   store = new ApiStore();       // بعد
   ```
4. **الكتالوج:** تحويل `products.ts` إلى server fetch من `products` +
   `product_specs` + `product_images` + `inventory` (أو عبر
   `GET /api/products`) — الأنواع (schema.ts) تبقى كما هي.
5. **الجلسة:** انتقال من localStorage إلى httpOnly cookie يعيده
   `POST /api/auth/otp/verify`.
6. **SMS:** ربط مزوّد (Unifonic / Twilio) في endpoint الإرسال — وإزالة
   `devCode` من الاستجابة.

### ما هو جاهز بالفعل
- كل الأنواع (schema.ts) = عقود الجداول أعلاه.
- واجهة `QavenStore` كاملة ومستخدمة في Checkout/Account/OrderSuccess.
- منطق التوصيل/الدفع يُقرأ من `settings.deliveryMethods` و
  `settings.paymentMethods` — لن يتغير عند ربط الجداول.
- التصنيفات (بما فيها solar-cameras وcar-gps) تحمل `sortOrder/active`
  جاهزة لعرض قابل للإدارة من قاعدة البيانات.
