// Положить рядом с cart api: lib/cart/api/guestOrder.js
import { $api, BASE_URL } from "../../../../API/api";

// ---------- Вход на сайт ----------
// Входом считается ТОЛЬКО обычный вход через страницу «Войти».
// Токен админ-панели (adminToken) здесь не учитывается.
const USER_TOKEN_KEYS = [
  "access_token",
  "accessToken",
  "accesToken",
  "acces_token",
];

export const getAccessToken = () => {
  if (typeof window === "undefined") return null;
  for (const key of USER_TOKEN_KEYS) {
    const value = localStorage.getItem(key);
    if (value && value !== "undefined" && value !== "null") return value;
  }
  return null;
};

export const isLoggedIn = () => !!getAccessToken();

const STORAGE_KEY = "guest_orders";
const API_ROOT = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;

// ---------- Хранение заказов гостя в браузере ----------

export const getGuestOrders = () => {
  if (typeof window === "undefined") return [];
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

// Ключ заказа: у гостевого — токен, у заказа из аккаунта — id
const orderKey = (o) =>
  o?.order_token ||
  (o?.id != null ? `id:${o.id}` : null) ||
  (o?.order_number ? `num:${o.order_number}` : null);

// Сохраняем в браузере и гостевые заказы, и заказы из аккаунта
export const saveGuestOrder = (order) => {
  const key = orderKey(order);
  if (typeof window === "undefined" || !key) return;
  try {
    const list = getGuestOrders();
    const prev =
      list.find((o) => orderKey(o) === key) ||
      (order.order_number
        ? list.find(
            (o) => String(o.order_number) === String(order.order_number),
          )
        : null) ||
      {};
    const merged = {
      id: order.id ?? prev.id,
      order_number: order.order_number ?? prev.order_number,
      order_token: order.order_token ?? prev.order_token,
      // телефон нужен, чтобы открыть заказ из аккаунта через поиск (хранится только в этом браузере)
      customer_phone:
        order.customer_phone ?? order.phone_number ?? prev.customer_phone,
      receipt_url: order.receipt_url ?? prev.receipt_url,
      total_price: order.total_price ?? prev.total_price,
      paid: order.paid === true || order.is_paid === true || prev.paid === true,
      payment_method: order.payment_method ?? prev.payment_method,
      expires_at:
        order.expires_at !== undefined ? order.expires_at : prev.expires_at,
      saved_at: prev.saved_at || new Date().toISOString(),
    };
    const next = [
      merged,
      ...list.filter(
        (o) =>
          orderKey(o) !== key &&
          !(
            order.order_number &&
            String(o.order_number) === String(order.order_number)
          ),
      ),
    ].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
};

// Убрать заказ из списка на этом устройстве (сам заказ на бэке не трогаем)
export const removeGuestOrder = ({ order_token, id, order_number } = {}) => {
  if (typeof window === "undefined") return;
  try {
    const next = getGuestOrders().filter(
      (o) =>
        !(
          (order_token && o.order_token === order_token) ||
          (id != null && id !== "" && String(o.id) === String(id)) ||
          (order_number && String(o.order_number) === String(order_number))
        ),
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
};

// Ссылка на страницу заказа
export const orderLink = (o) =>
  o?.order_token
    ? `/order?token=${encodeURIComponent(o.order_token)}`
    : o?.id != null
      ? `/order?id=${encodeURIComponent(o.id)}`
      : "/find-order";

// ---------- Помощники ----------

// 2611190427 -> "261119 0427"
export const formatOrderNumber = (num) => {
  const s = String(num ?? "").trim();
  if (/^\d{10}$/.test(s)) return `${s.slice(0, 6)} ${s.slice(6)}`;
  return s;
};

export const getProductImage = (product) =>
  product?.existing_images?.[0]?.image || product?.image || null;

export const guestReceiptUrl = (token) =>
  `${API_ROOT}ordering/orders/guest/${encodeURIComponent(token)}/receipt/`;

// Код статуса (in_stock, paid ...) — для перевода; если кода нет, берём текст как есть
export const getStatusCode = (order) => {
  const s = order?.status;
  return String(
    order?.status_display ||
      order?.status_name ||
      (s && typeof s === "object"
        ? s.code || s.name || s.title || s.label
        : s) ||
      "",
  );
};

// Дата заказа: бэк присылает formatted_date ("20.11.26 11:09") или created_at
export const getOrderDate = (order, locale = "ru-RU") => {
  if (order?.formatted_date) return order.formatted_date;
  if (!order?.created_at) return "";
  return new Date(order.created_at).toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getOrderItems = (order) =>
  order?.items || order?.order_items || order?.products || [];

// ---------- Запросы ----------

export const guestOrderApi = {
  getByToken: async (token) => {
    const { data } = await $api.get(
      `/ordering/orders/guest/${encodeURIComponent(token)}/`,
    );
    return data;
  },

  // Заказ из аккаунта по id. Бэк не отдаёт GET /ordering/orders/{id}/ обычному пользователю,
  // поэтому пробуем по очереди: поиск по номеру и телефону → история заказов аккаунта.
  getAccountOrder: async (id) => {
    const saved =
      getGuestOrders().find((o) => String(o.id) === String(id)) || {};
    const unwrap = (data) => data?.order || data;

    // Бэк теперь отдаёт владельцу его заказ по id (нужен вход)
    if (isLoggedIn()) {
      try {
        const { data } = await $api.get(
          `/ordering/orders/${encodeURIComponent(id)}/`,
        );
        if (data && (data.id != null || data.order_number)) return data;
      } catch {}
    }

    if (saved.order_number && saved.customer_phone) {
      try {
        const { data } = await $api.get("/ordering/orders/track/", {
          params: {
            order_number: saved.order_number,
            phone: saved.customer_phone,
          },
        });
        const order = unwrap(data);
        if (order && (order.id != null || order.order_number)) return order;
      } catch {}
    }

    if (isLoggedIn()) {
      const { data } = await $api.get("/ordering/orders/", {
        params: saved.order_number ? { search: saved.order_number } : {},
      });
      const list = Array.isArray(data) ? data : data?.results || [];
      const found = list.find(
        (o) =>
          String(o.id) === String(id) ||
          (saved.order_number &&
            String(o.order_number) === String(saved.order_number)),
      );
      if (found) return found;
    }

    throw new Error("order not found");
  },

  // Оплата QR: для гостевого заказа шлём X-Order-Token, токен входа добавляется сам
  pay: async (id, orderToken) => {
    const headers = orderToken ? { "X-Order-Token": orderToken } : {};
    const { data } = await $api.post(
      `/ordering/orders/${id}/pay/`,
      {},
      { headers },
    );
    return data;
  },

  // Заказы текущего аккаунта (нужен вход). Догружаем до 5 страниц, новые сверху.
  getMyOrders: async () => {
    const all = [];
    let url = "/ordering/orders/";
    for (let page = 0; page < 5 && url; page += 1) {
      const { data } = await $api.get(url);
      const list = Array.isArray(data) ? data : data?.results || [];
      all.push(...list);
      url = Array.isArray(data) ? null : data?.next || null;
    }
    return all.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  },

  track: async ({ order_number, phone }) => {
    const { data } = await $api.get("/ordering/orders/track/", {
      params: { order_number, phone },
    });
    return data;
  },
};

// Скачать квитанцию: гость — по токену, залогиненный — по id (JWT)
export const downloadReceipt = async ({
  token,
  id,
  orderNumber,
  receiptUrl,
}) => {
  const url = receiptUrl
    ? receiptUrl
    : token
      ? guestReceiptUrl(token)
      : `/ordering/orders/${id}/receipt/`;

  try {
    const res = await $api.get(url, { responseType: "blob" });
    const blobUrl = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `kvitanciya-${orderNumber || id || "zakaz"}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    return true;
  } catch (error) {
    // Не получилось скачать файлом — просто открываем картинку в новой вкладке
    if (receiptUrl || token) {
      window.open(receiptUrl || guestReceiptUrl(token), "_blank", "noopener");
      return true;
    }
    throw error;
  }
};

// ---------- Данные покупателя из аккаунта ----------

// Профиль может прийти как { name, surname, number } или вложенным { user: {...} }.
// Если профиля ещё нет — берём то, что сохранили при входе (localStorage "user").
export const getCustomerFromProfile = (profile) => {
  let stored = null;
  if (typeof window !== "undefined") {
    try {
      stored = JSON.parse(localStorage.getItem("user") || "null");
    } catch {}
  }

  const sources = [
    profile,
    profile?.user,
    profile?.profile,
    stored,
    stored?.user,
  ].filter(Boolean);
  const pick = (...keys) => {
    for (const src of sources) {
      for (const key of keys) {
        const value = src?.[key];
        if (typeof value === "string" && value.trim()) return value.trim();
        if (typeof value === "number") return String(value);
      }
    }
    return "";
  };

  const fullName =
    pick("full_name", "fullName") ||
    [
      pick("surname", "last_name", "lastName"),
      pick("name", "first_name", "firstName"),
    ]
      .filter(Boolean)
      .join(" ");

  return {
    name: fullName,
    phone: pick("number", "phone_number", "phone"),
  };
};

// ---------- Оплата и статус ----------

// Найти заказ, сохранённый на этом устройстве
export const findLocalOrder = (order) => {
  const list = getGuestOrders();
  return (
    list.find(
      (o) => order?.order_token && o.order_token === order.order_token,
    ) ||
    list.find((o) => order?.id != null && String(o.id) === String(order.id)) ||
    list.find(
      (o) =>
        order?.order_number &&
        String(o.order_number) === String(order.order_number),
    ) ||
    null
  );
};

// Пометить заказ оплаченным на этом устройстве (после возврата с Finik)
export const markOrderPaid = ({ order_number, order_token, id } = {}) => {
  if (typeof window === "undefined") return;
  const local = findLocalOrder({ order_number, order_token, id });
  saveGuestOrder({
    ...(local || {}),
    order_number: order_number || local?.order_number,
    order_token: order_token || local?.order_token,
    id: id ?? local?.id,
    paid: true,
  });
};

const PAID_STATUSES = ["paid", "paid_with_bonus", "completed", "delivered"];
// Статусы, которые сами говорят об оплате — тогда отдельный значок оплаты не нужен
export const PAYMENT_STATUS_CODES = [
  "awaiting_payment",
  "pending",
  "paid",
  "paid_with_bonus",
];
const CLOSED_STATUSES = ["cancelled", "canceled", "returned"];
const EXPIRED_STATUSES = ["expired"];

// Срок оплаты (бэк присылает expires_at). Возвращает Date или null
export const getExpiresAt = (order) => {
  const raw = order?.expires_at ?? order?.payment_deadline ?? order?.pay_until;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Срок оплаты истёк (по статусу с бэка или по времени)
export const isPaymentExpired = (order, now = Date.now()) => {
  const status = String(
    order?.status_display || order?.status_name || "",
  ).toLowerCase();
  if (EXPIRED_STATUSES.includes(status)) return true;
  if (order?.is_paid === true || order?.paid === true) return false;
  const expiresAt = getExpiresAt(order);
  return !!expiresAt && expiresAt.getTime() <= now;
};

// Состояние оплаты:
// "paid" | "bonus" | "cash" | "awaiting" | "unknown" | "closed"
export const getPaymentState = (order) => {
  if (!order) return "unknown";
  const status = String(
    order.status_display || order.status_name || "",
  ).toLowerCase();
  if (EXPIRED_STATUSES.includes(status)) return "expired";
  if (CLOSED_STATUSES.includes(status)) return "closed";
  if (order.payment_method === "bonus" || status === "paid_with_bonus")
    return "bonus";

  // 1) Если бэк прислал признак оплаты — верим ему
  if (order.is_paid === true || order.paid === true) return "paid";
  const paymentStatus = String(order.payment_status || "").toLowerCase();
  if (["paid", "success", "succeeded", "completed"].includes(paymentStatus))
    return "paid";
  if (PAID_STATUSES.includes(status)) return "paid";
  if (
    order.is_paid === false ||
    ["pending", "failed", "unpaid"].includes(paymentStatus)
  ) {
    if (order.payment_method === "cash") return "cash";
    return isPaymentExpired(order) ? "expired" : "awaiting";
  }

  if (order.payment_method === "cash") return "cash";

  // 2) Оплату на этом устройстве запомнили после возврата с Finik
  if (findLocalOrder(order)?.paid) return "paid";

  // Срок оплаты уже прошёл
  if (order.payment_method === "qr" && isPaymentExpired(order))
    return "expired";

  // 3) Бэк ничего не сообщил — точно не знаем
  return order.payment_method === "qr" ? "unknown" : "unknown";
};

// Можно ли показать кнопку «Оплатить»
export const needsPayment = (order) => {
  const state = getPaymentState(order);
  return (
    order?.payment_method === "qr" &&
    (state === "awaiting" || state === "unknown")
  );
};

// Цвет статуса: из бэка (color_code у статуса), иначе свой по смыслу
const STATUS_COLORS = {
  new: "#1e4ed8",
  expired: "#E35845",
  awaiting_payment: "#d97706",
  pending: "#d97706",
  processing: "#d97706",
  assembling: "#d97706",
  in_stock: "#27AE60",
  ready: "#27AE60",
  paid: "#27AE60",
  paid_with_bonus: "#27AE60",
  shipped: "#0891b2",
  delivering: "#0891b2",
  delivered: "#15803d",
  completed: "#15803d",
  returned: "#E35845",
  cancelled: "#E35845",
  canceled: "#E35845",
};

export const getStatusColor = (order) => {
  const s = order?.status;
  if (s && typeof s === "object" && s.color_code) return s.color_code;
  const fromItem = (order?.items || [])
    .map((i) => i?.status)
    .find(
      (st) =>
        st &&
        typeof st === "object" &&
        st.color_code &&
        (s == null || String(st.id) === String(s)),
    );
  if (fromItem) return fromItem.color_code;
  const code = String(
    order?.status_display || order?.status_name || "",
  ).toLowerCase();
  return STATUS_COLORS[code] || "#6b7280";
};

// Единица измерения товара (шт / м / компл). Бэк может прислать строкой или объектом.
export const getUnit = (...sources) => {
  for (const src of sources) {
    if (!src) continue;
    const value =
      src.unit_display ??
      src.unit_name ??
      src.unit ??
      src.measure ??
      src.measurement_unit;
    if (value && typeof value === "object") {
      const name = value.short_name || value.name || value.title;
      if (name) return String(name);
    } else if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
};

// Пометка для списка «Ваши заказы на этом устройстве» (по сохранённым данным)
export const getLocalOrderState = (o) => {
  if (!o) return "unknown";
  if (o.paid) return "paid";
  if (o.payment_method === "cash") return "cash";
  if (o.payment_method === "qr") {
    const expiresAt = getExpiresAt(o);
    if (expiresAt && expiresAt.getTime() <= Date.now()) return "expired";
    return "awaiting";
  }
  return "unknown";
};

// Формат даты срока: 22.11 09:09
export const formatDeadline = (date) =>
  date
    ? `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")} ` +
      `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
    : "";

// Время оформления заказа: created_at или formatted_date ("23.11.26 10:46")
export const getCreatedAt = (order) => {
  if (order?.created_at) {
    const d = new Date(order.created_at);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const m = String(order?.formatted_date || "").match(
    /^(\d{2})\.(\d{2})\.(\d{2,4})\s+(\d{1,2}):(\d{2})/,
  );
  if (!m) return null;
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  return new Date(
    year,
    Number(m[2]) - 1,
    Number(m[1]),
    Number(m[4]),
    Number(m[5]),
  );
};

// Понятная дата срока: «сегодня в 11:16», «завтра в 09:00», «24 ноября в 11:16»
export const formatDeadlineHuman = (
  date,
  { lang = "ru", today = "сегодня", tomorrow = "завтра", at = "в" } = {},
) => {
  if (!date) return "";
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  const startOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(date) - startOfDay(new Date())) / 86400000,
  );
  if (diffDays === 0) return `${today} ${at} ${time}`;
  if (diffDays === 1) return `${tomorrow} ${at} ${time}`;
  let day;
  try {
    day = date.toLocaleDateString(
      lang === "ky" ? "ky-KG" : lang === "en" ? "en-GB" : "ru-RU",
      {
        day: "numeric",
        month: "long",
      },
    );
  } catch {
    day = `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  return `${day} ${at} ${time}`;
};

// Действует ли вход на самом деле: спрашиваем бэк (/api/profile/me/).
// Если вход действует, а куки "access" нет — восстанавливаем её (её проверяет личный кабинет).
export const checkAuthValid = async () => {
  const token = getAccessToken();
  if (!token) return false;
  try {
    // Проверяем именно токен обычного входа (а не админ-панели)
    await $api.get("/api/profile/me/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (
      typeof document !== "undefined" &&
      !/(?:^|;\s*)access=/.test(document.cookie)
    ) {
      const maxAge = 7 * 24 * 60 * 60;
      document.cookie = `access=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
    return true;
  } catch {
    return false;
  }
};
