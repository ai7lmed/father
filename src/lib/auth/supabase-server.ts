import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Supabase server client — يقرأ/يكتب كوكيز الجلسة (Route Handlers / Server Components) */
export async function supabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // يُستدعى من Server Component — الكوكيز تُدار عبر middleware
          }
        },
      },
    }
  );
}
