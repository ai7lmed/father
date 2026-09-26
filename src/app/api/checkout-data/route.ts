import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/auth/supabase-server";
import { supabaseAdmin, getCustomer } from "@/lib/auth/customers";

/** GET /api/checkout-data — بيانات الـ Checkout للعميل المسجّل */
export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ ok: true, customer: null, addresses: [] });

  const admin = supabaseAdmin();
  const [customerRow, addressesRes] = await Promise.all([
    getCustomer(user.id),
    admin
      .from("addresses")
      .select("*")
      .eq("customer_id", user.id)
      .order("is_default", { ascending: false }),
  ]);

  return Response.json({
    ok: true,
    customer: {
      id: user.id,
      name: customerRow?.full_name ?? user.user_metadata?.full_name ?? null,
      email: customerRow?.email ?? user.email ?? null,
      phone: customerRow?.phone ?? user.phone ?? null,
    },
    addresses: addressesRes.data ?? [],
  });
}
