# QAVEN — Run doc

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
```

### Known issues

- **ENOSPC**: إذا ظهر `no space left on device` في السجل، نظّف npm cache:
  `npm cache clean --force` (حرّر 74GB في آخر مرة).
- **Supabase**: المشروع الحالي في `.env.local` غير مُنشأ/متوقف (`ENOTFOUND` عند الوصول).
  أنشئ مشروعاً حقيقياً وحدّث المفاتيح — Auth لن يعمل فعلياً حتى ذلك الحين.
  الكود جاهز بالكامل: `src/app/api/auth/*`, `src/lib/auth/*`, `docs/AUTH-INTEGRATION.md`.
