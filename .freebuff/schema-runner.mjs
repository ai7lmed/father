/* مشغّل سكربت SQL عبر Management API — يطبع أرقام الجمل ورموز HTTP فقط */
import https from "node:https";
import { readFileSync } from "node:fs";

/* ——— قراءة القيم من .env.local بدون طباعتها ——— */
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim() : "";
};
const REF = "pskheqemoeibgoeqmfff";
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || "";
const SERVICE_ROLE = get("SUPABASE_SERVICE_ROLE_KEY");

function request(method, path, body, headers = {}, tries = 3) {
  return new Promise((resolve, reject) => {
    const attempt = (left) => {
      const data = body == null ? null : Buffer.from(JSON.stringify(body));
      const req = https.request(
        {
          hostname: "api.supabase.com",
          path,
          method,
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            ...(data ? { "Content-Length": data.length } : {}),
            ...headers,
          },
          timeout: 30000,
        },
        (res) => {
          let out = "";
          res.on("data", (c) => (out += c));
          res.on("end", () => {
            if (res.statusCode >= 500 && left > 0)
              return setTimeout(() => attempt(left - 1), 3000);
            resolve({ status: res.statusCode, body: out.slice(0, 500) });
          });
        }
      );
      req.on("timeout", () => {
        req.destroy(new Error("timeout"));
      });
      req.on("error", (e) => {
        if (left > 0) return setTimeout(() => attempt(left - 1), 3000);
        reject(e);
      });
      if (data) req.write(data);
      req.end();
    };
    attempt(tries);
  });
}

/* ——— تقسيم الملف إلى جمل: كل جملة تنتهي بـ ; خارج الدوال $$ ——— */
const raw = readFileSync(new URL("../docs/supabase-schema.sql", import.meta.url), "utf8");
const statements = [];
let cur = "";
let inDollar = false;
for (const line of raw.split("\n")) {
  cur += line + "\n";
  const dollars = (line.match(/\$\$/g) || []).length;
  for (let i = 0; i < dollars; i++) inDollar = !inDollar;
  if (!inDollar && /;\s*$/.test(line)) {
    const s = cur.trim();
    if (s && !s.startsWith("--")) statements.push(s);
    cur = "";
  }
}
if (cur.trim()) statements.push(cur.trim());

console.log(`statements: ${statements.length}`);

/* ——— 1) التحقق من التوكن ——— */
const me = await request("GET", "/v1/projects");
if (me.status !== 200) {
  console.log(`TOKEN_CHECK: HTTP ${me.status} — توكن غير صالح أو منتهي`);
  process.exit(2);
}
console.log(`TOKEN_CHECK: HTTP 200`);

/* ——— 2) مسح بقايا جزئية إن وُجدت (قاعدة فارغة أصلاً — آمن) ——— */
const DROP = [
  `drop trigger if exists on_auth_user_created on auth.users`,
  `drop function if exists public.handle_new_user()`,
];
for (const t of [
  "bank_transfer_receipts","order_items","orders","addresses","inventory",
  "product_tags","product_images","products","subcategories","categories",
  "customers","delivery_methods","payment_methods","settings",
]) DROP.push(`drop table if exists public.${t} cascade`);
DROP.push(`drop policy if exists "customers_select_own" on public.customers`);
for (let i = 0; i < DROP.length; i++) {
  const r = await request(
    "POST",
    `/v1/projects/${REF}/database/query`,
    { query: DROP[i] + ";" }
  );
  console.log(`wipe ${i + 1}/${DROP.length}: ${r.status}`);
}

/* ——— 3) تنفيذ جمل السكربت بالترتيب ——— */
let ok = 0, failed = 0;
for (let i = 0; i < statements.length; i++) {
  const r = await request(
    "POST",
    `/v1/projects/${REF}/database/query`,
    { query: statements[i] }
  );
  const head = statements[i].replace(/\s+/g, " ").slice(0, 52);
  if (r.status === 200) {
    ok++;
    console.log(`stmt ${i + 1}: 200  ${head}`);
  } else {
    failed++;
    console.log(`stmt ${i + 1}: ${r.status}  ${head}`);
    console.log(`   └─ ${r.body}`);
    process.exit(3);
  }
}
console.log(`DONE: ok=${ok} failed=${failed}`);
void SERVICE_ROLE;
