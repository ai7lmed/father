-- ============================================================
-- ALDIRXON — الإشعارات والفواتير (Migration آمنة وقابلة لإعادة التنفيذ)
-- • notification_logs: سجل حالة كل إرسال (إيميل/واتساب/إدارة) لإعادة الإرسال
-- • invoice_links: سجل توليد الفاتورة لكل طلب
-- • exec_sql: أداة إدارة للتنفيذ عبر service_role فقط (تُلغى عن الجميع غيرها)
-- لا تلمس أي جدول موجود — لا تغيير على orders/customers/coupons
-- ============================================================

create table if not exists public.notification_logs (
  id         uuid primary key default gen_random_uuid(),
  order_id   text not null,
  channel    text not null check (channel in ('email','whatsapp','admin_email','admin_whatsapp')),
  status     text not null check (status in ('sent','failed')),
  error      text,
  created_at timestamptz not null default now()
);

create index if not exists notification_logs_order_idx   on public.notification_logs (order_id);
create index if not exists notification_logs_created_idx on public.notification_logs (created_at desc);

create table if not exists public.invoice_links (
  order_id   text primary key,
  url        text not null,
  method     text not null default 'hosted_html',
  created_at timestamptz not null default now()
);

-- RLS مفعّل على الجدولين بلا سياسات عامة — الوصول عبر service_role (خادم) فقط
alter table public.notification_logs enable row level security;
alter table public.invoice_links     enable row level security;

-- ============================================================
-- exec_sql — تنفيذ SQL إداري من الكود عبر service_role حصراً
-- تُنشأ هنا وتُمنح لـ service_role فقط (revoke من public/anon/authenticated)
-- ============================================================
create or replace function public.exec_sql(query text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  begin
    execute format('select coalesce(jsonb_agg(t), ''[]''::jsonb) from (%s) t', query) into result;
    return result;
  exception when others then
    execute query; -- عبارات DDL/أوامر غير الاستعلام
    return jsonb_build_object('ok', true);
  end;
exception when others then
  return jsonb_build_object('error', sqlerrm);
end $$;

revoke execute on function public.exec_sql(text) from public;
revoke execute on function public.exec_sql(text) from anon;
revoke execute on function public.exec_sql(text) from authenticated;
grant  execute on function public.exec_sql(text) to service_role;
