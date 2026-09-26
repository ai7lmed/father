"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImageIcon, Link2, Loader2, Star, Trash2, Upload } from "lucide-react";
import { useToast } from "./ui";

/* ============================================================
 * ImageManager — مدير صور المنتج داخل لوحة التحكم
 * • رفع متعدد من الجهاز → Supabase Storage (عبر /api/admin/upload)
 * • إضافة صورة برابط خارجي
 * • تعيين الرئيسية (النجمة) / إعادة الترتيب (أسهم) / حذف
 * • الصورة الأولى = الرئيسية = صورة المنتج في المتجر (products.img)
 * ============================================================ */

type Img = { id: string; url: string; alt?: string | null; sort_order: number };
export type { Img };

export function ImageManager({
  productId,
  images,
  onChange,
}: {
  productId: string;
  images: Img[];
  onChange: (next: Img[]) => void;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [addingUrl, setAddingUrl] = useState(false);
  const [busyUrl, setBusyUrl] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const r = await fetch(`/api/admin/products/${productId}/images`, { cache: "no-store" });
    const d = await r.json();
    if (d.ok) onChange(d.images);
    return d.images as Img[] | undefined;
  }, [productId, onChange]);

  /* ——— رفع ملفات من الجهاز ——— */
  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let failed = 0;
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("productId", productId);
      try {
        const up = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const upJson = await up.json();
        if (!upJson.ok) {
          failed++;
          continue;
        }
        const reg = await fetch(`/api/admin/products/${productId}/images`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ images: [{ url: upJson.url }] }),
        });
        const regJson = await reg.json();
        if (!regJson.ok) failed++;
      } catch {
        failed++;
      }
    }
    await reload();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (failed === 0) toast.success(`تم رفع ${files.length} صورة بنجاح`);
    else if (failed === files.length) toast.error("فشل رفع الصور — حاول مجدداً");
    else toast.info(`نجح ${files.length - failed} وفشل ${failed}`);
  };

  /* ——— إضافة برابط ——— */
  const addUrl = async () => {
    const url = urlInput.trim();
    if (!/^https?:\/\//.test(url)) {
      toast.error("أدخل رابط صورة صحيح (https://…)");
      return;
    }
    setAddingUrl(true);
    try {
      const r = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ images: [{ url }] }),
      });
      const d = await r.json();
      if (d.ok && d.added > 0) {
        setUrlInput("");
        toast.success("أُضيفت الصورة");
        await reload();
      } else if (d.ok && d.added === 0) {
        toast.info("الصورة موجودة أصلاً في المنتج");
      } else {
        toast.error("تعذر إضافة الصورة");
      }
    } catch {
      toast.error("تعذر إضافة الصورة");
    } finally {
      setAddingUrl(false);
    }
  };

  /* ——— تعيين الرئيسية ——— */
  const setMain = async (url: string) => {
    setBusyUrl(url);
    const r = await fetch(`/api/admin/products/${productId}/images`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ setMain: url }),
    });
    const d = await r.json();
    setBusyUrl(null);
    if (d.ok) {
      toast.success("أصبحت الصورة الرئيسية");
      await reload();
    } else toast.error("تعذر تعيين الرئيسية");
  };

  /* ——— تحريك أعلى/أسفل ——— */
  const move = async (index: number, dir: -1 | 1) => {
    const next = [...images];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((img, i) => ({ ...img, sort_order: i })));
    const r = await fetch(`/api/admin/products/${productId}/images`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ order: next.map((x) => x.url) }),
    });
    const d = await r.json();
    if (d.ok) await reload();
    else toast.error("تعذر حفظ الترتيب");
  };

  /* ——— حذف ——— */
  const remove = async (img: Img) => {
    const ok = await toast.confirmDanger("حذف هذه الصورة نهائياً من المنتج؟");
    if (!ok) return;
    setBusyUrl(img.url);
    const r = await fetch(
      `/api/admin/products/${productId}/images?url=${encodeURIComponent(img.url)}`,
      { method: "DELETE" }
    );
    const d = await r.json();
    setBusyUrl(null);
    if (d.ok) {
      toast.success("حُذفت الصورة");
      await reload();
    } else toast.error("تعذر حذف الصورة");
  };

  const inputCls =
    "h-10 w-full rounded-lg border border-mist bg-white px-3 text-sm outline-none focus:border-accent";

  return (
    <div className="rounded-xl border border-mist bg-paper p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">
          صور المنتج <span className="text-xs font-normal text-steel">({images.length})</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            multiple
            hidden
            onChange={(e) => uploadFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-accent disabled:opacity-50"
          >
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} strokeWidth={1.75} />}
            {uploading ? "جارٍ الرفع…" : "رفع صور"}
          </button>
        </div>
      </div>

      {/* إضافة برابط */}
      <div className="mt-3 flex gap-2">
        <input
          className={inputCls}
          dir="ltr"
          placeholder="أو أضف صورة برابط خارجي (https://…)"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
        />
        <button
          type="button"
          onClick={addUrl}
          disabled={addingUrl || !urlInput.trim()}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-mist bg-white px-4 text-sm text-graphite transition-colors hover:border-ink hover:text-ink disabled:opacity-40"
        >
          {addingUrl ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} strokeWidth={1.75} />}
          إضافة
        </button>
      </div>

      {/* الشبكة */}
      {images.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed border-mist bg-white p-8 text-center">
          <ImageIcon size={22} strokeWidth={1.5} className="text-steel" />
          <p className="text-sm text-graphite">لا توجد صور — ارفع صوراً من جهازك أو أضف رابطاً.</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <div key={img.id || img.url} className="group relative overflow-hidden rounded-lg border border-mist bg-white">
              <div className="aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt ?? ""} className="h-full w-full object-cover" />
              </div>
              {i === 0 && (
                <span className="absolute start-2 top-2 flex items-center gap-1 rounded-md bg-ink/90 px-2 py-0.5 text-[10px] font-medium text-white">
                  <Star size={10} className="fill-current" /> الرئيسية
                </span>
              )}
              <div className="flex items-center justify-between gap-1 border-t border-mist px-2 py-1.5">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    aria-label="تحريك لأعلى"
                    disabled={i === 0 || busyUrl === img.url}
                    onClick={() => move(i, -1)}
                    className="rounded p-1 text-steel transition-colors hover:text-ink disabled:opacity-25"
                  >
                    <ArrowUp size={13} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    aria-label="تحريك لأسفل"
                    disabled={i === images.length - 1 || busyUrl === img.url}
                    onClick={() => move(i, 1)}
                    className="rounded p-1 text-steel transition-colors hover:text-ink disabled:opacity-25"
                  >
                    <ArrowDown size={13} strokeWidth={1.75} />
                  </button>
                </div>
                <div className="flex items-center gap-0.5">
                  {i !== 0 && (
                    <button
                      type="button"
                      aria-label="تعيين كرئيسية"
                      disabled={busyUrl === img.url}
                      onClick={() => setMain(img.url)}
                      className="rounded p-1 text-steel transition-colors hover:text-accent disabled:opacity-25"
                    >
                      <Star size={13} strokeWidth={1.75} />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="حذف الصورة"
                    disabled={busyUrl === img.url}
                    onClick={() => remove(img)}
                    className="rounded p-1 text-steel transition-colors hover:text-red-600 disabled:opacity-25"
                  >
                    {busyUrl === img.url ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11px] leading-5 text-steel">
        الصورة الأولى تظهر كصورة المنتج الرئيسية في كل صفحات المتجر. احذف صورة لا يحذف المنتج.
      </p>
    </div>
  );
}
