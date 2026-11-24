/* =====================================================================
   ПРИЁМ ЗАЯВОК НА КУРС
   Путь в проекте: src/app/api/course-apply/route.js
   Форма на сайте отправляет сюда имя, телефон и опыт,
   а этот файл пересылает заявку менеджеру в WhatsApp (Green API) и в Telegram.
   Ключи берутся из файла .env.local (в коде их нет).
   ===================================================================== */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* --- защита от спама: не больше 5 заявок с одного IP за 10 минут --- */
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  const limited = list.length >= LIMIT;
  if (!limited) list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return limited;
}

// Убираем переносы строк и служебные символы, ограничиваем длину
const clean = (v, max) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

/* --- WhatsApp через Green API --- */
async function sendWhatsApp(text) {
  const url = (
    process.env.GREEN_API_URL || "https://api.green-api.com"
  ).replace(/\/+$/, "");
  const id = process.env.GREEN_API_ID_INSTANCE;
  const token = process.env.GREEN_API_TOKEN;
  const to = (process.env.MANAGER_WHATSAPP || "").replace(/\D/g, "");
  if (!id || !token || !to) return "skipped";
  const res = await fetch(`${url}/waInstance${id}/sendMessage/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: `${to}@c.us`,
      message: text,
      linkPreview: false,
    }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.idMessage)
    throw new Error(
      `Green API ${res.status}: ${JSON.stringify(data).slice(0, 200)}`,
    );
  return "sent";
}

/* --- Telegram-бот (запасной канал) --- */
async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return "skipped";
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok)
    throw new Error(
      `Telegram ${res.status}: ${JSON.stringify(data).slice(0, 200)}`,
    );
  return "sent";
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad_request" },
      { status: 400 },
    );
  }

  // Ловушка для ботов: это поле скрыто от людей. Если заполнено — делаем вид, что всё хорошо.
  if (clean(body.company, 100)) return NextResponse.json({ ok: true });

  const ip =
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (isRateLimited(ip))
    return NextResponse.json({ ok: false, error: "too_many" }, { status: 429 });

  const name = clean(body.name, 60);
  const phone = clean(body.phone, 30);
  const level = clean(body.level, 60);
  const lang = clean(body.lang, 5).toUpperCase() || "RU";
  const digits = phone.replace(/\D/g, "");
  if (name.length < 2 || digits.length < 9 || digits.length > 15) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const time = new Date().toLocaleString("ru-RU", {
    timeZone: "Asia/Bishkek",
    dateStyle: "short",
    timeStyle: "short",
  });
  const text =
    "🆕 Новая заявка на курс «Специалист по видеонаблюдению»\n\n" +
    `👤 Имя: ${name}\n` +
    `📞 Телефон: ${phone}\n` +
    `🎓 Опыт: ${level || "—"}\n` +
    `🌐 Язык сайта: ${lang}\n` +
    `🕒 ${time}`;

  // Отправляем сразу в оба канала. Заявка принята, если дошла хотя бы в один.
  const results = await Promise.allSettled([
    sendWhatsApp(text),
    sendTelegram(text),
  ]);
  const sent = results.some(
    (r) => r.status === "fulfilled" && r.value === "sent",
  );
  const configured = results.some(
    (r) => !(r.status === "fulfilled" && r.value === "skipped"),
  );
  results.forEach(
    (r) =>
      r.status === "rejected" &&
      console.error("[course-apply]", r.reason?.message || r.reason),
  );

  if (sent) return NextResponse.json({ ok: true });
  if (!configured)
    console.error(
      "[course-apply] Не заданы ключи в .env.local — заявку некуда отправить",
    );
  return NextResponse.json(
    { ok: false, error: "send_failed" },
    { status: 502 },
  );
}
