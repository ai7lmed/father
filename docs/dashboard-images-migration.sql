-- ============================================================
-- ALDIRXON — Dashboard & Product Images Migration
-- التنفيذ: Supabase Dashboard → SQL Editor → paste → Run
-- آمن لإعادة التشغيل (if not exists / on conflict do nothing)
-- لا يحذف أي بيانات — إضافي فقط
-- ============================================================
--
-- ملخص الحالة:
-- • الجداول المطلوبة موجودة أصلاً في docs/supabase-schema.sql المنفَّذ:
--   product_images (uuid, product_id, url, sort_order) — معرض صور المنتج
--   categories (slug, name, name_ar, img, active, sort_order) — إدارة الأقسام
--   subcategories (slug, parent, name, name_ar, img, active, sort_order)
--   products.subcategory — ربط المنتج بالقسم الفرعي
-- • الجديد الوحيد المطلوب: bucket تخزين عام للقراءة لصور المنتجات والأقسام.
--
-- ملاحظات أمنية:
-- • الرفع يتم من الخادم فقط عبر SUPABASE_SERVICE_ROLE_KEY (لا يُكتب في الكود).
-- • لا حاجة لأي storage policy: القراءة عامة عبر getPublicUrl، والكتابة
--   بمفتاح الخدمة يتجاوز RLS أصلاً.
-- ============================================================

-- 1) bucket التخزين (عام للقراءة — الكتابة من الخادم فقط)
insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do nothing;

-- 2) (اختياري) حماية إضافية: منع أي كتابة عبر anon/authenticated مباشرة
--    الخادم يستخدم service role الذي يتجاوز RLS، فلا تتأثر لوحة التحكم.
--    الصيغة أدناه آمنة لإعادة التشغيل:
drop policy if exists "product_media_no_direct_write" on storage.objects;
create policy "product_media_no_direct_write"
  on storage.objects for all to anon, authenticated
  using (bucket_id <> 'product-media')
  with check (bucket_id <> 'product-media');

-- 3) فهرس ترتيب الصور (موجود غالباً — آمن للتكرار)
create index if not exists idx_product_images_product_sort
  on public.product_images (product_id, sort_order);
