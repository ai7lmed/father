import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/auth/supabase-middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * كل شيء ما عدا الملفات الثابتة — يُحدّث كوكيز الجلسة قبل كل تنقل
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
