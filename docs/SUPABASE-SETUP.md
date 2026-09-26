# QAVEN — دليل ربط Supabase خطوة بخطوة

> نفّذ هذه الخطوات بالترتيب. المدة الكلية: ~20 دقيقة.
> الكود في المشروع **جاهز بالكامل** — لا حاجة لأي تعديل برمجي بعد الآن.

---

## الخطوة 1 — إنشاء المشروع (5 دقائق)

1. افتح [supabase.com](https://supabase.com) → **Sign in** (حساب GitHub أو email)
2. **New project**:
   - Name: `qaven`
   - Database Password: أنشئ كلمة قوية واحفظها في مكان آمن (لن تُعرض مجدداً)
   - Region: **Frankfurt (eu-central-1)** — الأقرب لعُمان مع توفر الخدمة
   - Plan: Free كافٍ للبداية
3. انتظر حتى تكتمل التهيئة (~2 دقيقة)

## الخطوة 2 — المفاتيح (دقيقة واحدة)

من **Project Settings → API**:

| القيمة | من أين | إلى أين |
|---|---|---|
| **Project URL** | صفحة API → Project URL | `.env.local` → `NEXT_PUBLIC_SUPABASE_URL` |
| **anon / publishable key** | نفس الصفحة → Project API keys → `anon` | `.env.local` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role key** ⚠️ | نفس الصفحة → `service_role` (اضغط Reveal) | `.env.local` → `SUPABASE_SERVICE_ROLE_KEY` |

وفي `.env.local` عدّل أيضاً:
```
NEXT_PUBLIC_SITE_URL=http://localhost:4321
```

### قواعد الأمان
- ✅ `NEXT_PUBLIC_*` — تُعرض في المتصفح، محمية بـ RLS، لا خطر
- ⛔ `service_role` — **تتجاوز كل الحمايات**. موجودة فقط في `.env.local` وتُستخدم حصراً في `src/app/api/*` و`src/lib/auth/customers.ts` (خادم)
- ✅ `.gitignore` يستثني `.env*` — لن تُرفع للمستودع
- ✅ القالب `​.env.example` لا يحتوي قيماً حقيقية

---

## الخطوة 3 — قاعدة البيانات (3 دقائق)

1. افتح **SQL Editor** من القائمة الجانبية
2. **New query** → الصور محتوى الملف كاملاً: `docs/supabase-schema.sql`
3. **Run** (أو Ctrl+Enter)
4. تحقق من **Table Editor** — يجب أن ترى 14 جدولاً:
   `customers · categories · subcategories · products · product_images · product_tags · inventory · addresses · orders · order_items · delivery_methods · payment_methods · bank_transfer_receipts · settings`
5. في `delivery_methods` يجب أن ترى: `standard` بـ fee=0 و `fast` بـ fee=2.500

> الملف يُنشئ أيضاً: trigger إنشاء العميل تلقائياً مع كل حساب جديد، وRLS على كل جدول (كل عميل يرى بياناته فقط)، وبذرة التصنيفات الـ 9 + الفرعيّات الـ 11.

---

## الخطوة 4 — تفعيل مزوّدي الدخول (5 دقائق)

### 4أ. Email + Password (مفعّل افتراضياً)
**Authentication → Providers → Email**: تأكد أنها **Enabled**.
- للاختبار المحلي: أوقف **Confirm email** (Settings → Auth → Disable email confirmations) حتى لا تحتاج بريداً حقيقياً. فعّله عند الإطلاق.

### 4ب. Google OAuth (10 دقائق إضافية)
1. افتح [console.cloud.google.com](https://console.cloud.google.com) → **New Project** باسم `qaven`
2. **APIs & Services → OAuth consent screen**:
   - User Type: External → Fill: App name `QAVEN`، support email
   - أضف Scopes: `email`, `profile`, `openid`
   - Test users: أضف بريدك (يلزم حتى نشر التطبيق)
3. **Credentials → Create Credentials → OAuth Client ID**:
   - Type: **Web application**
   - **Authorized redirect URIs** — أضف بالضبط:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     (استبدل `YOUR_PROJECT_REF` بقيمتك من Project URL)
4. انسخ **Client ID** و**Client Secret**
5. في Supabase: **Authentication → Providers → Google** → Enabled → الصق الاثنين → Save

### 4ج. Phone OTP (SMS)
**Authentication → Providers → Phone**: Enabled.
- يطلب **Twilio** (أو Vonage/MessageBird): أنشئ حساباً في [twilio.com](https://www.twilio.com)، اشترِ رقم أو فعّل Trial، وعبّئ في Supabase:
  - Account SID / Auth Token / Service SID
- ⚠️ بدون هذه الخطوة سيعطي الـ OTP خطأ `sms_unavailable` — هذا **متوقع** حتى تضيف حساب Twilio. باقي المزوّدين (Google/Email) يعملون بدونها.
- لاحقاً: في Twilio Verify حدّد طول الرمز **6 أرقام** (افتراضي Supabase هو 6 ✓)

---

## الخطوة 5 — Storage للإيصالات (اختياري الآن)

الافتراضي: الإيصال يُخزن في جدول `bank_transfer_receipts.data_url` (يعمل فوراً).
لترقيته لاحقاً: أنشئ bucket باسم `receipts` (Private) في **Storage**، وأضف سياسات رفع للعميل المصادق. الكود جاهز للحقلين.

---

## الخطوة 6 — التشغيل والاختبار

```bash
npm run dev -- -p 4321
```

### قائمة الاختبار (بالترتيب)
| # | الاختبار | المتوقع |
|---|---|---|
| 1 | `/login` → إنشاء حساب ببريد جديد | رسالة تأكيد (أو دخول مباشر إذا عطّلت Confirm) |
| 2 | تسجيل دخول بنفس البريد + كلمة مرور خاطئة | خطأ "البريد أو كلمة المرور غير صحيحة" |
| 3 | دخول صحيح → `/account` | اسمك وبريدك ظاهران، تبويبا الطلبات والعناوين فارغان |
| 4 | إضافة عنوان في `/account` | يُحفظ ويظهر (تحقق في Table Editor → addresses) |
| 5 | زر Google → شاشة Google → موافقة | عودة للموقع + عميل جديد في customers |
| 6 | OTP برقم 9XXXXXXXX | إذا Twilio غير مربوط: خطأ واضح "خدمة SMS غير مفعّلة" — متوقع |
| 7 | `/shop` → أضف منتج → `/checkout` | بياناتك معبأة تلقائياً من العنوان المحفوظ |
| 8 | اختر توصيل سريع + دفع عند الاستلام → أكد | طلب `QVN-…` في جدول orders + أصنافه في order_items + خصم inventory |
| 9 | `/account → طلباتي` | الطلب ظاهر بحالته |
| 10 | Screenshot: اطلب بتحويل بنكي بدون إيصال | زر التأكيد معطّل حتى ترفع الإيصال |

### التحقق من قاعدة البيانات بعد الطلب
**Table Editor → orders**: صف جديد بـ `customer_id` = حسابك، `delivery_fee` = 0 أو 2.5 فقط، `total` محسوب من أسعار `products` (للتجربة: عدّل سعر منتج في الجدول ثم اطلبه — الإجمالي يتبع DB وليس سعر الواجهة ✓).

---

## استكشاف الأخطاء

| الخطأ | السبب | الحل |
|---|---|---|
| `ENOTFOUND …supabase.co` | Project URL خاطئ أو المشروع متوقف | تحقق من URL، وResume المشروع من اللوحة |
| `Invalid API key` | المفاتيح من مشروع قديم/مختلف | انسخها مجدداً من Project Settings → API |
| `new row violates row-level security` | محاولة كتابة عبر anon key | يجب أن تمر عبر `/api/*` (تستخدم service_role) — لا تستدعِ DB مباشرة من الواجهة |
| Google: `redirect_uri_mismatch` | الـ callback غير مطابق | طابق URI حرفياً مع الخطوة 4ب-3 |
| OTP: `sms_unavailable` | Twilio غير مربوط | الخطوة 4ج |
| الطلب: `db_unavailable` | جدول products فارغ أو SQL لم يُنفذ | أعد تنفيذ `docs/supabase-schema.sql` + أضف منتجات |
