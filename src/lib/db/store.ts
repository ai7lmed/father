"use client";

/* ============================================================
 * QAVEN — Data access layer (QavenStore)
 * ------------------------------------------------------------
 * واجهة واحدة غير متزامنة تستهلكها كل الصفحات. المحول الحالي
 * LocalStore يعمل على localStorage (عرض/تطوير). عند ربط قاعدة
 * البيانات: نكتب ApiStore بنفس الواجهة يستدعي REST/Prisma
 * ونستبدل سطرًا واحدًا في getStore() — بدون أي تغيير في UI.
 * ============================================================ */

import type {
  Customer,
  CustomerAddress,
  OrderRow,
  ReceiptRef,
} from "./schema";

export interface QavenStore {
  /* Auth — OTP */
  sendOtp(phone: string): Promise<{ ok: boolean; devCode?: string; error?: string }>;
  verifyOtp(phone: string, code: string): Promise<
    { ok: true; token: string; customer: Customer } | { ok: false; error: string }
  >;
  currentCustomer(): Promise<Customer | null>;
  signOut(): Promise<void>;

  /* Customer profile */
  updateCustomer(id: string, patch: Partial<Pick<Customer, "name" | "email">>): Promise<Customer>;

  /* Addresses */
  listAddresses(customerId: string): Promise<CustomerAddress[]>;
  saveAddress(customerId: string, input: Omit<CustomerAddress, "id" | "customerId"> & { id?: string }): Promise<CustomerAddress>;
  deleteAddress(customerId: string, addressId: string): Promise<void>;

  /* Orders */
  createOrder(input: {
    customer?: Customer | null;
    address: OrderRow["address"];
    items: OrderRow["items"];
    subtotal: number;
    deliveryMethod: "standard" | "fast";
    deliveryFee: number;
    total: number;
    paymentMethod: "cod" | "bank_transfer";
    receipt?: { dataUrl: string };
  }): Promise<OrderRow>;
  getOrder(id: string): Promise<OrderRow | null>;
  listOrders(customerId: string): Promise<OrderRow[]>;
}

/* ————————————————————————————————————————
 * LocalStore — محول التطوير (localStorage)
 * ———————————————————————————————————————— */

const DB_KEY = "qaven-db-v2";
const SESSION_KEY = "qaven-session-v2";

type DbShape = {
  customers: Customer[];
  addresses: CustomerAddress[];
  orders: OrderRow[];
  receipts: ReceiptRef[];
  otp: { id: string; phone: string; code: string; expiresAt: number }[];
};

function emptyDb(): DbShape {
  return { customers: [], addresses: [], orders: [], receipts: [], otp: [] };
}

function readDb(): DbShape {
  if (typeof window === "undefined") return emptyDb();
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) return emptyDb();
    return { ...emptyDb(), ...(JSON.parse(raw) as DbShape) };
  } catch {
    return emptyDb();
  }
}

function writeDb(db: DbShape) {
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // storage unavailable
  }
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeOmaniPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  // 9XXXXXXX أو 00968… أو +968…
  const local = digits.replace(/^(?:968|00968)/, "");
  return /^9\d{7}$/.test(local) ? local : null;
}

export class LocalStore implements QavenStore {
  async sendOtp(phoneRaw: string) {
    const phone = normalizeOmaniPhone(phoneRaw);
    if (!phone) return { ok: false as const, error: "رقم عُماني غير صحيح — 8 أرقام تبدأ بـ 9" };

    const db = readDb();
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const entry = { id: genId("otp"), phone, code, expiresAt: Date.now() + 10 * 60 * 1000 };
    db.otp = [...db.otp.filter((o) => o.phone !== phone), entry].slice(-20);
    writeDb(db);

    // الإنتاج: تُرسل عبر SMS provider. العرض: نُظهر الرمز في الواجهة.
    return { ok: true as const, devCode: code };
  }

  async verifyOtp(phoneRaw: string, code: string) {
    const phone = normalizeOmaniPhone(phoneRaw);
    if (!phone) return { ok: false as const, error: "رقم غير صحيح" };

    const db = readDb();
    const otp = db.otp.find((o) => o.phone === phone);
    if (!otp) return { ok: false as const, error: "اطلب رمزًا جديدًا" };
    if (otp.expiresAt < Date.now()) {
      db.otp = db.otp.filter((o) => o.id !== otp.id);
      writeDb(db);
      return { ok: false as const, error: "انتهت صلاحية الرمز — اطلب رمزًا جديدًا" };
    }
    if (otp.code !== code.trim()) return { ok: false as const, error: "الرمز غير صحيح" };

    // نجاح: استهلاك الرمز + إنشاء العميل إن كان جديدًا + جلسة
    db.otp = db.otp.filter((o) => o.id !== otp.id);
    let customer = db.customers.find((c) => c.phone === phone);
    if (!customer) {
      customer = { id: genId("cus"), phone, createdAt: new Date().toISOString() };
      db.customers = [...db.customers, customer];
    }
    const token = genId("tok");
    writeDb(db);
    try {
      window.localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ token, customerId: customer.id, at: Date.now() })
      );
    } catch {
      // ignore
    }
    return { ok: true as const, token, customer };
  }

  async currentCustomer() {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const { customerId } = JSON.parse(raw) as { customerId: string };
      return readDb().customers.find((c) => c.id === customerId) ?? null;
    } catch {
      return null;
    }
  }

  async signOut() {
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }

  async updateCustomer(id: string, patch: Partial<Pick<Customer, "name" | "email">>) {
    const db = readDb();
    const idx = db.customers.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("العميل غير موجود");
    db.customers[idx] = { ...db.customers[idx], ...patch };
    writeDb(db);
    return db.customers[idx];
  }

  async listAddresses(customerId: string) {
    return readDb()
      .addresses.filter((a) => a.customerId === customerId)
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  }

  async saveAddress(
    customerId: string,
    input: Omit<CustomerAddress, "id" | "customerId"> & { id?: string }
  ) {
    const db = readDb();
    let address: CustomerAddress;
    if (input.id) {
      const idx = db.addresses.findIndex((a) => a.id === input.id && a.customerId === customerId);
      if (idx === -1) throw new Error("العنوان غير موجود");
      address = { ...db.addresses[idx], ...input, id: input.id, customerId };
      db.addresses[idx] = address;
    } else {
      address = {
        id: genId("adr"),
        customerId,
        label: input.label,
        fullName: input.fullName,
        phone: input.phone,
        city: input.city,
        address: input.address,
        notes: input.notes,
        isDefault: input.isDefault,
      };
      db.addresses = [...db.addresses, address];
    }
    if (address.isDefault) {
      db.addresses = db.addresses.map((a) =>
        a.customerId === customerId && a.id !== address.id ? { ...a, isDefault: false } : a
      );
    }
    writeDb(db);
    return address;
  }

  async deleteAddress(customerId: string, addressId: string) {
    const db = readDb();
    db.addresses = db.addresses.filter(
      (a) => !(a.id === addressId && a.customerId === customerId)
    );
    writeDb(db);
  }

  async createOrder(input: {
    customer?: Customer | null;
    address: OrderRow["address"];
    items: OrderRow["items"];
    subtotal: number;
    deliveryMethod: "standard" | "fast";
    deliveryFee: number;
    total: number;
    paymentMethod: "cod" | "bank_transfer";
    receipt?: { dataUrl: string };
  }) {
    const order: OrderRow = {
      id: `QVN-${Date.now().toString(36).toUpperCase()}`,
      customerId: input.customer?.id,
      status: input.paymentMethod === "bank_transfer" ? "pending" : "confirmed",
      items: input.items,
      subtotal: input.subtotal,
      deliveryMethod: input.deliveryMethod,
      deliveryFee: input.deliveryFee,
      total: input.total,
      paymentMethod: input.paymentMethod,
      receiptAttached: Boolean(input.receipt?.dataUrl),
      address: input.address,
      placedAt: new Date().toISOString(),
    };

    const db = readDb();
    db.orders = [order, ...db.orders].slice(0, 200);
    if (input.receipt?.dataUrl) {
      db.receipts = [{ orderId: order.id, dataUrl: input.receipt.dataUrl }, ...db.receipts].slice(0, 100);
    }
    writeDb(db);

    // مرآة الجلسة لصفحة نجاح الطلب (تبقى بعد تفرّغ السلة)
    try {
      window.sessionStorage.setItem("qaven-order", JSON.stringify(order));
    } catch {
      // ignore
    }
    return order;
  }

  async getOrder(id: string) {
    return readDb().orders.find((o) => o.id === id) ?? null;
  }

  async listOrders(customerId: string) {
    return readDb().orders.filter((o) => o.customerId === customerId);
  }
}

/** نقطة التبديل الوحيدة عند ربط قاعدة البيانات الحقيقية */
let store: QavenStore | null = null;
export function getStore(): QavenStore {
  if (!store) store = new LocalStore();
  return store;
}
