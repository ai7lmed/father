"use client";

import { useCallback, useEffect, useState } from "react";
import { Spinner } from "../ui";

type Cat = { slug: string; name: string; name_ar: string; sort_order: number };
type Sub = { slug: string; parent: string; name: string; name_ar: string };

export default function AdminCategories() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: "category", slug: "", parent: "", name: "", name_ar: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch("/api/admin/categories", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setCats(d.categories ?? []);
    setSubs(d.subcategories ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    setSaving(true);
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setForm({ type: form.type, slug: "", parent: "", name: "", name_ar: "" });
    await load();
  };

  const remove = async (type: string, slug: string) => {
    if (!confirm(`حذف ${slug}؟`)) return;
    await fetch(`/api/admin/categories?type=${type}&slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
    await load();
  };

  const inputCls = "h-10 w-full rounded-lg border border-mist bg-white px-3 text-sm outline-none focus:border-accent";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-xl border border-mist bg-white p-5">
        <h3 className="text-sm font-semibold text-ink">إضافة تصنيف</h3>
        <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
          <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="category">تصنيف رئيسي</option>
            <option value="subcategory">تصنيف فرعي</option>
          </select>
          {form.type === "subcategory" && (
            <select className={inputCls} value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })}>
              <option value="">— الأب —</option>
              {cats.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name_ar}</option>
              ))}
            </select>
          )}
          <input className={inputCls} placeholder="slug (بالإنجليزية)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" />
          <input className={inputCls} placeholder="الاسم (عربي)" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
          <input className={inputCls} placeholder="Name (English)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} dir="ltr" />
        </div>
        <button
          type="button"
          onClick={add}
          disabled={saving || !form.slug || !form.name_ar || (form.type === "subcategory" && !form.parent)}
          className="mt-4 h-10 rounded-lg bg-ink px-6 text-sm font-medium text-white hover:bg-accent disabled:opacity-40"
        >
          {saving ? "…" : "إضافة"}
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink">الرئيسية ({cats.length})</h3>
            <div className="space-y-2">
              {cats.map((c) => (
                <div key={c.slug} className="flex items-center justify-between rounded-lg border border-mist bg-white px-4 py-3">
                  <div>
                    <span className="text-sm font-medium text-ink">{c.name_ar}</span>
                    <span dir="ltr" className="ms-2 text-xs text-steel">{c.slug}</span>
                  </div>
                  <button type="button" onClick={() => remove("category", c.slug)} className="text-xs text-steel hover:text-red-600">
                    حذف
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink">الفرعية ({subs.length})</h3>
            <div className="space-y-2">
              {subs.map((s) => (
                <div key={s.slug} className="flex items-center justify-between rounded-lg border border-mist bg-white px-4 py-3">
                  <div>
                    <span className="text-sm font-medium text-ink">{s.name_ar}</span>
                    <span dir="ltr" className="ms-2 text-xs text-steel">
                      {s.parent} / {s.slug}
                    </span>
                  </div>
                  <button type="button" onClick={() => remove("subcategory", s.slug)} className="text-xs text-steel hover:text-red-600">
                    حذف
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
