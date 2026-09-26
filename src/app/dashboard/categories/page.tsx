"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Spinner, EmptyCard, ErrorCard, useToast } from "../ui";

type Cat = {
  slug: string;
  name: string;
  name_ar: string;
  img: string | null;
  active: boolean;
  sort_order: number;
  products_count: number;
};
type Sub = {
  slug: string;
  parent: string;
  name: string;
  name_ar: string;
  img: string | null;
  active: boolean;
  sort_order: number;
  products_count: number;
};

type EditRow = {
  type: "category" | "subcategory";
  slug: string;
  name: string;
  name_ar: string;
  img: string;
};

export default function AdminCategories() {
  const toast = useToast();
  const [cats, setCats] = useState<Cat[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [form, setForm] = useState({ type: "category", slug: "", parent: "", name: "", name_ar: "", img: "" });
  const [saving, setSaving] = useState(false);
  const [editRow, setEditRow] = useState<EditRow | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);
    try {
      const d = await fetch("/api/admin/categories", { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(String(r.status)))
      );
      setCats(d.categories ?? []);
      setSubs(d.subcategories ?? []);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ——— إضافة ——— */
  const add = async () => {
    if (!form.slug.trim() || !form.name_ar.trim() || !form.name.trim() || (form.type === "subcategory" && !form.parent)) {
      toast.error("أكمل الحقول المطلوبة");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error);
      toast.success(form.type === "subcategory" ? "أُنشئ التصنيف الفرعي" : "أُنشئ القسم");
      setForm({ type: form.type, slug: "", parent: "", name: "", name_ar: "", img: "" });
      await load();
    } catch (e) {
      toast.error(
        e instanceof Error && e.message === "duplicate_slug"
          ? "المعرّف (slug) مستخدم — اختر غيره"
          : "تعذر الإنشاء"
      );
    } finally {
      setSaving(false);
    }
  };

  /* ——— حفظ التعديل ——— */
  const saveEdit = async () => {
    if (!editRow) return;
    setSavingEdit(true);
    try {
      const r = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: editRow.type,
          slug: editRow.slug,
          name: editRow.name,
          name_ar: editRow.name_ar,
          img: editRow.img || null,
        }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error);
      toast.success("حُفظت التعديلات");
      setEditRow(null);
      await load();
    } catch {
      toast.error("تعذر حفظ التعديل");
    } finally {
      setSavingEdit(false);
    }
  };

  /* ——— تفعيل/إخفاء ——— */
  const toggleActive = async (type: "category" | "subcategory", slug: string, active: boolean) => {
    const r = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, slug, active }),
    });
    const d = await r.json();
    if (d.ok) {
      toast.success(active ? "أُظهر القسم" : "أُخفي القسم (لن يظهر في المتجر)");
      await load();
    } else toast.error("تعذر التنفيذ");
  };

  /* ——— ترتيب ——— */
  const reorder = async (type: "category" | "subcategory", list: (Cat | Sub)[], index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    /* تحديث متفائل ثم حفظ */
    if (type === "category") setCats(next as Cat[]);
    else setSubs(next as Sub[]);
    const r = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, order: next.map((x) => x.slug) }),
    });
    const d = await r.json();
    if (d.ok) toast.success("حُفظ الترتيب");
    else {
      toast.error("تعذر حفظ الترتيب");
      await load();
    }
  };

  /* ——— حذف ——— */
  const remove = async (type: "category" | "subcategory", slug: string, count: number) => {
    if (type === "subcategory") {
      const ok = await toast.confirmDanger(`حذف التصنيف الفرعي «${slug}»؟ ستفقد ربط المنتجات به.`);
      if (!ok) return;
    } else {
      if (count > 0) {
        toast.error(`لا يمكن الحذف: القسم يحتوي ${count} منتج. أخفِه بدلاً من حذفه.`);
        return;
      }
      const ok = await toast.confirmDanger(`حذف القسم «${slug}» نهائياً؟`);
      if (!ok) return;
    }
    const r = await fetch(`/api/admin/categories?type=${type}&slug=${encodeURIComponent(slug)}`, {
      method: "DELETE",
    });
    const d = await r.json();
    if (d.ok) {
      toast.success("حُذف بنجاح");
      await load();
    } else toast.error("تعذر الحذف");
  };

  const inputCls =
    "h-10 w-full rounded-lg border border-mist bg-white px-3 text-sm outline-none focus:border-accent";

  const rowCategoryAndSubs = (slug: string) =>
    subs.filter((s) => s.parent === slug).map((s) => s.name_ar).join("، ") || "—";

  const catRow = (c: Cat, i: number) => (
    <div key={c.slug} className="rounded-xl border border-mist bg-white">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        {c.img ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={c.img} alt="" className="h-11 w-11 rounded-lg border border-mist object-cover" />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-paper text-steel ring-1 ring-mist">
            <ImageIcon size={16} strokeWidth={1.5} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-ink">{c.name_ar}</span>
            <span dir="ltr" className="text-xs text-steel">{c.slug}</span>
            <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] text-graphite ring-1 ring-mist">
              {c.products_count} منتج
            </span>
            {!c.active && (
              <span className="rounded-full bg-mist px-2 py-0.5 text-[11px] text-steel">مخفي</span>
            )}
          </div>
          <span className="mt-0.5 block text-[11px] text-steel">
            الفرعية: {rowCategoryAndSubs(c.slug)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={`/dashboard/products?category=${encodeURIComponent(c.slug)}`}
            className="me-1 flex h-8 items-center gap-1 rounded-lg border border-mist px-2.5 text-[11px] text-graphite transition-colors hover:border-accent hover:text-accent"
            title="إضافة منتج لهذا القسم"
          >
            <Plus size={12} strokeWidth={2} /> منتج
          </a>
          <button type="button" aria-label="أعلى" disabled={i === 0} onClick={() => reorder("category", cats, i, -1)} className="rounded p-1.5 text-steel transition-colors hover:text-ink disabled:opacity-25">
            <ArrowUp size={14} strokeWidth={1.75} />
          </button>
          <button type="button" aria-label="أسفل" disabled={i === cats.length - 1} onClick={() => reorder("category", cats, i, 1)} className="rounded p-1.5 text-steel transition-colors hover:text-ink disabled:opacity-25">
            <ArrowDown size={14} strokeWidth={1.75} />
          </button>
          <button type="button" aria-label={c.active ? "إخفاء" : "إظهار"} onClick={() => toggleActive("category", c.slug, !c.active)} className="rounded p-1.5 text-steel transition-colors hover:text-ink">
            {c.active ? <Eye size={14} strokeWidth={1.75} /> : <EyeOff size={14} strokeWidth={1.75} />}
          </button>
          <button type="button" aria-label="تعديل" onClick={() => setEditRow({ type: "category", slug: c.slug, name: c.name, name_ar: c.name_ar, img: c.img ?? "" })} className="rounded p-1.5 text-accent transition-colors hover:text-ink">
            <Pencil size={14} strokeWidth={1.75} />
          </button>
          <button type="button" aria-label="حذف" onClick={() => remove("category", c.slug, c.products_count)} className="rounded p-1.5 text-steel transition-colors hover:text-red-600">
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* الفرعية التابعة */}
      {subs.some((s) => s.parent === c.slug) && (
        <div className="border-t border-mist bg-paper/60 px-4 py-2.5">
          <div className="space-y-1.5">
            {subs
              .filter((s) => s.parent === c.slug)
              .map((s) => {
                const si = subs.findIndex((x) => x.slug === s.slug);
                return (
                  <div key={s.slug} className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-mist">
                    <span className="text-xs font-medium text-ink">{s.name_ar}</span>
                    <span dir="ltr" className="text-[11px] text-steel">{s.slug}</span>
                    <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] text-graphite ring-1 ring-mist">
                      {s.products_count} منتج
                    </span>
                    {!s.active && <span className="rounded-full bg-mist px-2 py-0.5 text-[10px] text-steel">مخفي</span>}
                    <div className="ms-auto flex items-center gap-1">
                      <button type="button" aria-label="أعلى" disabled={si === 0} onClick={() => reorder("subcategory", subs, si, -1)} className="rounded p-1 text-steel hover:text-ink disabled:opacity-25">
                        <ArrowUp size={12} strokeWidth={1.75} />
                      </button>
                      <button type="button" aria-label="أسفل" disabled={si === subs.length - 1} onClick={() => reorder("subcategory", subs, si, 1)} className="rounded p-1 text-steel hover:text-ink disabled:opacity-25">
                        <ArrowDown size={12} strokeWidth={1.75} />
                      </button>
                      <button type="button" aria-label={s.active ? "إخفاء" : "إظهار"} onClick={() => toggleActive("subcategory", s.slug, !s.active)} className="rounded p-1 text-steel hover:text-ink">
                        {s.active ? <Eye size={12} strokeWidth={1.75} /> : <EyeOff size={12} strokeWidth={1.75} />}
                      </button>
                      <button type="button" aria-label="تعديل" onClick={() => setEditRow({ type: "subcategory", slug: s.slug, name: s.name, name_ar: s.name_ar, img: s.img ?? "" })} className="rounded p-1 text-accent hover:text-ink">
                        <Pencil size={12} strokeWidth={1.75} />
                      </button>
                      <button type="button" aria-label="حذف" onClick={() => remove("subcategory", s.slug, s.products_count)} className="rounded p-1 text-steel hover:text-red-600">
                        <Trash2 size={12} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      {/* إضافة */}
      <div className="rounded-xl border border-mist bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-ink">إضافة قسم جديد</h3>
            <p className="mt-1 text-xs text-steel">
              مثال: أنشئ قسم «هواتف»، ثم أضف تحته تصنيفات فرعية، ثم اربط منتجاته من زر «منتج» في صف القسم.
            </p>
          </div>
          <span className="rounded-full bg-paper px-3 py-1 text-[11px] text-steel ring-1 ring-mist">
            القسم أولاً، ثم الفرعية، ثم المنتجات
          </span>
        </div>
        <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
          <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="category">قسم رئيسي</option>
            <option value="subcategory">تصنيف فرعي</option>
          </select>
          {form.type === "subcategory" && (
            <select className={inputCls} value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })}>
              <option value="">— القسم الأب —</option>
              {cats.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name_ar}</option>
              ))}
            </select>
          )}
          <input className={inputCls} placeholder="المعرّف slug (بالإنجليزية، مثل: drones)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" />
          <input className={inputCls} placeholder="الاسم بالعربية" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
          <input className={inputCls} placeholder="Name (English)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} dir="ltr" />
          <input className={inputCls} placeholder="رابط صورة القسم (اختياري)" value={form.img} onChange={(e) => setForm({ ...form, img: e.target.value })} dir="ltr" />
        </div>
        <button
          type="button"
          onClick={add}
          disabled={saving}
          className="mt-4 flex h-10 items-center gap-2 rounded-lg bg-ink px-6 text-sm font-medium text-white transition-colors hover:bg-accent disabled:opacity-40"
        >
          <Plus size={15} strokeWidth={2} />
          {saving ? "جارٍ الإنشاء…" : form.type === "subcategory" ? "إضافة تصنيف فرعي" : "إضافة القسم"}
        </button>
      </div>

      {/* التعديل داخل الصفحة */}
      {editRow && (
        <div className="rounded-xl border border-accent/40 bg-white p-5 ring-4 ring-accent/5">
          <h3 className="text-sm font-semibold text-ink">
            تعديل: {editRow.name_ar} <span dir="ltr" className="text-xs font-normal text-steel">({editRow.slug})</span>
          </h3>
          <div className="mt-4 grid gap-3.5 sm:grid-cols-3">
            <input className={inputCls} placeholder="الاسم بالعربية" value={editRow.name_ar} onChange={(e) => setEditRow({ ...editRow, name_ar: e.target.value })} />
            <input className={inputCls} placeholder="Name (English)" value={editRow.name} onChange={(e) => setEditRow({ ...editRow, name: e.target.value })} dir="ltr" />
            <input className={inputCls} placeholder="رابط الصورة" value={editRow.img} onChange={(e) => setEditRow({ ...editRow, img: e.target.value })} dir="ltr" />
          </div>
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={saveEdit} disabled={savingEdit} className="h-10 rounded-lg bg-ink px-6 text-sm font-medium text-white transition-colors hover:bg-accent disabled:opacity-40">
              {savingEdit ? "…" : "حفظ"}
            </button>
            <button type="button" onClick={() => setEditRow(null)} className="h-10 rounded-lg border border-mist px-6 text-sm text-graphite transition-colors hover:border-steel hover:text-ink">
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* القوائم */}
      {loading ? (
        <Spinner />
      ) : loadErr ? (
        <ErrorCard text="تعذر تحميل الأقسام." onRetry={load} />
      ) : cats.length === 0 ? (
        <EmptyCard text="لا توجد أقسام — أضف أول قسم." />
      ) : (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-ink">الأقسام ({cats.length})</h3>
          {cats.map(catRow)}
        </section>
      )}
    </div>
  );
}
