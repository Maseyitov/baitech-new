// src/components/guestOrder/PaymentDeadline.jsx
// Срок оплаты: крупный таймер, полоска оставшегося времени
// и понятная дата «сегодня в 11:16». Когда срок выходит — вызывает onExpire.
"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock, AlertTriangle } from "lucide-react";
import styles from "./GuestOrder.module.scss";
import {
  getExpiresAt,
  getCreatedAt,
  formatDeadlineHuman,
} from "@/lib/cart/api/guestOrder";

const URGENT_MS = 10 * 60 * 1000; // последние 10 минут — красным

export default function PaymentDeadline({ order, onExpire }) {
  const { t, i18n } = useTranslation();
  const expiresAt = getExpiresAt(order);
  const createdAt = getCreatedAt(order);
  const [now, setNow] = useState(() => Date.now());
  const expiredCalled = useRef(false);

  const expiresMs = expiresAt ? expiresAt.getTime() : null;
  useEffect(() => {
    if (!expiresMs) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresMs]);

  const msLeft = expiresMs ? expiresMs - now : null;

  useEffect(() => {
    if (msLeft !== null && msLeft <= 0 && !expiredCalled.current) {
      expiredCalled.current = true;
      onExpire?.();
    }
  }, [msLeft, onExpire]);

  if (!expiresAt) return null;

  if (msLeft <= 0) {
    return (
      <div className={`${styles.deadline} ${styles.deadlineExpired}`}>
        <AlertTriangle size={18} />
        <span>
          {t("guestOrder.deadline.expired", {
            defaultValue: "Срок оплаты истёк",
          })}
        </span>
      </div>
    );
  }

  // Таймер: меньше часа — 11:03, больше — «1 ч 20 мин», больше суток — «1 д 3 ч»
  const totalSec = Math.floor(msLeft / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  let timer;
  if (days > 0) {
    timer = `${days} ${t("guestOrder.deadline.d", { defaultValue: "д" })} ${hours} ${t("guestOrder.deadline.h", { defaultValue: "ч" })}`;
  } else if (hours > 0) {
    timer = `${hours} ${t("guestOrder.deadline.h", { defaultValue: "ч" })} ${minutes} ${t("guestOrder.deadline.m", { defaultValue: "мин" })}`;
  } else {
    timer = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  // Полоска: сколько осталось от всего срока (если знаем время оформления)
  const totalMs = createdAt ? expiresMs - createdAt.getTime() : null;
  const percent =
    totalMs && totalMs > 0
      ? Math.max(0, Math.min(100, (msLeft / totalMs) * 100))
      : null;

  const urgent = msLeft < URGENT_MS;
  const until = formatDeadlineHuman(expiresAt, {
    lang: i18n.language,
    today: t("guestOrder.deadline.today", { defaultValue: "сегодня" }),
    tomorrow: t("guestOrder.deadline.tomorrow", { defaultValue: "завтра" }),
    at: t("guestOrder.deadline.at", { defaultValue: "в" }),
  });

  return (
    <div
      className={`${styles.deadlineBox} ${urgent ? styles.deadlineBoxUrgent : ""}`}
    >
      <div className={styles.deadlineTop}>
        <span className={styles.deadlineLabel}>
          <Clock size={18} />
          {t("guestOrder.deadline.leftToPay", {
            defaultValue: "Осталось на оплату",
          })}
        </span>
        <span className={styles.deadlineTimer}>{timer}</span>
      </div>

      {percent !== null && (
        <div className={styles.deadlineBar}>
          <span style={{ width: `${percent}%` }} />
        </div>
      )}

      <div className={styles.deadlineText}>
        {t("guestOrder.deadline.payBy", { defaultValue: "Оплатите до" })}{" "}
        <b>{until}</b>
        {t("guestOrder.deadline.otherwise", {
          defaultValue: ", иначе заказ будет отменён.",
        })}
      </div>
    </div>
  );
}
