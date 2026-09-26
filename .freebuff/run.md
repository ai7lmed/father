# ALDIRXON — Run doc

بيئة: Windows · npm · Next.js 15 (App Router) · Tailwind 4 · TypeScript

## 1. Reproduce artifacts (fresh checkout)

```bash
npm install
```

- المتطلبات: Node.js 18+.
- ملفات البيئة: أنشئ `.env.local` من القالب الموجود في `.env.local` (Supabase URL + anon key + service role).
  - في هذا الـ worktree الملف موجود. في checkout جديد انسخه من المشروع الأساسي:
    `copy "C:\Users\AMT\Desktop\متجري\.env.local" .env.local`
- لا توجد بيانات ثابتة أخرى — الكتالوج في `src/lib/products.ts` (بنية مطابقة لجداول DB) ويُقرأ عبر `src/lib/db/store.ts`.
- سكربت SQL لقاعدة البيانات: `docs/supabase-schema.sql` (نفّذه في Supabase → SQL Editor).

## 2. Run server (dev)

```bash
npm run dev -- -p 4321
```

- المنفذ: 4321 (مسجّل في Freebuff لهذه الجلسة). الافتراضي 3000 إذا كان حراً.
- الخادم Detached عبر PowerShell (لا يخرج مع نهاية الجلسة):

```powershell
powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev','--','-p','4321' -RedirectStandardOutput 'C:\Users\AMT\Desktop\متجري\.freebuff\preview-3c8aa453-a662-4409-8ce0-95a8c8d3328d.log' -RedirectStandardError 'C:\Users\AMT\Desktop\متجري\.freebuff\preview-3c8aa453-a662-4409-8ce0-95a8c8d3328d.log.err' -WindowStyle Hidden -PassThru).Id"
```

- انتظر حتى يجيب `curl http://localhost:4321/` بـ 200 (أول compile يأخذ ~40 ثانية).

### Verifications

```bash
# TypeScript
npx tsc --noEmit

# Build إنتاجي (أوقف الخادم أولاً — يشاركان .next)
npm run build

# تشغيل نسخة الإنتاج للمعاينة (بعد build — يستخدم .next المبنية)
npm run start -- -p 4321
```

- ⚠️ `next start` **بدون** `-p` يختار منفذاً عشوائياً (49xxx) — مرّر `-p 4321` صراحةً دائماً.
- أمر الإقلاع detached نفسه أعلاه مع `ArgumentList 'run','start','--','-p','4321'` بدل `dev`.

### Known issues

- **ENOSPC**: إذا ظهر `no space left on device` في السجل، نظّف npm cache:
  `npm cache clean --force` (حرّر 74GB في آخر مرة).
- **Supabase**: المشروع `pskheqemoeibgoeqmfff` يعمل الآن (schema منفَّذ — 14 جدول، OTP عبر Custom SMTP/Resend يعمل).
  - جدول `coupons` غير موجود: نفّذ `docs/coupons-migration.sql` من Supabase → SQL Editor.
  - Google Provider غير مفعّل (`google:false`) — يُفعَّل من لوحة Supabase.
  - Google Auth endpoints موجودة: `src/app/api/auth/*`, `src/lib/auth/*`, `docs/AUTH-INTEGRATION.md`.
- **صور المنتجات**: تُحفظ في Supabase Storage — bucket عام للقراءة `product-media` (الكتابة من الخادم فقط عبر `/api/admin/upload`؛ الصور المسجلة في جدول `product_images` الموجود أصلاً). إعداد الـ bucket موثق في `docs/dashboard-images-migration.sql`.
- **النشر**: المجلد الآن مستودع Git (فرع `main`) مع remote `origin → https://github.com/ai7lmed/father.git`. `.env.local` غير متتبَّع (`.gitignore` يغطي `.env*`) — لا ترفعه أبداً؛ في checkout جديد انسخه من المشروع الأساسي.
