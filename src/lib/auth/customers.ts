import { createClient } from "@supabase/supabase-js";

/* ============================================================
 * مزامنة العملاء — قاعدة بيانات Supabase (جدول customers)
 * service_role: يُستخدم فقط على الخادم لتجاوز RLS عند إنشاء الصف
 * ============================================================ */

export type CustomerRecord = {
  id: string; // = auth.users.id
  email: string | null;
  phone: string | null;
  full_name: string | null;
  created_at: string;
};

let admin: ReturnType<typeof createClient> | null = null;

/** Supabase admin client — خادم فقط */
export function supabaseAdmin() {
  if (!admin) {
    admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return admin;
}

/** ينشئ/يحدّث صف العميل بعد أي مسار دخول ناجح — idempotent */
export async function upsertCustomer(input: {
  id: string;
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
}): Promise<CustomerRecord | null> {
  try {
    const row = {
      id: input.id,
      email: input.email ?? null,
      phone: input.phone ?? null,
      full_name: input.fullName ?? null,
    };
    const { data, error } = await supabaseAdmin()
      .from("customers")
      .upsert(row as never, { onConflict: "id" })
      .select()
      .single<CustomerRecord>();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("[customers] upsert failed:", err);
    return null;
  }
}

/** جلب بيانات العميل (للعرض في الحساب/الـ Checkout) */
export async function getCustomer(id: string): Promise<CustomerRecord | null> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("customers")
      .select()
      .eq("id", id)
      .maybeSingle<CustomerRecord>();
    if (error) throw error;
    return data ?? null;
  } catch {
    return null;
  }
}
