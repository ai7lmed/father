-- ============================================================
-- QAVEN — Coupons (كوبون الشكر 2.000 ر.ع)
-- التنفيذ: Supabase Dashboard → SQL Editor → Run
-- آمن لإعادة التشغيل (if not exists + drop policy if exists)
-- ============================================================

-- ─── 1) الجدول ───
create table if not exists public.coupons (
  id                    uuid primary key default gen_random_uuid(),
  code                  text not null unique,
  customer_id           uuid not null references public.customers(id) on delete cascade,
  discount_amount       numeric(10,3) not null check (discount_amount > 0),
  minimum_product_price numeric(10,3) not null default 0 check (minimum_product_price >= 0),
  order_id              text references public.orders(id) on delete set null,
  used_at               timestamptz,
  expires_at            timestamptz,
  created_at            timestamptz not null default now()
);

comment on table public.coupons is 'كوبون واحد لكل عميل، استخدام واحد فقط، مرتبط بالعميل';

create index if not exists idx_coupons_customer on public.coupons(customer_id);
create index if not exists idx_coupons_code     on public.coupons(code);

alter table public.coupons enable row level security;

-- العميل يرى كوبونه فقط
drop policy if exists "coupons_select_own" on public.coupons;
create policy "coupons_select_own"
  on public.coupons for select
  using (auth.uid() = customer_id);

-- الكتابة فقط عبر service_role (الإنشاء بعد الطلب، الاستخدام في الطلب) — لا سياسات insert/update للعامة

-- ─── 2) دالة التطبيق الذرية — كل التحققات خادمية ───
--    يستدعيها /api/orders داخل نفس الرحلة؛ إما تطبق أو ترجع سبب الرفض
create or replace function public.apply_coupon(
  p_code        text,
  p_customer_id uuid,
  p_order_id    text,
  p_subtotal    numeric,
  p_max_product_price numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.coupons;
  v_discount numeric(10,3);
begin
  select * into c
  from public.coupons
  where code = upper(trim(p_code))
    and customer_id = p_customer_id
  for update;  -- قفل الصف — طلبان متزامنان: واحد فقط ينجح

  if not found then
    return jsonb_build_object('ok', false, 'error', 'coupon_not_found');
  end if;

  if c.used_at is not null then
    return jsonb_build_object('ok', false, 'error', 'coupon_already_used');
  end if;

  if c.expires_at is not null and c.expires_at < now() then
    return jsonb_build_object('ok', false, 'error', 'coupon_expired');
  end if;

  -- شرط القيمة: يجب وجود منتج >= minimum_product_price في الطلب
  if p_max_product_price < c.minimum_product_price then
    return jsonb_build_object('ok', false, 'error', 'coupon_min_product');
  end if;

  -- الخصم لا يتجاوز قيمة الطلب
  v_discount := least(c.discount_amount, p_subtotal);

  update public.coupons
  set used_at = now(),
      order_id = p_order_id
  where id = c.id;

  return jsonb_build_object('ok', true, 'discount', v_discount, 'code', c.code);
end;
$$;

-- ─── 3) الدالة التلقائية: كوبون واحد لكل عميل بعد أول طلب ───
--    تُستدعى بعد إدراج order_items بنجاح (من /api/orders) — idempotent
create or replace function public.issue_thanks_coupon(
  p_customer_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if p_customer_id is null then
    return null;
  end if;

  -- كوبون واحد فقط لكل عميل — إن وُجد أعد الكود الحالي
  select code into v_code
  from public.coupons
  where customer_id = p_customer_id
  limit 1;

  if found then
    return v_code;
  end if;

  v_code := 'QAVEN2-' || upper(substr(md5(p_customer_id::text || random()::text), 1, 6));

  insert into public.coupons (code, customer_id, discount_amount, minimum_product_price, expires_at)
  values (v_code, p_customer_id, 2.000, 12.000, now() + interval '60 days')
  on conflict (code) do nothing;

  return v_code;
end;
$$;
