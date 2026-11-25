// src/components/guestOrder/MyOrdersModal.jsx
// Окно «Мои заказы»: список заказов аккаунта, по клику — подробности в этом же окне.
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  X,
  ArrowLeft,
  ChevronRight,
  PackageOpen,
  AlertCircle,
} from "lucide-react";
import styles from "./GuestOrder.module.scss";
import OrderDetails from "./OrderDetails";
import {
  guestOrderApi,
  formatOrderNumber,
  getOrderDate,
  getStatusCode,
  getStatusColor,
  getPaymentState,
} from "@/lib/cart/api/guestOrder";

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const STATUS_TEXT = {
  new: "Новый",
  awaiting_payment: "Ожидает оплаты",
  pending: "Ожидает оплаты",
  processing: "В обработке",
  paid: "Оплачен",
  paid_with_bonus: "Оплачен бонусами",
  in_stock: "Товар в наличии",
  ready: "Готов к выдаче",
  shipped: "Отправлен",
  delivered: "Доставлен",
  completed: "Выполнен",
  cancelled: "Отменён",
  canceled: "Отменён",
  returned: "Возврат",
  expired: "Отменён (не оплачен)",
};

export default function MyOrdersModal({ open, onClose }) {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-orders"],
    queryFn: guestOrderApi.getMyOrders,
    enabled: open,
    staleTime: 30 * 1000,
  });
  const orders = data || [];

  // Esc закрывает окно, страница под окном не прокручивается
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") selected ? setSelected(null) : onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, selected, onClose]);

  useEffect(() => {
    if (!open) setSelected(null);
  }, [open]);

  if (!open) return null;

  const currency = t("cartItem.currency");

  const statusLabel = (order) => {
    const code = getStatusCode(order);
    return code
      ? t(`guestOrder.statuses.${code}`, {
          defaultValue: STATUS_TEXT[code] || code,
        })
      : "";
  };

  const paymentLabel = (order) => {
    const state = getPaymentState(order);
    if (state === "paid")
      return {
        cls: styles.savedPaid,
        text: t("guestOrder.payment.paid", { defaultValue: "Оплачен" }),
      };
    if (state === "bonus")
      return {
        cls: styles.savedPaid,
        text: t("guestOrder.payment.bonus", {
          defaultValue: "Оплачен бонусами",
        }),
      };
    if (state === "awaiting")
      return {
        cls: styles.savedAwaiting,
        text: t("guestOrder.payment.awaiting", {
          defaultValue: "Ожидает оплаты",
        }),
      };
    if (state === "expired")
      return {
        cls: styles.savedExpired,
        text: t("guestOrder.payment.expired", {
          defaultValue: "Не оплачен вовремя",
        }),
      };
    if (state === "cash")
      return {
        cls: "",
        text: t("guestOrder.payment.cash", {
          defaultValue: "Оплата наличными при получении",
        }),
      };
    return null;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={t("guestOrder.myOrdersTitle", {
          defaultValue: "Мои заказы",
        })}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          {selected ? (
            <button
              type="button"
              className={styles.backBtn}
              style={{ marginBottom: 0 }}
              onClick={() => setSelected(null)}
            >
              <ArrowLeft size={16} />
              {t("guestOrder.backToList", { defaultValue: "Назад к списку" })}
            </button>
          ) : (
            <h2 className={styles.modalTitle}>
              {t("guestOrder.myOrdersTitle", { defaultValue: "Мои заказы" })}
              {orders.length > 0 && (
                <span className={styles.modalCount}>{orders.length}</span>
              )}
            </h2>
          )}
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
          {selected ? (
            <div className={styles.modalDetails}>
              <OrderDetails order={selected} />
            </div>
          ) : isLoading ? (
            <div className={styles.loaderWrap} style={{ padding: "40px 0" }}>
              <div className="loader" />
            </div>
          ) : isError ? (
            <div className={styles.modalEmpty}>
              <AlertCircle size={40} />
              <p>
                {t("guestOrder.myOrdersError", {
                  defaultValue:
                    "Не удалось загрузить заказы. Попробуйте позже.",
                })}
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className={styles.modalEmpty}>
              <PackageOpen size={44} />
              <p>
                {t("guestOrder.myOrdersEmpty", {
                  defaultValue: "У вас пока нет заказов",
                })}
              </p>
              <Link
                href="/catalog"
                className={styles.btnPrimary}
                onClick={onClose}
                style={{ width: "auto" }}
              >
                {t("cart.empty.goToCatalog")}
              </Link>
            </div>
          ) : (
            <div className={styles.myOrdersList}>
              {orders.map((order, i) => {
                const color = getStatusColor(order);
                const status = statusLabel(order);
                const payment = paymentLabel(order);
                return (
                  <button
                    type="button"
                    key={order.id ?? order.order_number ?? i}
                    className={styles.myOrderRow}
                    style={{ animationDelay: `${Math.min(i, 10) * 0.04}s` }}
                    onClick={() => setSelected(order)}
                  >
                    <span className={styles.myOrderMain}>
                      <b>№ {formatOrderNumber(order.order_number)}</b>
                      <span className={styles.myOrderDate}>
                        {getOrderDate(order, i18n.language || "ru-RU")}
                      </span>
                    </span>
                    <span className={styles.myOrderSide}>
                      <b>
                        {toNumber(order.total_price).toLocaleString("ru-RU")}{" "}
                        {currency}
                      </b>
                      <span className={styles.myOrderBadges}>
                        {status && (
                          <span
                            className={styles.miniBadge}
                            style={{ color, background: `${color}1f` }}
                          >
                            {status}
                          </span>
                        )}
                        {payment && (
                          <em className={payment.cls}>{payment.text}</em>
                        )}
                      </span>
                    </span>
                    <ChevronRight size={18} className={styles.myOrderArrow} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!selected && (
          <div className={styles.modalFoot}>
            <Link href="/profile?tab=orders" onClick={onClose}>
              {t("guestOrder.openInProfile", {
                defaultValue: "Открыть в личном кабинете",
              })}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
