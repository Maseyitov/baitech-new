// src/app/(main)/success/page.jsx
"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { Download, Copy, AlertTriangle, Eye } from "lucide-react";
import styles from "@/components/guestOrder/GuestOrder.module.scss";
import PageBreadcrumbs from "@/components/ui/pageBreadcrumbs/PageBreadcrumbs";
import {
  formatOrderNumber,
  downloadReceipt,
  guestOrderApi,
  saveGuestOrder,
  markOrderPaid,
} from "@/lib/cart/api/guestOrder";

function SuccessContent() {
  const { t } = useTranslation();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const id = params.get("id") || "";
  const isCash = params.get("pay") === "cash";
  const [orderNumber, setOrderNumber] = useState(params.get("order") || "");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [downloading, setDownloading] = useState(false);

  // Сюда Finik возвращает после оплаты — запоминаем, что заказ оплачен.
  // Для наличных (pay=cash) не помечаем.
  useEffect(() => {
    const isFinikReturn = !isCash && params.get("pay") !== "bonus";
    if (isFinikReturn && (token || orderNumber)) {
      markOrderPaid({
        order_number: orderNumber,
        order_token: token || undefined,
        id: id || undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token) return;
    // Вернулись с оплаты — сохраняем заказ в браузере
    saveGuestOrder({
      order_token: token,
      order_number: orderNumber || undefined,
    });

    guestOrderApi
      .getByToken(token)
      .then((order) => {
        if (order?.order_number) setOrderNumber(order.order_number);
        if (order?.receipt_url) setReceiptUrl(order.receipt_url);
        saveGuestOrder({ ...order, order_token: token });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadReceipt({ token, id, orderNumber, receiptUrl });
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(orderNumber));
      toast.success(
        t("guestOrder.copied", { defaultValue: "Номер заказа скопирован" }),
      );
    } catch {}
  };

  const breadcrumbs = [
    { label: t("aboutCompany.breadcrumbs.home"), path: "/" },
    { label: t("cart.card"), path: "/korzina" },
    {
      label: t("guestOrder.breadcrumbSuccess", {
        defaultValue: "Заказ оформлен",
      }),
    },
  ];

  if (!token && !id && !orderNumber) {
    return (
      <div className={styles.page}>
        <PageBreadcrumbs items={breadcrumbs} />
        <div className={`${styles.card} ${styles.narrow} ${styles.center}`}>
          <h1 className={styles.title}>
            {t("guestOrder.notFound", { defaultValue: "Заказ не найден" })}
          </h1>
          <p className={styles.subtitle}>
            {t("guestOrder.notFoundHint", {
              defaultValue:
                "Проверьте ссылку или найдите заказ по номеру и телефону.",
            })}
          </p>
          <Link href="/find-order" className={styles.btnPrimary}>
            {t("guestOrder.findTitle", { defaultValue: "Найти заказ" })}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageBreadcrumbs items={breadcrumbs} />

      <div className={`${styles.card} ${styles.narrow} ${styles.center}`}>
        <div className={styles.successIcon}>
          <svg viewBox="0 0 52 52">
            <circle
              className={styles.checkCircle}
              cx="26"
              cy="26"
              r="24"
              fill="none"
            />
            <path
              className={styles.checkMark}
              fill="none"
              d="M15 27l7 7 15-15"
            />
          </svg>
        </div>

        <h1 className={styles.title}>
          {t("guestOrder.successTitle", { defaultValue: "Заказ оформлен!" })}
        </h1>
        <p className={styles.subtitle} style={{ marginBottom: 0 }}>
          {isCash
            ? t("guestOrder.successCash", {
                defaultValue: "Спасибо! Наш менеджер скоро свяжется с вами.",
              })
            : t("guestOrder.successText", {
                defaultValue: "Спасибо за покупку!",
              })}
        </p>

        {orderNumber && (
          <div className={styles.orderNumberBox}>
            <div className={styles.orderNumberLabel}>
              {t("guestOrder.orderNumber", { defaultValue: "Номер заказа" })}
            </div>
            <div className={styles.orderNumber}>
              {formatOrderNumber(orderNumber)}
            </div>
            <button
              type="button"
              className={styles.copyBtn}
              onClick={handleCopy}
            >
              <Copy size={14} />
              {t("guestOrder.copy", { defaultValue: "Скопировать" })}
            </button>
          </div>
        )}

        <div className={styles.actions}>
          {(token || id) && (
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
          )}
          {token && (
            <Link
              href={`/order?token=${encodeURIComponent(token)}`}
              className={styles.btnOutline}
            >
              <Eye size={18} />
              {t("guestOrder.viewOrder", { defaultValue: "Посмотреть заказ" })}
            </Link>
          )}
        </div>

        <div className={styles.warning}>
          <AlertTriangle size={18} />
          <span>
            {t("guestOrder.saveHint", {
              defaultValue: "Сохраните квитанцию — по ней вы получите заказ",
            })}
          </span>
        </div>
      </div>

      <div
        className={`${styles.card} ${styles.narrow} ${styles.cardGap}`}
        style={{ animationDelay: "0.15s" }}
      >
        <h2 className={styles.sectionTitle}>
          {t("guestOrder.nextTitle", { defaultValue: "Что дальше?" })}
        </h2>
        <div className={styles.steps}>
          <div className={styles.step} style={{ animationDelay: "0.25s" }}>
            <span className={styles.stepNum}>1</span>
            <div className={styles.stepText}>
              <b>
                {t("guestOrder.next1Title", {
                  defaultValue: "Сохраните квитанцию",
                })}
              </b>
              <span>
                {t("guestOrder.next1Text", {
                  defaultValue:
                    "Скачайте её или сделайте скриншот номера заказа",
                })}
              </span>
            </div>
          </div>
          <div className={styles.step} style={{ animationDelay: "0.35s" }}>
            <span className={styles.stepNum}>2</span>
            <div className={styles.stepText}>
              <b>
                {t("guestOrder.next2Title", {
                  defaultValue: "Дождитесь звонка",
                })}
              </b>
              <span>
                {t("guestOrder.next2Text", {
                  defaultValue:
                    "Менеджер свяжется с вами для подтверждения заказа",
                })}
              </span>
            </div>
          </div>
          <div className={styles.step} style={{ animationDelay: "0.45s" }}>
            <span className={styles.stepNum}>3</span>
            <div className={styles.stepText}>
              <b>
                {t("guestOrder.next3Title", { defaultValue: "Получите заказ" })}
              </b>
              <span>
                {t("guestOrder.next3Text", {
                  defaultValue: "Покажите квитанцию или назовите номер заказа",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.links}>
          <Link href="/find-order">
            {t("guestOrder.findTitle", { defaultValue: "Найти заказ" })}
          </Link>
          <Link href="/">
            {t("guestOrder.toHome", { defaultValue: "На главную" })}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="loader" />}>
      <SuccessContent />
    </Suspense>
  );
}
