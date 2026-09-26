"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { formatOMR, Spinner, EmptyCard, ErrorCard, useToast } from "../ui";
import { ImageManager, type Img } from "../image-manager";

type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string | null;
  price: number;
  old_price: number | null;
  img: string;
  desc: string;
  badge: string | null;
  is_featured: boolean;
  is_new: boolean;
  stock: number;
  images?: Img[];
};

type Cat = { slug: string; name_ar: string };
type Sub = { slug: string; parent: string; name_ar: string };

const EMPTY = {
  id: "",
  name: "",
  brand: "",
  category: "",
  subcategory: "",
  price: "",
  old_price: "",
  img: "",
  badge: "",
  is_featured: false,
  is_new: true,
  stock: "10",
  desc: "",
};

type SortKey = "newest" | "price_asc" | "price_desc" | "stock_asc";

export default function AdminProducts() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in" | "low" | "out">("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const [editing, setEditing] = useState<typeof EMPTY | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [images, setImages] = useState<Img[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);
    try {
      const [p, c] = await Promise.all([
        fetch("/api/admin/products", { cache: "no-store" }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))),
        fetch("/api/admin/categories", { cache: "no-store" }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))),
      ]);
      setProducts(p.products ?? []);
      setCats(c.categories ?? []);
      setSubs(c.subcategories ?? []);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* قراءة ?q= من روابط اللوحة (مثل مخزون منخفض)، و؟category= من زر «منتج» في صفحة الأقسام:
     يفتح نموذج منتج جديد مع القسم محدد مسبقاً */
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const q0 = sp.get("q");
    if (q0) setQ(q0);
    const c0 = sp.get("category");
    if (c0 && cats.some((x) => x.slug === c0) && !editing) {
      setCat(c0);
      setEditingId(null);
      setImages([]);
      setEditing({ ...EMPTY, category: c0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cats.length]);

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = products.filter((p) => {
      const matchQ = !query || p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query);
      const matchCat = !cat || p.category === cat;
      const matchStock =
        stockFilter === "all" ||
        (stockFilter === "out" && p.stock <= 0) ||
        (stockFilter === "low" && p.stock > 0 && p.stock <= 5) ||
        (stockFilter === "in" && p.stock > 5);
      return matchQ && matchCat && matchStock;
    });
    const sorted = [...filtered];
    if (sort === "price_asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "stock_asc") sorted.sort((a, b) => a.stock - b.stock);
    return sorted;
  }, [products, q, cat, stockFilter, sort]);

  /* ——— فتح نموذج التعديل مع جلب الصور والمواصفات ——— */
  const openEdit = async (p: Product) => {
    setEditingId(p.id);
    setEditing({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      subcategory: p.subcategory ?? "",
      price: String(p.price),
      old_price: p.old_price ? String(p.old_price) : "",
      img: p.img,
      badge: p.badge ?? "",
      is_featured: p.is_featured,
      is_new: p.is_new,
      stock: String(p.stock),
      desc: p.desc ?? "",
    });
    const r = await fetch(`/api/admin/products/${p.id}/images`, { cache: "no-store" });
    const d = await r.json();
    setImages(d.ok ? d.images : []);
  };

  const startNew = () => {
    setEditingId(null);
    setImages([]);
    setEditing({ ...EMPTY });
  };

  /* ——— حفظ المنتج ——— */
  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.category || !(Number(editing.price) >= 0)) {
      toast.error("أكمل الاسم والقسم والسعر على الأقل");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: editing.id || undefined,
        name: editing.name,
        brand: editing.brand,
        category: editing.category,
        subcategory: editing.subcategory || null,
        price: Number(editing.price),
        old_price: editing.old_price ? Number(editing.old_price) : null,
        img: editing.img || undefined,
        badge: editing.badge || null,
        is_featured: editing.is_featured,
        is_new: editing.is_new,
        stock: Number(editing.stock) || 0,
        desc: editing.desc,
      };
      const isNew = !editingId;
      const res = await fetch(isNew ? "/api/admin/products" : `/api/admin/products/${editingId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error ?? "save_failed");
      toast.success(isNew ? "أُنشئ المنتج — أضف صوره الآن" : "حُفظت تعديلات المنتج");
      setEditingId(d.id ?? editingId);
      if (isNew) {
        setEditing((e) => (e ? { ...e, id: d.id ?? "" } : e));
        await load();
      } else {
        await load();
      }
    } catch (e) {
      toast.error(e instanceof Error && e.message === "duplicate_id" ? "SKU مستخدم — اختر غيره" : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  /* ——— حذف منتج ——— */
  const remove = async (p: Product) => {
    const ok = await toast.confirmDanger(`حذف المنتج «${p.name}» (${p.id})؟ لا يمكن التراجع.`);
    if (!ok) return;
    const r = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
    const d = await r.json();
    if (d.ok) {
      toast.success("حُذف المنتج");
      await load();
    } else {
      toast.error("تعذر الحذف — قد يكون المنتج مرتبطاً بطلبات سابقة");
    }
  };

  const inputCls =
    "h-10 w-full rounded-lg border border-mist bg-white px-3 text-sm outline-none focus:border-accent";

  return (
    <div className="space-y-5">
      {/* شريط الأدوات */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-56 flex-1">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-steel" strokeWidth={1.75} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث باسم المنتج أو SKU…"
            className="h-10 w-full rounded-lg border border-mist bg-white ps-9 pe-3 text-sm outline-none focus:border-accent"
          />
        </div>
        <select className={`${inputCls} w-auto`} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">كل الأقسام</option>
          {cats.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name_ar}</option>
          ))}
        </select>
        <select className={`${inputCls} w-auto`} value={stockFilter} onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}>
          <option value="all">كل الحالات</option>
          <option value="in">متوفر</option>
          <option value="low">مخزون منخفض</option>
          <option value="out">نفد</option>
        </select>
        <select className={`${inputCls} w-auto`} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="newest">الأحدث</option>
          <option value="price_asc">السعر: الأقل أولاً</option>
          <option value="price_desc">السعر: الأعلى أولاً</option>
          <option value="stock_asc">المخزون: الأقل أولاً</option>
        </select>
        <button
          type="button"
          onClick={startNew}
          className="flex h-10 items-center gap-2 rounded-lg bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-accent"
        >
          <Plus size={15} strokeWidth={2} /> إضافة منتج
        </button>
      </div>

      {/* نموذج الإضافة/التعديل */}
      {editing && (
        <div className="rounded-xl border border-mist bg-white p-5">
          <h3 className="text-sm font-semibold text-ink">
            {editingId ? `تعديل: ${editing.name}` : "منتج جديد"}
          </h3>

          <div className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {!editingId && (
              <label className="block">
                <span className="mb-1 block text-xs text-graphite">SKU (اختياري — يُولد تلقائياً)</span>
                <input className={inputCls} value={editing.id} onChange={(e) => setEditing({ ...editing, id: e.target.value })} dir="ltr" />
              </label>
            )}
            <label className="block">
              <span className="mb-1 block text-xs text-graphite">الاسم *</span>
              <input className={inputCls} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-graphite">الماركة</span>
              <input className={inputCls} value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-graphite">القسم *</span>
              <select className={inputCls} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value, subcategory: "" })}>
                <option value="">— اختر —</option>
                {cats.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name_ar}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-graphite">التصنيف الفرعي</span>
              <select className={inputCls} value={editing.subcategory} onChange={(e) => setEditing({ ...editing, subcategory: e.target.value })}>
                <option value="">—</option>
                {subs.filter((s) => !editing.category || s.parent === editing.category).map((s) => (
                  <option key={s.slug} value={s.slug}>{s.name_ar}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-graphite">السعر (ر.ع) *</span>
              <input className={inputCls} type="number" step="0.001" min="0" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} dir="ltr" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-graphite">السعر قبل الخصم</span>
              <input className={inputCls} type="number" step="0.001" min="0" value={editing.old_price} onChange={(e) => setEditing({ ...editing, old_price: e.target.value })} dir="ltr" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-graphite">المخزون</span>
              <input className={inputCls} type="number" min="0" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: e.target.value })} dir="ltr" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-graphite">الشارة</span>
              <select className={inputCls} value={editing.badge} onChange={(e) => setEditing({ ...editing, badge: e.target.value })}>
                <option value="">بدون شارة</option>
                <option value="New">New</option>
                <option value="Best Seller">Best Seller</option>
                <option value="Limited">Limited</option>
                <option value="Sale">Sale</option>
              </select>
            </label>
            <label className="block sm:col-span-2 lg:col-span-3">
              <span className="mb-1 block text-xs text-graphite">الوصف</span>
              <textarea className="w-full rounded-lg border border-mist bg-white px-3 py-2.5 text-sm outline-none focus:border-accent" rows={3} value={editing.desc} onChange={(e) => setEditing({ ...editing, desc: e.target.value })} />
            </label>
            {!editingId && (
              <label className="block sm:col-span-2 lg:col-span-3">
                <span className="mb-1 block text-xs text-graphite">صورة رئيسية برابط (اختياري عند الإنشاء — يمكنك الرفع بعد الحفظ)</span>
                <input className={inputCls} value={editing.img} onChange={(e) => setEditing({ ...editing, img: e.target.value })} dir="ltr" placeholder="https://…" />
              </label>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-graphite">
              <input type="checkbox" checked={editing.is_featured} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} className="h-4 w-4 accent-[#2e6ba8]" />
              مميز في الرئيسية
            </label>
            <label className="flex items-center gap-2 text-sm text-graphite">
              <input type="checkbox" checked={editing.is_new} onChange={(e) => setEditing({ ...editing, is_new: e.target.checked })} className="h-4 w-4 accent-[#2e6ba8]" />
              وصل حديثاً
            </label>
          </div>

          {/* مدير الصور — للمنتج المحفوظ فقط */}
          {editingId ? (
            <div className="mt-4">
              <ImageManager productId={editingId} images={images} onChange={setImages} />
            </div>
          ) : (
            <p className="mt-4 rounded-lg bg-paper px-4 py-2.5 text-xs text-steel ring-1 ring-mist">
              احفظ المنتج أولاً لتتمكن من رفع صوره وإدارتها.
            </p>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving || !editing.name || !editing.category || (!editingId && !editing.img)}
              className="h-10 rounded-lg bg-ink px-6 text-sm font-medium text-white transition-colors hover:bg-accent disabled:opacity-40"
            >
              {saving ? "جارٍ الحفظ…" : "حفظ"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setEditingId(null);
                setImages([]);
              }}
              className="h-10 rounded-lg border border-mist px-6 text-sm text-graphite transition-colors hover:border-steel hover:text-ink"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* الجدول */}
      {loading ? (
        <Spinner />
      ) : loadErr ? (
        <ErrorCard text="تعذر تحميل المنتجات." onRetry={load} />
      ) : visible.length === 0 ? (
        <EmptyCard text={products.length === 0 ? "لا توجد منتجات بعد — أضف أول منتج." : "لا نتائج مطابقة للبحث/الفلاتر."} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-mist bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-paper text-xs text-steel">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">المنتج</th>
                  <th className="px-4 py-3 text-start font-medium">القسم</th>
                  <th className="px-4 py-3 text-start font-medium">السعر</th>
                  <th className="px-4 py-3 text-start font-medium">المخزون</th>
                  <th className="px-4 py-3 text-start font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} className="border-t border-mist">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.img} alt="" className="h-10 w-10 rounded-md border border-mist object-cover" />
                        <div>
                          <span className="block font-medium text-ink">{p.name}</span>
                          <span dir="ltr" className="block text-xs text-steel">{p.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-graphite">
                      {cats.find((c) => c.slug === p.category)?.name_ar ?? p.category}
                      {p.subcategory && (
                        <span className="block text-[11px] text-steel">
                          {subs.find((s) => s.slug === p.subcategory)?.name_ar ?? p.subcategory}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {formatOMR(Number(p.price))}
                      {p.old_price && (
                        <span className="ms-2 text-xs text-steel line-through">{formatOMR(Number(p.old_price))}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          p.stock <= 0
                            ? "bg-red-50 text-red-700"
                            : p.stock <= 5
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {p.stock <= 0 ? "نفد" : p.stock <= 5 ? `آخر ${p.stock}` : p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex items-center justify-end gap-3">
                        <button type="button" onClick={() => openEdit(p)} className="flex items-center gap-1 text-xs text-accent hover:underline">
                          <Pencil size={12} strokeWidth={1.75} /> تعديل
                        </button>
                        <button type="button" onClick={() => remove(p)} className="flex items-center gap-1 text-xs text-steel transition-colors hover:text-red-600">
                          <Trash2 size={12} strokeWidth={1.75} /> حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-xs text-steel">
        <SlidersHorizontal size={11} className="me-1 inline" />
        {visible.length} من {products.length} منتج
      </p>
    </div>
  );
}
