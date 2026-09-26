import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth/admin";
import { DashboardNav } from "./nav";

export const dynamic = "force-dynamic";

/* حماية خادمية: أي مستخدم غير مدير يُعاد إلى صفحة حسابه */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/account");

  return (
    <div className="shell min-h-[70vh] py-10">
      <div className="mb-8">
        <p className="eyebrow">QAVEN ADMIN</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">لوحة التحكم</h1>
      </div>
      <DashboardNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}
