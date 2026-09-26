import { supabaseServer } from "@/lib/auth/supabase-server";
import { getCustomer } from "@/lib/auth/customers";
import { isAdminEmail } from "@/lib/auth/admin";

/** GET /api/auth/me — بيانات المستخدم الحقيقي من الجلسة (كوكيز) */
export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ user: null, customer: null });

  const isAdmin = isAdminEmail(user.email);

  const customer = await getCustomer(user.id);
  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null,
    },
    customer,
    isAdmin,
  });
}
