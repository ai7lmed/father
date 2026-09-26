import { supabaseServer } from "@/lib/auth/supabase-server";

/* ============================================================
 * ALDIRXON — Admin guard (server-only)
 * ------------------------------------------------------------
 * • قائمة المديرين من ADMIN_EMAILS (fallback: البريد الأساسي)
 * • التحقق يتم على الخادم حصراً — الواجهة تعرض الرابط فقط
 *   بناءً على isAdmin المُرجَع من /api/auth/me (وليس صلاحية)
 * ============================================================ */

const DEFAULT_ADMINS = ["myhome2003ah@gmail.com"];

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? DEFAULT_ADMINS.join(","))
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

/** يرجع المستخدم إذا كان مديراً، وإلا null */
export async function getAdminUser() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) return null;
  return user;
}

/** حارس موحّد لمسارات API — يُرجع رد 403 إذا لم يكن مديراً */
export async function requireAdmin(): Promise<Response | null> {
  const user = await getAdminUser();
  if (!user) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  return null;
}
