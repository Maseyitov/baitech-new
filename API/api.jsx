import axios from "axios";

const DIRECT_URL = process.env.NEXT_PUBLIC_API_URL || "https://baitech.kg/";

// Прокси /backend/ — только в браузере и только когда включён в .env.local
export const BASE_URL =
  typeof window !== "undefined" && process.env.NEXT_PUBLIC_USE_PROXY === "1"
    ? "/backend/"
    : DIRECT_URL;

    const USE_PROXY =
  typeof window !== "undefined" && process.env.NEXT_PUBLIC_USE_PROXY === "1";

// Через прокси бэк отдаёт ссылки на картинки вида https://localhost:3000/media/...
// Возвращаем их на настоящий домен
const fixProxyUrl = (value) => {
  if (!USE_PROXY || typeof value !== "string") return value;
  const host = window.location.host;
  if (value.startsWith(`https://${host}/`) || value.startsWith(`http://${host}/`)) {
    const root = DIRECT_URL.endsWith("/") ? DIRECT_URL : `${DIRECT_URL}/`;
    return value.replace(/^https?:\/\/[^/]+\//, root);
  }
  return value;
};

export const WSS_URL = "baitech";

const TOKEN_KEYS = ["accessToken", "access_token", "accesToken", "acces_token"];

// Единая проверка: вошёл ли пользователь (токен в localStorage)
export const getAccessToken = () => {
  if (typeof window === "undefined") return null;
  const adminToken = localStorage.getItem("adminToken");
  if (adminToken && adminToken !== "undefined" && adminToken !== "null") {
    return adminToken;
  }
  for (const key of TOKEN_KEYS) {
    const value = localStorage.getItem(key);
    if (value && value !== "undefined" && value !== "null") return value;
  }
  return null;
};

export const isLoggedIn = () => !!getAccessToken();

const clearAuthTokens = () => {
  [
    ...TOKEN_KEYS,
    "refresh_token",
    "adminToken",
    "adminRefreshToken",
    "isAdmin",
    "userRole",
    "user",
  ].forEach((key) => localStorage.removeItem(key));
};

export const $api = axios.create({
  baseURL: BASE_URL,
  // Гостевая корзина хранится в cookie cart_token — без этого бэк её не увидит
  withCredentials: true,
});

$api.interceptors.request.use(
  (config) => {
    if (!config.headers.Authorization) {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config._autoAuth = true;
      }
    }

    if (typeof window !== "undefined") {
      const currentLanguage = localStorage.getItem("language") || "ru";
      config.headers["Accept-Language"] = currentLanguage;
    }

    config.headers["ngrok-skip-browser-warning"] = "true";

    return config;
  },
  (error) => Promise.reject(error),
);

$api.interceptors.response.use(
  (response) => {
    const data = response.data;
    // Файлы (квитанция PNG) не переводим — иначе они ломаются
    if (
      (typeof Blob !== "undefined" && data instanceof Blob) ||
      (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer)
    ) {
      return response;
    }

    const lang =
      (typeof window !== "undefined" && localStorage.getItem("language")) ||
      "ru";

    const translate = (obj) => {
      if (Array.isArray(obj)) return obj.map(translate);
      if (obj && typeof obj === "object") {
        const newObj = {};
        for (const key in obj) {
          if (key.endsWith("_ru") || key.endsWith("_en") || key.endsWith("_ky"))
            continue;

          // name не трогаем — берём как есть
          if (key === "name") {
            newObj[key] = obj[key];
            continue;
          }

          const translated =
            obj[`${key}_${lang}`] ?? obj[`${key}_ru`] ?? obj[key];
          newObj[key] = translate(translated);
        }
        return newObj;
      }
            return fixProxyUrl(obj);
    };

    response.data = translate(data);
    return response;
  },
  (error) => {
    const config = error.config;

    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearAuthTokens();
      window.dispatchEvent(new Event("authChange"));

      // Токен протух — запрос к корзине повторяем уже как гость
      const isCartRequest = String(config?.url || "").includes("/cart/");
      if (
        config &&
        config._autoAuth &&
        !config._retriedAsGuest &&
        isCartRequest
      ) {
        config._retriedAsGuest = true;
        config._autoAuth = false;
        if (typeof config.headers?.delete === "function") {
          config.headers.delete("Authorization");
        } else if (config.headers) {
          delete config.headers.Authorization;
        }
        return $api(config);
      }
    }

    return Promise.reject(error);
  },
);
