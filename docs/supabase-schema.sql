-- ============================================================
-- ALDIRXON — Supabase Schema (كامل — يطابق الكود حرفياً)
-- التنفيذ: Supabase Dashboard → SQL Editor → paste → Run
-- المراجعة: متوافق مع src/lib/db/schema.ts + src/app/api/*
-- ============================================================

-- ============================================================
-- 0) Extensions
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- 1) customers — ملف العميل (id = auth.users.id)
-- ============================================================
create table if not exists public.customers (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  phone      text,
  full_name  text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.customers (id, email, phone, full_name)
  values (
    new.id,
    new.email,
    nullif(new.phone, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.customers enable row level security;

drop policy if exists "customers_select_own" on public.customers;
create policy "customers_select_own"
  on public.customers for select using (auth.uid() = id);

drop policy if exists "customers_update_own" on public.customers;
create policy "customers_update_own"
  on public.customers for update using (auth.uid() = id);

-- ============================================================
-- 2) categories / subcategories — التصنيفات (قابلة للإدارة من DB)
-- ============================================================
create table if not exists public.categories (
  slug       text primary key,
  name       text not null,
  name_ar    text not null,
  img        text,
  active     boolean not null default true,
  sort_order int  not null default 0
);

create table if not exists public.subcategories (
  slug       text primary key,
  parent     text not null references public.categories(slug) on delete cascade,
  name       text not null,
  name_ar    text not null,
  img        text,
  active     boolean not null default true,
  sort_order int  not null default 0
);

create index if not exists idx_subcategories_parent on public.subcategories(parent);

alter table public.categories    enable row level security;
alter table public.subcategories enable row level security;

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories for select using (true);

drop policy if exists "subcategories_public_read" on public.subcategories;
create policy "subcategories_public_read"
  on public.subcategories for select using (true);

-- ============================================================
-- 3) products — الكتالوج (يُدار من قاعدة البيانات)
-- ============================================================
create table if not exists public.products (
  id          text primary key,                    -- SKU
  name        text not null,
  brand       text not null,
  category    text not null references public.categories(slug),
  subcategory text references public.subcategories(slug),
  price       numeric(10,3) not null check (price >= 0),
  old_price   numeric(10,3) check (old_price is null or old_price >= price),
  img         text not null,
  "desc"      text not null default '',
  specs       jsonb not null default '[]'::jsonb,   -- [["مفتاح","قيمة"],…]
  rating      numeric(2,1) not null default 0 check (rating between 0 and 5),
  reviews     int not null default 0,
  sold        int not null default 0,
  badge       text check (badge in ('New','Best Seller','Limited','Sale')),
  is_featured boolean not null default false,
  is_new      boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.products enable row level security;
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products for select using (true);

-- ============================================================
-- 4) product_images — معرض الصور
-- ============================================================
create table if not exists public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  url        text not null,
  sort_order int  not null default 0
);

create index if not exists idx_product_images_product on public.product_images(product_id);
alter table public.product_images enable row level security;
drop policy if exists "product_images_public_read" on public.product_images;
create policy "product_images_public_read" on public.product_images for select using (true);

-- ============================================================
-- 5) product_tags — وسوم البحث والارتباط
-- ============================================================
create table if not exists public.product_tags (
  product_id text not null references public.products(id) on delete cascade,
  tag        text not null,
  primary key (product_id, tag)
);

create index if not exists idx_product_tags_tag on public.product_tags(tag);
alter table public.product_tags enable row level security;
drop policy if exists "product_tags_public_read" on public.product_tags;
create policy "product_tags_public_read" on public.product_tags for select using (true);

-- ============================================================
-- 6) inventory — المخزون (فصل عن المنتج — يُدار عملياً)
-- ============================================================
create table if not exists public.inventory (
  product_id text primary key references public.products(id) on delete cascade,
  qty        int not null default 0 check (qty >= 0),
  updated_at timestamptz not null default now()
);

alter table public.inventory enable row level security;
drop policy if exists "inventory_public_read" on public.inventory;
create policy "inventory_public_read" on public.inventory for select using (true);

-- ============================================================
-- 7) addresses — عناوين العملاء
-- ============================================================
create table if not exists public.addresses (
  id         uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label      text not null default 'المنزل',
  full_name  text not null,
  phone      text not null,
  city       text not null,
  address    text not null,
  notes      text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_addresses_customer on public.addresses(customer_id);
alter table public.addresses enable row level security;

drop policy if exists "addresses_select_own" on public.addresses;
create policy "addresses_select_own" on public.addresses
  for select using (auth.uid() = customer_id);

drop policy if exists "addresses_insert_own" on public.addresses;
create policy "addresses_insert_own" on public.addresses
  for insert with check (auth.uid() = customer_id);

drop policy if exists "addresses_update_own" on public.addresses;
create policy "addresses_update_own" on public.addresses
  for update using (auth.uid() = customer_id);

drop policy if exists "addresses_delete_own" on public.addresses;
create policy "addresses_delete_own" on public.addresses
  for delete using (auth.uid() = customer_id);

-- ============================================================
-- 8) delivery_methods / payment_methods — الإعدادات التجارية
-- ============================================================
create table if not exists public.delivery_methods (
  code   text primary key,
  label  text not null,
  "desc" text not null,
  fee    numeric(10,3) not null default 0 check (fee >= 0),
  eta    text not null,
  active boolean not null default true
);

create table if not exists public.payment_methods (
  code             text primary key,
  label            text not null,
  "desc"           text not null,
  requires_receipt boolean not null default false,
  active           boolean not null default true
);

alter table public.delivery_methods enable row level security;
alter table public.payment_methods  enable row level security;

drop policy if exists "delivery_methods_public_read" on public.delivery_methods;
create policy "delivery_methods_public_read" on public.delivery_methods for select using (true);
drop policy if exists "payment_methods_public_read" on public.payment_methods;
create policy "payment_methods_public_read"  on public.payment_methods  for select using (true);

-- ——— النظام النهائي للتوصيل: عادي مجاني / سريع 2.500 ر.ع ———
insert into public.delivery_methods (code, label, "desc", fee, eta, active) values
  ('standard', 'التوصيل العادي', '3 – 5 أيام عمل داخل عُمان', 0,   '3 – 5 أيام عمل', true),
  ('fast',     'التوصيل السريع', 'خلال 24 – 48 ساعة',        2.5, '24 – 48 ساعة',  true)
on conflict (code) do update
  set fee = excluded.fee, eta = excluded.eta, active = true;

insert into public.payment_methods (code, label, "desc", requires_receipt, active) values
  ('cod',           'الدفع عند الاستلام', 'الدفع نقداً عند استلام الطلب.', false, true),
  ('bank_transfer', 'تحويل بنكي',         'حوّل المبلغ ثم ارفع صورة الإيصال.', true, true)
on conflict (code) do update
  set requires_receipt = excluded.requires_receipt, active = true;

-- ============================================================
-- 9) orders — الطلبات (لقطة الأسعار وقت الطلب)
-- ============================================================
create table if not exists public.orders (
  id              text primary key,                       -- QVN-XXXX
  customer_id     uuid references public.customers(id) on delete set null,
  status          text not null default 'pending'
                    check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  subtotal        numeric(10,3) not null check (subtotal >= 0),
  delivery_method text not null references public.delivery_methods(code),
  delivery_fee    numeric(10,3) not null default 0 check (delivery_fee >= 0),
  total           numeric(10,3) not null check (total >= 0),
  payment_method  text not null references public.payment_methods(code),
  ship_name       text not null,
  ship_phone      text not null,
  ship_city       text not null,
  ship_address    text not null,
  ship_notes      text,
  receipt_attached boolean not null default false,
  placed_at       timestamptz not null default now()
);

create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_orders_status  on public.orders(status);

alter table public.orders enable row level security;

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = customer_id);

-- الإدراج عبر service_role من الخادم (يتجاوز RLS) — التسعير خادمي دائماً

-- ============================================================
-- 10) order_items — أصناف الطلب (لقطة اسم وسعر الوحدة)
-- ============================================================
create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   text not null references public.orders(id) on delete cascade,
  product_id text references public.products(id),
  name       text not null,        -- اسم المنتج وقت الطلب
  qty        int  not null check (qty > 0),
  unit_price numeric(10,3) not null check (unit_price >= 0)
);

create index if not exists idx_order_items_order on public.order_items(order_id);
alter table public.order_items enable row level security;

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.customer_id = auth.uid()
    )
  );

-- ============================================================
-- 11) bank_transfer_receipts — إيصالات التحويل
-- ============================================================
create table if not exists public.bank_transfer_receipts (
  id          uuid primary key default gen_random_uuid(),
  order_id    text not null references public.orders(id) on delete cascade,
  storage_key text,                      -- مفتاح الملف في Supabase Storage
  data_url    text,                      -- بديل عرض (فقط إذا لم يُفعّل Storage)
  created_at  timestamptz not null default now()
);

create index if not exists idx_receipts_order on public.bank_transfer_receipts(order_id);
alter table public.bank_transfer_receipts enable row level security;

drop policy if exists "receipts_select_own" on public.bank_transfer_receipts;
create policy "receipts_select_own" on public.bank_transfer_receipts
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = bank_transfer_receipts.order_id and o.customer_id = auth.uid()
    )
  );

-- ============================================================
-- 12) settings — إعدادات المتجر (key/value)
-- ============================================================
create table if not exists public.settings (
  key   text primary key,
  value jsonb not null
);

alter table public.settings enable row level security;
drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read" on public.settings for select using (true);

insert into public.settings (key, value) values
  ('free_shipping_threshold', '25'),
  ('bank_account', '{"bankName":"بنك مسقط","accountName":"شركة الدايركسون للتجارة","accountNumber":"0301-234567-001","iban":"OM45BOMR0301234567001"}'::jsonb)
on conflict (key) do nothing;

-- ============================================================
-- ملاحظات
-- ============================================================
-- • الكود الحالي يقرأ الكتالوج من src/lib/products.ts — عند الترحيل للـ DB
--   تُستخدم نفس أسماء الأعمدة عبر QavenStore (src/lib/db/store.ts).
-- • الإيصالات: الافتراضي data_url حتى تُنشئ bucket "receipts" في Storage
--   ثم يُخزن storage_key فقط.
-- • لا secret في الواجهة: service_role يُستخدم في Route Handlers فقط.
