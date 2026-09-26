import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * ALDIRXON — كاش تزايدي افتراضي (لكل نسخة Worker):
 * كل الصفحات SSG تُولَّد عند البناء وتُقدَّم من ASSETS، ولا نستخدم ISR وقتياً،
 * لذا الكاش الافتراضي كافٍ. لتفعيل KV مشترك لاحقاً:
 *   1) npx wrangler kv namespace create NEXT_INC_CACHE_KV
 *   2) أضف binding بهذا الاسم في wrangler.jsonc
 *   3) incrementalCache: kvIncrementalCache (من @opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache)
 */
export default defineCloudflareConfig({});
