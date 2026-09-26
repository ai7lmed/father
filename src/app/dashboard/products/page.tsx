"use client";

import { useCallback, useEffect, useState } from "react";
import { formatOMR, Spinner } from "../ui";

type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string | null;
  price: number;
  old_price: number | null;
  img: string;
  badge: string | null;
  stock: number;
};

type Cat = { slug: string; name_ar: string };

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

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [subs, setSubs] = useState<{ slug: string; parent: string; name_ar: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<typeof EMPTY | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, c] = await Promise.all([
      fetch("/api/admin/products", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
      fetch("/api/admin/categories", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
    ]);
    setProducts(p.products ?? []);
    setCats(c.categories ?? []);
    setSubs(c.subcategories ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = products.filter(
    (p) =>
      !q.trim() ||
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.id.toLowerCase().includes(q.toLowerCase())
  );

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const payload = {
      id: editing.id || undefined,
      name: editing.name,
      brand: editing.brand,
      category: editing.category,
      subcategory: editing.subcategory || null,
      price: Number(editing.price) || 0,
      old_price: editing.old_price ? Number(editing.old_price) : null,
      img: editing.img,
      badge: editing.badge || null,
      is_featured: editing.is_featured,
      is_new: editing.is_new,
      stock: Number(editing.stock) || 0,
      desc: editing.desc,
    };
    const isNew = !editing.id;
    await fetch(isNew ? "/api/admin/products" : `/api/admin/products/${editing.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setEditing(null);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm(`حذف المنتج ${id}؟`)) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    await load();
  };

  const inputCls =
    "h-10 w-full rounded-lg border border-mist bg-white px-3 text-sm outline-none focus:border-accent";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث باسم المنتج أو SKU…"
          className="h-10 min-w-52 flex-1 rounded-lg border border-mist bg-white px-3.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => setEditing({ ...EMPTY })}
          className="h-10 rounded-lg bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-accent"
        >
          + إضافة منتج
        </button>
      </div>

      {editing && (
        <div className="rounded-xl border border-mist bg-white p-5">
          <h3 className="text-sm font-semibold text-ink">
            {editing.id ? `تعديل: ${editing.name}` : "منتج جديد"}
          </h3>
          <div className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {!editing.id && (
              <label className="block">
                <span className="mb-1 block text-xs text-graphite">SKU (اختياري)</span>
                <input className={inputCls} value={editing.id} onChange={(e) => setEditing({ ...editing, id: e.target.value })} dir="ltr" />
              </label>
            )}
            <label className="block">
              <span className="mb-1 block text-xs text-graphite">الاسم</span>
              <input className={inputCls} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-graphite">الماركة</span>
              <input className={inputCls} value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-graphite">التصنيف</span>
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
              <span className="mb-1 block text-xs text-graphite">السعر (ر.ع)</span>
              <input className={inputCls} type="number" step="0.1" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} dir="ltr" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-graphite">السعر قبل الخصم</span>
              <input className={inputCls} type="number" step="0.1" value={editing.old_price} onChange={(e) => setEditing({ ...editing, old_price: e.target.value })} dir="ltr" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-graphite">المخزون</span>
              <input className={inputCls} type="number" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: e.target.value })} dir="ltr" />
            </label>
            <label className="block sm:col-span-2 lg:col-span-3">
              <span className="mb-1 block text-xs text-graphite">رابط الصورة</span>
              <input className={inputCls} value={editing.img} onChange={(e) => setEditing({ ...editing, img: e.target.value })} dir="ltr" placeholder="https://…" />
            </label>
            <label className="block sm:col-span-2 lg:col-span-3">
              <span className="mb-1 block text-xs text-graphite">الوصف</span>
              <input className={inputCls} value={editing.desc} onChange={(e) => setEditing({ ...editing, desc: e.target.value })} />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-graphite">
              <input type="checkbox" checked={editing.is_featured} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} className="h-4 w-4 accent-[#2e6ba8]" />
              مميز
            </label>
            <label className="flex items-center gap-2 text-sm text-graphite">
              <input type="checkbox" checked={editing.is_new} onChange={(e) => setEditing({ ...editing, is_new: e.target.checked })} className="h-4 w-4 accent-[#2e6ba8]" />
              جديد
            </label>
            <select className={`${inputCls} w-auto`} value={editing.badge} onChange={(e) => setEditing({ ...editing, badge: e.target.value })}>
              <option value="">بدون شارة</option>
              <option value="New">New</option>
              <option value="Best Seller">Best Seller</option>
              <option value="Limited">Limited</option>
              <option value="Sale">Sale</option>
            </select>
          </div>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={save} disabled={saving || !editing.name || !editing.category || !editing.img}
              className="h-10 rounded-lg bg-ink px-6 text-sm font-medium text-white transition-colors hover:bg-accent disabled:opacity-40">
              {saving ? "جارٍ الحفظ…" : "حفظ"}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="h-10 rounded-lg border border-mist px-6 text-sm text-graphite hover:border-steel hover:text-ink">
              إلغاء
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-mist bg-white">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-paper text-xs text-steel">
              <tr>
                <th className="px-4 py-3 text-start font-medium">المنتج</th>
                <th className="px-4 py-3 text-start font-medium">التصنيف</th>
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
                  <td className="px-4 py-3 text-xs text-graphite">{p.category}</td>
                  <td className="px-4 py-3">{formatOMR(Number(p.price))}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock <= 5 ? "font-semibold text-ink" : "text-graphite"}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <button
                      type="button"
                      onClick={() =>
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
                          is_featured: false,
                          is_new: false,
                          stock: String(p.stock),
                          desc: "",
                        })
                      }
                      className="text-xs text-accent hover:underline"
                    >
                      تعديل
                    </button>
                    <button type="button" onClick={() => remove(p.id)} className="ms-3 text-xs text-steel hover:text-red-600">
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
