// src/app/(main)/find-order/page.jsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  Search,
  Hash,
  Phone,
  AlertCircle,
  Info,
  ChevronRight,
  Clock,
  ArrowLeft,
  Smartphone,
} from "lucide-react";
import styles from "@/components/guestOrder/GuestOrder.module.scss";
import PageBreadcrumbs from "@/components/ui/pageBreadcrumbs/PageBreadcrumbs";
import OrderDetails from "@/components/guestOrder/OrderDetails";
import DeviceOrdersModal from "@/components/guestOrder/DeviceOrdersModal";
import {
  formatOrderNumber,
  guestOrderApi,
  saveGuestOrder,
  getGuestOrders,
  orderLink,
  isLoggedIn,
  getLocalOrderState,
  getExpiresAt,
  formatDeadlineHuman,
} from "@/lib/cart/api/guestOrder";

export default function FindOrderPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedOrders, setSavedOrders] = useState([]);
  const [isAuth, setIsAuth] = useState(false);
  const [showDeviceOrders, setShowDeviceOrders] = useState(false);
  // Найденный заказ без токена (заказ из аккаунта) — показываем прямо здесь
  const [foundOrder, setFoundOrder] = useState(null);

  // Заказы, сохранённые в этом браузере
  useEffect(() => {
    setSavedOrders(getGuestOrders());
    setIsAuth(isLoggedIn());
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const number = orderNumber.replace(/\s/g, "");
    if (!number || phone.replace(/\D/g, "").length < 9) {
      setError(
        t("guestOrder.findFillAll", {
          defaultValue: "Введите номер заказа и номер телефона",
        }),
      );
      return;
    }

    setLoading(true);
    try {
      const data = await guestOrderApi.track({
        order_number: number,
        phone: phone.trim(),
      });
      const order = data?.order || data;
      const token = data?.order_token || order?.order_token || data?.token;

      if (!order || (!order.order_number && !order.id))
        throw new Error("empty");

      if (token) {
        // Гостевой заказ — открываем его страницу
        saveGuestOrder({
          ...order,
          order_token: token,
          receipt_url: data?.receipt_url || order?.receipt_url,
        });
        router.push(`/order?token=${encodeURIComponent(token)}`);
      } else {
        // Заказ из аккаунта — токена нет, показываем здесь же и запоминаем на устройстве
        saveGuestOrder({
          ...order,
          customer_phone: order?.customer_phone || phone.trim(),
        });
        setSavedOrders(getGuestOrders());
        setFoundOrder({
          ...order,
          receipt_url: data?.receipt_url || order?.receipt_url,
        });
      }
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          t("guestOrder.findNotFound", {
            defaultValue: "Заказ не найден. Проверьте номер заказа и телефон.",
          }),
      );
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { label: t("aboutCompany.breadcrumbs.home"), path: "/" },
    { label: t("cart.card"), path: "/korzina" },
    { label: t("guestOrder.findTitle", { defaultValue: "Найти заказ" }) },
  ];

  if (foundOrder) {
    return (
      <div className={styles.page}>
        <PageBreadcrumbs items={breadcrumbs} />
        <div className={styles.wide}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => setFoundOrder(null)}
          >
            <ArrowLeft size={16} />
            {t("guestOrder.searchAnother", {
              defaultValue: "Найти другой заказ",
            })}
          </button>
          <OrderDetails order={foundOrder} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageBreadcrumbs items={breadcrumbs} />

      <div className={`${styles.card} ${styles.narrow}`}>
        <div className={styles.center}>
          <div className={styles.headIcon}>
            <Search size={28} />
          </div>
          <h1 className={styles.title}>
            {t("guestOrder.findTitle", { defaultValue: "Найти заказ" })}
          </h1>
          <p className={styles.subtitle}>
            {t("guestOrder.findText", {
              defaultValue:
                "Введите номер заказа и телефон, который указывали при оформлении.",
            })}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="order-number">
              {t("guestOrder.orderNumber", { defaultValue: "Номер заказа" })}
            </label>
            <div className={styles.inputWrap}>
              <Hash size={18} />
              <input
                id="order-number"
                placeholder="2611190427"
                inputMode="numeric"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="order-phone">{t("checkoutModal.form.phone")}</label>
            <div className={styles.inputWrap}>
              <Phone size={18} />
              <input
                id="order-phone"
                type="tel"
                placeholder="0700 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.btnPrimary}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <Search size={18} />
            )}
            {loading
              ? t("guestOrder.searching", { defaultValue: "Ищем..." })
              : t("guestOrder.findButton", { defaultValue: "Найти" })}
          </button>
        </form>

        <div className={styles.info}>
          <Info size={18} />
          <span>
            {t("guestOrder.whereNumber", {
              defaultValue:
                "Номер заказа указан в квитанции и на странице, которая открылась после оформления.",
            })}
          </span>
        </div>
      </div>

      <div
        className={`${styles.card} ${styles.narrow} ${styles.cardGap}`}
        style={{ animationDelay: "0.1s" }}
      >
        <button
          type="button"
          className={styles.btnOutline}
          onClick={() => setShowDeviceOrders(true)}
        >
          <Smartphone size={18} />
          {t("guestOrder.deviceOrdersButton", {
            defaultValue: "Мои заказы на этом устройстве",
          })}
          {savedOrders.length > 0 && (
            <span className={styles.btnCount}>{savedOrders.length}</span>
          )}
        </button>
      </div>

      <DeviceOrdersModal
        open={showDeviceOrders}
        onClose={() => {
          setShowDeviceOrders(false);
          setSavedOrders(getGuestOrders());
        }}
      />
    </div>
  );
}
