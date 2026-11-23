// src/app/(main)/order/page.jsx
"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PackageSearch, LogIn, Trash2 } from "lucide-react";
import styles from "@/components/guestOrder/GuestOrder.module.scss";
import OrderDetails from "@/components/guestOrder/OrderDetails";
import PageBreadcrumbs from "@/components/ui/pageBreadcrumbs/PageBreadcrumbs";
import {
  formatOrderNumber,
  guestOrderApi,
  saveGuestOrder,
  isLoggedIn,
  getGuestOrders,
  removeGuestOrder,
  getExpiresAt,
} from "@/lib/cart/api/guestOrder";

function OrderContent() {
  const { t } = useTranslation();
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const orderId = params.get("id") || "";
  // Заказ из аккаунта (по id) открывается только после входа
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  useEffect(() => {
    setIsAuth(isLoggedIn());
    setAuthChecked(true);
  }, []);

  const byId = !token && !!orderId;

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: byId ? ["account-order", orderId] : ["guest-order", token],
    queryFn: () =>
      byId
        ? guestOrderApi.getAccountOrder(orderId)
        : guestOrderApi.getByToken(token),
    enabled: byId ? authChecked : !!token,
    retry: false,
  });

  useEffect(() => {
    if (order && token) saveGuestOrder({ ...order, order_token: token });
  }, [order, token]);

  const breadcrumbs = [
    { label: t("aboutCompany.breadcrumbs.home"), path: "/" },
    {
      label: t("guestOrder.findTitle", { defaultValue: "Найти заказ" }),
      path: "/find-order",
    },
    {
      label: order?.order_number
        ? `${t("guestOrder.order", { defaultValue: "Заказ" })} № ${formatOrderNumber(order.order_number)}`
        : t("guestOrder.order", { defaultValue: "Заказ" }),
    },
  ];

  // Есть ли этот заказ в списке «Ваши заказы на этом устройстве»
  const localEntry = getGuestOrders().find(
    (o) =>
      (token && o.order_token === token) ||
      (orderId && String(o.id) === String(orderId)),
  );
  const isInLocalList = !!localEntry;
  // Не найден, не оплачен и срок оплаты уже прошёл — значит бэк удалил его как неоплаченный
  const localExpires = getExpiresAt(localEntry);
  const removedAsUnpaid =
    isError &&
    !!localEntry &&
    !localEntry.paid &&
    localEntry.payment_method === "qr" &&
    !!localExpires &&
    localExpires.getTime() <= Date.now();

  useEffect(() => {
    if (removedAsUnpaid) {
      removeGuestOrder({
        order_token: token || undefined,
        id: orderId || undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removedAsUnpaid]);
  const handleRemove = () => {
    removeGuestOrder({
      order_token: token || undefined,
      id: orderId || undefined,
    });
    router.push("/find-order");
  };

  if (byId && isError && !isAuth) {
    return (
      <div className={styles.page}>
        <PageBreadcrumbs items={breadcrumbs} />
        <div className={`${styles.card} ${styles.narrow} ${styles.center}`}>
          <div className={styles.headIcon}>
            <LogIn size={28} />
          </div>
          <h1 className={styles.title}>
            {t("guestOrder.loginToView", { defaultValue: "Войдите в аккаунт" })}
          </h1>
          <p className={styles.subtitle}>
            {t("guestOrder.loginToViewText", {
              defaultValue:
                "Этот заказ оформлен из личного кабинета. Чтобы посмотреть его, войдите в аккаунт.",
            })}
          </p>
          <Link href="/login" className={styles.btnPrimary}>
            {t("auth.modal.login")}
          </Link>
        </div>
      </div>
    );
  }

  if ((!token && !orderId) || isError) {
    return (
      <div className={styles.page}>
        <PageBreadcrumbs items={breadcrumbs} />
        <div className={`${styles.card} ${styles.narrow} ${styles.center}`}>
          <div className={styles.headIcon}>
            <PackageSearch size={30} />
          </div>
          <h1 className={styles.title}>
            {t("guestOrder.notFound", { defaultValue: "Заказ не найден" })}
          </h1>
          <p className={styles.subtitle}>
            {removedAsUnpaid
              ? t("guestOrder.deadline.removedText", {
                  defaultValue:
                    "Заказ удалён: он не был оплачен вовремя. Оформите заказ заново из корзины.",
                })
              : isInLocalList
                ? t("guestOrder.notFoundSaved", {
                    defaultValue:
                      "Этот заказ есть в списке на устройстве, но сервер его не нашёл. Возможно, он удалён или оформлен с другого аккаунта.",
                  })
                : t("guestOrder.notFoundHint", {
                    defaultValue:
                      "Проверьте ссылку или найдите заказ по номеру и телефону.",
                  })}
          </p>
          <div className={styles.actions}>
            {isInLocalList && !removedAsUnpaid && (
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleRemove}
              >
                <Trash2 size={18} />
                {t("guestOrder.removeFromList", {
                  defaultValue: "Убрать из списка",
                })}
              </button>
            )}
            <Link
              href="/find-order"
              className={isInLocalList ? styles.btnOutline : styles.btnPrimary}
            >
              {t("guestOrder.findTitle", { defaultValue: "Найти заказ" })}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || (byId && !authChecked)) {
    return (
      <div className={styles.loaderWrap}>
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageBreadcrumbs items={breadcrumbs} />
      <div className={styles.wide}>
        <OrderDetails order={order} token={token} />
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="loader" />}>
      <OrderContent />
    </Suspense>
  );
}
