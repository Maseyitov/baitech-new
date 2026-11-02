// ─── Числа и склонения ──────────────────────────────────────────────────────

export const formatNumber = (n) => Number(n || 0).toLocaleString("ru-RU");

// plural(5, ["просмотр", "просмотра", "просмотров"]) → "просмотров"
export const plural = (n, [one, few, many]) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
};

export const VIEWS_FORMS = ["просмотр", "просмотра", "просмотров"];
export const VISITORS_FORMS = ["посетитель", "посетителя", "посетителей"];
export const DAYS_FORMS = ["день", "дня", "дней"];

export const percent = (part, total) =>
  total ? Math.round((part / total) * 100) : 0;

// ─── Даты ───────────────────────────────────────────────────────────────────
// ─── Периоды ────────────────────────────────────────────────────────────────

// id — значение, которое уходит на бэкенд. Если там другие значения — поменяйте.
export const PERIODS = [
  { id: "week", label: "Неделя", text: "за неделю" },
  { id: "month", label: "Месяц", text: "за месяц" },
  { id: "year", label: "Год", text: "за год" },
];

export const periodText = (periodId, days) =>
  PERIODS.find((p) => p.id === periodId)?.text ||
  `за ${days} ${plural(days, DAYS_FORMS)}`;

// ─── Даты и точки графика ───────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, "0");
const dayKey = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

const pointKey = (t, group) =>
  group === "month" ? String(t).slice(0, 7) : String(t).slice(0, 10);

const parseKey = (key) => {
  const [y, m, d] = String(key).split(/[-T]/).map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Заполняем пропуски нулями, чтобы на графике был весь период
export const fillSeries = (series = [], group = "day", days = 30) => {
  const map = new Map(series.map((p) => [pointKey(p.day, group), p]));
  const make = (key) => {
    const f = map.get(key);
    return {
      day: key,
      views: f?.views ?? 0,
      visitors: f?.visitors ?? 0,
      pages: f?.pages ?? [],
      countries: f?.countries ?? [],
    };
  };

  const today = new Date();
  const result = [];

  if (group === "day") {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      result.push(make(dayKey(d)));
    }
    return result;
  }

  if (group === "month") {
    const count = Math.max(1, Math.round(days / 30));
    for (let i = count - 1; i >= 0; i--) {
      result.push(
        make(monthKey(new Date(today.getFullYear(), today.getMonth() - i, 1))),
      );
    }
    return result;
  }

  // week / hour / другое — показываем как есть
  return series.map((p) => make(pointKey(p.day, group)));
};

// variant: "short" — подпись под столбиком, "long" — подсказка, "full" — заголовок карточки
export const formatPoint = (key, group = "day", variant = "short") => {
  const date = parseKey(key);
  if (Number.isNaN(date.getTime())) return String(key);

  if (group === "month") {
    if (variant === "short")
      return date
        .toLocaleDateString("ru-RU", { month: "short" })
        .replace(".", "");
    return capitalize(
      date
        .toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
        .replace(" г.", ""),
    );
  }

  if (group === "week") {
    if (variant === "short")
      return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
      });
    return `Неделя с ${date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}`;
  }

  // day
  if (variant === "short")
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
    });
  if (variant === "long")
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  return capitalize(
    date.toLocaleDateString("ru-RU", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  );
};

export const CHART_TITLES = {
  day: "Посещаемость по дням",
  week: "Посещаемость по неделям",
  month: "Посещаемость по месяцам",
};
// "Пятница, 30 октября"
export const formatDayFull = (key) => {
  const text = parseDay(key).toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// ─── Страны ─────────────────────────────────────────────────────────────────

const COUNTRY_OVERRIDES = { KG: "Кыргызстан" };

let regionNames = null;
try {
  regionNames = new Intl.DisplayNames(["ru"], { type: "region" });
} catch {
  regionNames = null;
}

export const countryName = (code) => {
  if (!code) return "Неизвестно";
  const upper = String(code).toUpperCase();
  if (COUNTRY_OVERRIDES[upper]) return COUNTRY_OVERRIDES[upper];
  try {
    return regionNames?.of(upper) || upper;
  } catch {
    return upper;
  }
};

// ─── Страницы сайта ─────────────────────────────────────────────────────────
const normalizePath = (path) => {
  const p = String(path || "/").split("?")[0];
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
};

// Точные адреса
const PAGE_NAMES = {
  "/": "Главная",
  "/catalog": "Каталог",
  "/about": "О компании",
  "/solution": "Решения",
  "/garantiya": "Гарантия",
  "/kurs-videonablyudenie": "Курс видеонаблюдения",
  "/login": "Вход",
  "/register": "Регистрация",
  "/forgot-password": "Восстановление пароля",
  "/profile": "Личный кабинет",
  "/productss": "Товары",
  "/order-table": "Заказы",
  "/our-banner": "Баннеры",
  "/users-table": "Пользователи",
  "/setting-web": "Настройки сайта",
  "/stats": "Статистика",
};

// Части адреса — для вложенных страниц
const SEGMENT_NAMES = {
  solution: "Решения",
  catalog: "Каталог",
  "sistemy-bezopasnosti": "Системы безопасности",
  skud: "СКУД",
  videonablyudenie: "Видеонаблюдение",
  infrastruktura: "Инфраструктура",
  "promyshlennaya-svyaz": "Промышленная связь",
};

export const pageName = (path) => {
  const p = normalizePath(path);
  if (PAGE_NAMES[p]) return PAGE_NAMES[p];

  const segments = p.split("/").filter(Boolean);
  if (segments.length && segments.every((s) => SEGMENT_NAMES[s])) {
    const names = segments
      .map((s) => SEGMENT_NAMES[s])
      .filter((name, i, arr) => name !== arr[i - 1]); // убираем повторы подряд
    return names.join(" → ");
  }
  return p;
};

const ADMIN_PATHS = [
  "/productss",
  "/order-table",
  "/our-banner",
  "/users-table",
  "/setting-web",
  "/stats",
  "/add-product",
  "/edit-product",
  "/admin",
];

export const isAdminPath = (path) => {
  const p = normalizePath(path);
  return ADMIN_PATHS.some((a) => p === a || p.startsWith(`${a}/`));
};

// Адреса, которые ищут боты-сканеры (у вас не WordPress, живые люди туда не ходят)
const BOT_PATTERNS = [
  /wp-json/i,
  /wp-admin/i,
  /wp-login/i,
  /xmlrpc/i,
  /\.env/i,
  /\.php$/i,
  /phpmyadmin/i,
];

export const isBotPath = (path) =>
  BOT_PATTERNS.some((re) => re.test(String(path || "")));
