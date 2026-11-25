// src/components/guestOrder/DeviceOrdersModal.jsx
// Окно «Мои заказы на этом устройстве»: список заказов, сохранённых в этом браузере.
// Внизу — кнопка «Перейти в личный кабинет» (без входа — окно «Вы не авторизованы»).
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { X, ChevronRight, PackageOpen, UserRound } from "lucide-react";
import styles from "./GuestOrder.module.scss";
import AuthRequiredModal from "./AuthRequiredModal";
import {
  getGuestOrders,
  orderLink,
  formatOrderNumber,
  getLocalOrderState,
  getExpiresAt,
  formatDeadlineHuman,
  checkAuthValid,
} from "@/lib/cart/api/guestOrder";

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function DeviceOrdersModal({ open, onClose }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [showAuth, setShowAuth] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);

  // Список читаем при каждом открытии — он мог измениться
  useEffect(() => {
    if (open) setOrders(getGuestOrders());
  }, [open]);

  // Esc закрывает окно, страница под окном не прокручивается
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !showAuth) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, showAuth, onClose]);

  if (!open) return null;

  const currency = t("cartItem.currency");

  const openOrder = (o) => {
    onClose();
    router.push(orderLink(o));
  };

  // Перед переходом проверяем у бэка, что вход действует; иначе — окно «Вы не авторизованы»
  const goToProfile = async () => {
    setCheckingAuth(true);
    const ok = await checkAuthValid();
    setCheckingAuth(false);
    if (ok) {
      onClose();
      router.push("/profile?tab=orders");
    } else {
      setShowAuth(true);
    }
  };

  const stateLabel = (o) => {
    const st = getLocalOrderState(o);
    if (st === "paid")
      return (
        <em className={styles.savedPaid}>
          {t("guestOrder.payment.paid", { defaultValue: "Оплачен" })}
        </em>
      );
    if (st === "expired")
      return (
        <em className={styles.savedExpired}>
          {t("guestOrder.deadline.expired", {
            defaultValue: "Срок оплаты истёк",
          })}
        </em>
      );
    if (st === "cash")
      return (
        <em>
          {t("guestOrder.payment.cash", {
            defaultValue: "Оплата наличными при получении",
          })}
        </em>
      );
    if (st === "awaiting") {
      const until = getExpiresAt(o);
      return (
        <em className={styles.savedAwaiting}>
          {until
            ? `${t("guestOrder.deadline.payBy", { defaultValue: "Оплатите до" })} ${formatDeadlineHuman(
                until,
                {
                  lang: i18n.language,
                  today: t("guestOrder.deadline.today", {
                    defaultValue: "сегодня",
                  }),
                  tomorrow: t("guestOrder.deadline.tomorrow", {
                    defaultValue: "завтра",
                  }),
                  at: t("guestOrder.deadline.at", { defaultValue: "в" }),
                },
              )}`
            : t("guestOrder.payment.awaiting", {
                defaultValue: "Ожидает оплаты",
              })}
        </em>
      );
    }
    return null;
  };

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-label={t("guestOrder.deviceOrdersTitle", {
            defaultValue: "Мои заказы на этом устройстве",
          })}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.modalHead}>
            <h2 className={styles.modalTitle}>
              {t("guestOrder.deviceOrdersTitle", {
                defaultValue: "Мои заказы на этом устройстве",
              })}
              {orders.length > 0 && (
                <span className={styles.modalCount}>{orders.length}</span>
              )}
            </h2>
            <button
              type="button"
              className={styles.modalClose}
              onClick={onClose}
              aria-label={t("checkoutModal.close")}
            >
              <X size={20} />
            </button>
          </div>

          <div className={styles.modalBody}>
            {orders.length === 0 ? (
              <div className={styles.modalEmpty}>
                <PackageOpen size={44} />
                <p>
                  {t("guestOrder.deviceOrdersEmpty", {
                    defaultValue: "На этом устройстве пока нет заказов",
                  })}
                </p>
              </div>
            ) : (
              <div className={styles.myOrdersList}>
                {orders.map((o, i) => (
                  <button
                    type="button"
                    key={
                      o.order_token ||
                      (o.id != null ? `id:${o.id}` : `num:${o.order_number}`)
                    }
                    className={styles.myOrderRow}
                    style={{ animationDelay: `${Math.min(i, 10) * 0.04}s` }}
                    onClick={() => openOrder(o)}
                  >
                    <span className={styles.myOrderMain}>
                      <b>№ {formatOrderNumber(o.order_number) || "—"}</b>
                      <span className={styles.myOrderDate}>
                        {o.saved_at
                          ? new Date(o.saved_at).toLocaleDateString("ru-RU")
                          : ""}
                      </span>
                    </span>
                    <span className={styles.myOrderSide}>
                      {o.total_price != null && (
                        <b>
                          {toNumber(o.total_price).toLocaleString("ru-RU")}{" "}
                          {currency}
                        </b>
                      )}
                      <span className={styles.myOrderBadges}>
                        {stateLabel(o)}
                      </span>
                    </span>
                    <ChevronRight size={18} className={styles.myOrderArrow} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.modalFoot}>
            <button
              type="button"
              className={styles.btnOutline}
              onClick={goToProfile}
              disabled={checkingAuth}
            >
              {checkingAuth ? (
                <span className={`${styles.spinner} ${styles.spinnerDark}`} />
              ) : (
                <UserRound size={18} />
              )}
              {t("guestOrder.goToProfile", {
                defaultValue: "Перейти в личный кабинет",
              })}
            </button>
          </div>
        </div>
      </div>

      <AuthRequiredModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
