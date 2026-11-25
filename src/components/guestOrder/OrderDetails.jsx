// src/components/guestOrder/OrderDetails.jsx
// Карточки заказа: номер, статус, детали, товары, квитанция.
// Используется на страницах /order и /find-order.
"use client";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
  Download,
  Copy,
  AlertTriangle,
  Calendar,
  Truck,
  Store,
  MapPin,
  User,
  Phone,
  QrCode,
  CheckCircle2,
  Clock,
  Banknote,
  Gift,
  Info,
  XCircle,
} from "lucide-react";
import styles from "./GuestOrder.module.scss";
import PaymentDeadline from "./PaymentDeadline";
import { useSearchProductsPool } from "@/lib/products/hooks/useSearchProductsPool";
import {
  formatOrderNumber,
  downloadReceipt,
  getStatusCode,
  getOrderDate,
  getOrderItems,
  isLoggedIn,
  needsPayment,
  guestOrderApi,
  getPaymentState,
  getStatusColor,
  getUnit,
  PAYMENT_STATUS_CODES,
} from "@/lib/cart/api/guestOrder";

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Русские названия известных статусов (код с бэка -> текст)
const STATUS_TEXT = {
  new: "Новый",
  awaiting_payment: "Ожидает оплаты",
  pending: "Ожидает оплаты",
  processing: "В обработке",
  paid: "Оплачен",
  paid_with_bonus: "Оплачен бонусами",
  in_stock: "Товар в наличии",
  assembling: "Собирается",
  ready: "Готов к выдаче",
  shipped: "Отправлен",
  delivering: "Доставляется",
  delivered: "Доставлен",
  completed: "Выполнен",
  cancelled: "Отменён",
  canceled: "Отменён",
  returned: "Возврат",
  expired: "Отменён (не оплачен)",
};

export default function OrderDetails({ order, token }) {
  const { t, i18n } = useTranslation();
  const [downloading, setDownloading] = useState(false);
  const [paying, setPaying] = useState(false);
  // Срок оплаты вышел, пока страница открыта
  const [expiredNow, setExpiredNow] = useState(false);

  // В заказе у товара часто только id — название и фото берём из списка товаров поиска
  const { data: searchPool = [] } = useSearchProductsPool();
  const productsById = useMemo(() => {
    const map = {};
    searchPool.forEach((p) => {
      if (p?.id != null) map[p.id] = p;
    });
    return map;
  }, [searchPool]);

  const items = getOrderItems(order);
  const statusCode = getStatusCode(order);
  const statusText = statusCode
    ? t(`guestOrder.statuses.${statusCode}`, {
        defaultValue: STATUS_TEXT[statusCode] || statusCode,
      })
    : "";
  const statusColor = getStatusColor(order);
  const paymentState = expiredNow ? "expired" : getPaymentState(order);
  const PAYMENT_BADGE = {
    paid: {
      cls: styles.payPaid,
      icon: <CheckCircle2 size={15} />,
      text: t("guestOrder.payment.paid", { defaultValue: "Оплачен" }),
    },
    bonus: {
      cls: styles.payPaid,
      icon: <Gift size={15} />,
      text: t("guestOrder.payment.bonus", { defaultValue: "Оплачен бонусами" }),
    },
    cash: {
      cls: styles.payCash,
      icon: <Banknote size={15} />,
      text: t("guestOrder.payment.cash", {
        defaultValue: "Оплата наличными при получении",
      }),
    },
    awaiting: {
      cls: styles.payAwaiting,
      icon: <Clock size={15} />,
      text: t("guestOrder.payment.awaiting", {
        defaultValue: "Ожидает оплаты",
      }),
    },
    expired: {
      cls: styles.payExpired,
      icon: <XCircle size={15} />,
      text: t("guestOrder.payment.expired", {
        defaultValue: "Не оплачен вовремя",
      }),
    },
  };
  // Если статус уже говорит об оплате («Ожидает оплаты»), второй такой же значок не показываем
  const paymentBadge = PAYMENT_STATUS_CODES.includes(statusCode.toLowerCase())
    ? null
    : PAYMENT_BADGE[paymentState];
  const isPickup = order?.delivery_method === "pickup";
  const createdAt = getOrderDate(order, i18n.language || "ru-RU");
  const currency = t("cartItem.currency");
  // Квитанция: гость — по токену; заказ из аккаунта — по id (нужен вход)
  const canDownload =
    !!token || !!order?.receipt_url || (!!order?.id && isLoggedIn());

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadReceipt({
        token,
        id: order?.id,
        orderNumber: order?.order_number,
        receiptUrl: order?.receipt_url,
      });
    } catch {
      toast.error(
        t("guestOrder.receiptError", {
          defaultValue: "Не удалось скачать квитанцию. Попробуйте позже.",
        }),
      );
    } finally {
      setDownloading(false);
    }
  };

  // Оплатить можно гостю (по токену) или вошедшему (заказ из аккаунта)
  const canPay =
    !expiredNow &&
    needsPayment(order) &&
    !!order?.id &&
    (!!token || isLoggedIn());

  const handlePay = async () => {
    setPaying(true);
    try {
      const data = await guestOrderApi.pay(order.id, token);
      if (data?.payment_url) {
        window.location.href = data.payment_url;
        return;
      }
      toast.error(t("checkoutModal.messages.paymentError"));
    } catch (error) {
      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          t("checkoutModal.messages.paymentError"),
      );
    }
    setPaying(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(order?.order_number || ""));
      toast.success(
        t("guestOrder.copied", { defaultValue: "Номер заказа скопирован" }),
      );
    } catch {}
  };

  return (
    <>
      {/* Номер и статус */}
      <div className={`${styles.card} ${styles.center}`}>
        <div className={styles.orderNumberLabel}>
          {t("guestOrder.orderNumber", { defaultValue: "Номер заказа" })}
        </div>
        <div className={styles.orderNumber}>
          {formatOrderNumber(order?.order_number)}
        </div>
        <button type="button" className={styles.copyBtn} onClick={handleCopy}>
          <Copy size={14} />
          {t("guestOrder.copy", { defaultValue: "Скопировать" })}
        </button>
        <div className={styles.badges}>
          {statusText && (
            <span
              className={styles.statusBadge}
              style={{ color: statusColor, background: `${statusColor}1f` }}
            >
              {statusText}
            </span>
          )}
          {paymentBadge && (
            <span className={`${styles.payBadge} ${paymentBadge.cls}`}>
              {paymentBadge.icon}
              {paymentBadge.text}
            </span>
          )}
        </div>

        {paymentState === "expired" && (
          <div
            className={`${styles.deadline} ${styles.deadlineExpired}`}
            style={{ marginTop: 16 }}
          >
            <XCircle size={18} />
            <span>
              {t("guestOrder.deadline.expiredText", {
                defaultValue:
                  "Заказ отменён: он не был оплачен вовремя. Оформите заказ заново из корзины.",
              })}
            </span>
          </div>
        )}

        {canPay && (
          <div className={styles.payBox}>
            <PaymentDeadline
              order={order}
              onExpire={() => setExpiredNow(true)}
            />
            {paymentState === "unknown" && (
              <div className={styles.payNote}>
                <Info size={16} />
                <span>
                  {t("guestOrder.payment.unknownHint", {
                    defaultValue:
                      "Если вы уже оплатили заказ, повторно платить не нужно.",
                  })}
                </span>
              </div>
            )}
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handlePay}
              disabled={paying}
            >
              {paying ? (
                <span className={styles.spinner} />
              ) : (
                <QrCode size={18} />
              )}
              {paying
                ? t("checkoutModal.success.processingPayment")
                : `${t("checkoutModal.success.payButton")} ${Number(order?.total_price || 0).toLocaleString("ru-RU")} ${currency}`}
            </button>
          </div>
        )}
      </div>

      {/* Детали */}
      <div
        className={`${styles.card} ${styles.cardGap}`}
        style={{ animationDelay: "0.1s" }}
      >
        <h2 className={styles.sectionTitle}>
          {t("guestOrder.details", { defaultValue: "Детали заказа" })}
        </h2>
        <div className={styles.infoGrid}>
          {createdAt && (
            <div className={styles.infoItem}>
              <Calendar size={18} />
              <div>
                <span>{t("guestOrder.date", { defaultValue: "Дата" })}</span>
                <b>{createdAt}</b>
              </div>
            </div>
          )}
          {order?.customer_name && (
            <div className={styles.infoItem}>
              <User size={18} />
              <div>
                <span>
                  {t("checkoutModal.form.name", { defaultValue: "Имя" })}
                </span>
                <b>{order.customer_name}</b>
              </div>
            </div>
          )}
          {order?.customer_phone && (
            <div className={styles.infoItem}>
              <Phone size={18} />
              <div>
                <span>{t("checkoutModal.form.phone")}</span>
                <b>{order.customer_phone}</b>
              </div>
            </div>
          )}
          {order?.delivery_method && (
            <div className={styles.infoItem}>
              {isPickup ? <Store size={18} /> : <Truck size={18} />}
              <div>
                <span>
                  {t("guestOrder.deliveryMethod", {
                    defaultValue: "Получение",
                  })}
                </span>
                <b>
                  {isPickup
                    ? t("checkoutModal.form.pickup", {
                        defaultValue: "Самовывоз из офиса",
                      })
                    : t("checkoutModal.form.delivery", {
                        defaultValue: "Доставка",
                      })}
                </b>
              </div>
            </div>
          )}
          {(order?.address || isPickup) && (
            <div className={styles.infoItem}>
              <MapPin size={18} />
              <div>
                <span>{t("checkoutModal.form.address")}</span>
                <b>{order?.address || t("footer.address.street")}</b>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Товары */}
      {items.length > 0 && (
        <div
          className={`${styles.card} ${styles.cardGap}`}
          style={{ animationDelay: "0.2s" }}
        >
          <h2 className={styles.sectionTitle}>
            {t("guestOrder.items", { defaultValue: "Товары" })} ({items.length})
          </h2>
          <div className={styles.itemsList}>
            {items.map((item, i) => {
              const productId =
                typeof item.product === "object"
                  ? item.product?.id
                  : (item.product ?? item.product_id);
              const fromPool = productsById[productId] || {};
              const productObj =
                typeof item.product === "object" ? item.product : {};
              // Бэк теперь присылает product_name / article / image в самом item
              const name =
                item.product_name ||
                productObj.name ||
                item.name ||
                fromPool.name ||
                t("guestOrder.productRemoved", {
                  defaultValue: "Товар снят с продажи",
                });
              const article =
                item.article ||
                item.product_article ||
                productObj.article ||
                fromPool.article;
              const image =
                item.image ||
                item.product_image ||
                item.img ||
                productObj.image ||
                productObj.existing_images?.[0]?.image ||
                fromPool.image;
              const unit =
                getUnit(item, productObj) || t("checkoutModal.form.pcs");
              const qty = toNumber(item.quantity);
              const price = toNumber(item.price ?? productObj.price);
              const sum = toNumber(item.total_price ?? price * qty);
              return (
                <div
                  key={item.id ?? i}
                  className={styles.itemRow}
                  style={{ animationDelay: `${0.25 + Math.min(i, 8) * 0.05}s` }}
                >
                  <div className={styles.itemMain}>
                    {image ? (
                      <img
                        className={styles.itemImg}
                        src={image}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <span className={styles.itemImgEmpty} />
                    )}
                    <div>
                      <div className={styles.itemName}>{name}</div>
                      <div className={styles.itemMeta}>
                        {article && `${t("cartItem.article")}: ${article} · `}
                        {qty} {unit}
                        {price > 0 &&
                          ` × ${price.toLocaleString("ru-RU")} ${currency}`}
                      </div>
                    </div>
                  </div>
                  <div className={styles.itemSum}>
                    {sum.toLocaleString("ru-RU")} {currency}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.totalRow}>
            <span>{t("cart.smeta.total", { defaultValue: "Итого" })}</span>
            <strong>
              {toNumber(order?.total_price).toLocaleString("ru-RU")} {currency}
            </strong>
          </div>
        </div>
      )}

      {/* Квитанция */}
      {canDownload && (
        <div
          className={`${styles.card} ${styles.cardGap}`}
          style={{ animationDelay: "0.3s" }}
        >
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className={styles.btnPrimary}
          >
            {downloading ? (
              <span className={styles.spinner} />
            ) : (
              <Download size={18} />
            )}
            {downloading
              ? t("guestOrder.downloading", { defaultValue: "Скачиваем..." })
              : t("guestOrder.downloadReceipt", {
                  defaultValue: "Скачать квитанцию",
                })}
          </button>
          <div className={styles.warning}>
            <AlertTriangle size={18} />
            <span>
              {t("guestOrder.saveHint", {
                defaultValue: "Сохраните квитанцию — по ней вы получите заказ",
              })}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
