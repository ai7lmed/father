/**
 * next مسار داخلي فقط — يمنع open-redirect إلى نطاقات خارجية
 * يُستخدم في /api/auth/google و /api/auth/callback
 */
export function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) {
    return raw;
  }
  return "/account";
}
