"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./CheckoutModal.module.scss";
import { $api } from "../../../API/api";
import Image from "next/image";
import PaymentDeadline from "@/components/guestOrder/PaymentDeadline";
import { useMyProfile } from "@/lib/auth/hooks/hooks";
import {
  saveGuestOrder,
  orderLink,
  formatOrderNumber,
  getProductImage,
  getCustomerFromProfile,
  getAccessToken,
} from "@/lib/cart/api/guestOrder";

const FIELD_KEYS = [
  "name",
  "phone_number",
  "address",
  "delivery_method",
  "payment_method",
];

// Ошибки бэка приходят как { phone_number: "текст" } или { phone_number: ["текст"] }
const parseErrors = (data) => {
  const fields = {};
  let general = "";
  if (!data || typeof data !== "object") {
    const isText =
      typeof data === "string" &&
      data.length < 300 &&
      !data.trim().startsWith("<");
    return { fields, general: isText ? data : "" };
  }
  for (const [key, value] of Object.entries(data)) {
    const text = Array.isArray(value)
      ? value.filter((v) => typeof v === "string").join(" ")
      : typeof value === "string"
        ? value
        : "";
    if (!text) continue;
    if (FIELD_KEYS.includes(key)) fields[key] = text;
    else general = general ? `${general} ${text}` : text;
  }
  return { fields, general };
};

const buildAddressString = (a) =>
  `${a.address_1}${a.address_2 ? `, ${a.address_2}` : ""}, ${a.region}`;

export default function CheckoutModal({ items, allItems, onClose }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Гость или залогиненный — определяем один раз при открытии
  const [isAuth] = useState(() => !!getAccessToken());

  const [step, setStep] = useState(isAuth ? "loading" : "form");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");
  const [form, setForm] = useState({ name: "", phone_number: "", address: "" });
  const [errors, setErrors] = useState({});
  const [payment, setPayment] = useState("qr");
  const [createdOrder, setCreatedOrder] = useState(null);

  // Баланс бонусов — только для залогиненного
  const { data: profile } = useMyProfile({ enabled: isAuth });
  const bonusBalance = Number(profile?.bonus_balance ?? 0);

  // Товар без цены (price <= 0) покупается только за бонусы
  const hasBonusItem = items.some((item) => !(Number(item.product?.price) > 0));
  const hasMoneyItem = items.some((item) => Number(item.product?.price) > 0);
  const isBonusOrder = hasBonusItem && !hasMoneyItem;
  const canPayWithBonus = bonusBalance > 0;
  // Гостю оплата бонусами недоступна
  const guestBonusBlocked = !isAuth && hasBonusItem;

  const itemsTotal = items.reduce((sum, item) => {
    const price = Number(item.product?.price) || 0;
    return sum + (Number(item.total_price) || price * item.quantity);
  }, 0);

  useEffect(() => {
    setPayment(isBonusOrder && isAuth ? "bonus" : "qr");
  }, [isBonusOrder, isAuth]);

  // У вошедшего имя и телефон подставляем из аккаунта (их можно поправить)
  useEffect(() => {
    if (!isAuth) return;
    const { name, phone } = getCustomerFromProfile(profile);
    setForm((f) => ({
      ...f,
      name: f.name || name,
      phone_number: f.phone_number || phone,
    }));
  }, [isAuth, profile]);

  // Адреса из профиля — только для залогиненного
  useEffect(() => {
    if (!isAuth) return;
    $api
      .get("/addressbook/addresses/")
      .then(({ data }) => {
        const list = data?.results || (Array.isArray(data) ? data : []);
        if (list.length > 0) {
          setAddresses(list);
          const primary = list.find((a) => a.is_primary) || list[0];
          setSelectedAddressId(primary.id);
          setForm((f) => ({ ...f, address: buildAddressString(primary) }));
        }
      })
      .catch(() => {})
      .finally(() => setStep("form"));
  }, [isAuth]);

  const updateField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleAddressChange = (id) => {
    setSelectedAddressId(Number(id));
    const found = addresses.find((a) => a.id === Number(id));
    if (found) updateField("address", buildAddressString(found));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) {
      e.name = t("checkoutModal.errors.name", { defaultValue: "Укажите имя" });
    }
    if (form.phone_number.replace(/\D/g, "").length < 9) {
      e.phone_number = t("checkoutModal.errors.phone", {
        defaultValue: "Укажите номер телефона",
      });
    }
    if (deliveryMethod === "delivery" && !form.address.trim()) {
      e.address = t("checkoutModal.errors.address", {
        defaultValue: "Укажите адрес доставки",
      });
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goToSuccess = (order) => {
    const params = new URLSearchParams();
    if (order?.order_number) params.set("order", order.order_number);
    if (order?.order_token) params.set("token", order.order_token);
    else if (order?.id) params.set("id", order.id);
    if (payment === "cash") params.set("pay", "cash");
    if (payment === "bonus") params.set("pay", "bonus");
    onClose();
    router.push(`/success?${params.toString()}`);
  };

  const orderMutation = useMutation({
    mutationFn: async (orderData) => {
      const unselectedItems = allItems.filter(
        (item) => !items.find((selected) => selected.id === item.id),
      );
      await Promise.all(
        unselectedItems.map((item) =>
          $api.delete(`/cart/cart-items/${item.id}/`),
        ),
      );
      const { data } = await $api.post("/ordering/orders/", orderData);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      if (isAuth) queryClient.invalidateQueries({ queryKey: ["profile"] });

      // Сохраняем заказ на этом устройстве (гостю — обязательно: id, order_token, receipt_url)
      saveGuestOrder({
        ...data,
        customer_phone: data?.customer_phone || form.phone_number.trim(),
      });

      setCreatedOrder(data);

      if (payment === "qr" && data?.payment_method !== "cash") {
        setStep("pay");
      } else {
        // Наличные или бонусы — сразу на страницу успеха
        goToSuccess(data);
      }
    },
    onError: (error) => {
      // Корзина могла измениться (удалили невыбранные товары)
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      const { fields, general } = parseErrors(error?.response?.data);
      setErrors(fields);
      if (general) toast.error(general);
      else if (Object.keys(fields).length === 0) {
        toast.error(t("checkoutModal.messages.orderError"));
      }
    },
  });

  const payMutation = useMutation({
    mutationFn: async (order) => {
      const headers =
        !isAuth && order?.order_token
          ? { "X-Order-Token": order.order_token }
          : {};
      const { data } = await $api.post(
        `/ordering/orders/${order.id}/pay/`,
        {},
        { headers },
      );
      return data;
    },
    onSuccess: (data) => {
      if (data?.payment_url) {
        window.location.href = data.payment_url;
      } else {
        toast.error(t("checkoutModal.messages.paymentError"));
      }
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        t("checkoutModal.messages.paymentError");
      toast.error(msg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error(t("checkoutModal.messages.fillAllFields"));
      return;
    }

    const payload = {
      delivery_method: deliveryMethod,
      payment_method: payment,
    };
    // Бэк требует имя и телефон и у вошедших — отправляем всегда
    payload.name = form.name.trim();
    payload.phone_number = form.phone_number.trim();
    if (deliveryMethod === "delivery") {
      payload.address = form.address.trim();
    }
    if (payment === "bonus") {
      payload.status = "paid_with_bonus";
    }

    orderMutation.mutate(payload);
  };

  // Закрыли окно, не оплатив, — открываем страницу заказа, там можно оплатить позже
  const handleClose = () => {
    if (
      step === "pay" &&
      createdOrder &&
      (createdOrder.order_token || createdOrder.id)
    ) {
      toast(
        t("checkoutModal.messages.payLater", {
          defaultValue:
            "Заказ создан, но не оплачен. Оплатить можно на странице заказа.",
        }),
      );
      onClose();
      router.push(orderLink(createdOrder));
      return;
    }
    onClose();
  };

  const handlePay = () => {
    if (createdOrder?.id) payMutation.mutate(createdOrder);
  };

  const isCompactModal = step === "pay";
  const orderDateRaw = createdOrder?.expected_date || createdOrder?.created_at;
  const orderDateLabel = createdOrder?.expected_date
    ? t("checkoutModal.success.expectedDate")
    : t("checkoutModal.success.orderDate", {
        defaultValue: "Дата оформления заказа",
      });
  const orderDateValue = orderDateRaw
    ? new Date(orderDateRaw).toLocaleString(i18n.language || "ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const submitDisabled =
    orderMutation.isPending ||
    guestBonusBlocked ||
    (isBonusOrder && isAuth && !canPayWithBonus);

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div
        className={`${styles.modal} ${isCompactModal ? styles.modalCompact : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={styles.close}
          onClick={handleClose}
          aria-label={t("checkoutModal.close")}
        >
          <X size={20} />
        </button>

        {step === "loading" && (
          <div className={styles.center}>
            <div className="loader" />
          </div>
        )}

        {step === "form" && (
          <>
            <h3 className={styles.title}>{t("checkoutModal.form.title")}</h3>
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.left}>
                <div className={styles.orderList}>
                  {items.map((item, i) => {
                    const img = getProductImage(item.product);
                    const price = Number(item.product?.price) || 0;
                    const lineTotal =
                      Number(item.total_price) || price * item.quantity;
                    return (
                      <div key={item.id} className={styles.orderItem}>
                        <span className={styles.orderNum}>{i + 1}</span>
                        <div className={styles.orderCard}>
                          <div className={styles.orderImg}>
                            {img ? (
                              <Image
                                width={72}
                                height={72}
                                src={img}
                                alt={item.product?.name || "product"}
                              />
                            ) : (
                              <div className={styles.orderImgPlaceholder} />
                            )}
                          </div>
                          <div className={styles.orderInfo}>
                            <p className={styles.orderName}>
                              {item.product?.name}
                            </p>
                            <p className={styles.orderMeta}>
                              {t("checkoutModal.form.amount")}:{" "}
                              {lineTotal.toLocaleString()}{" "}
                              {t("checkoutModal.form.currency")}
                            </p>
                            <p className={styles.orderMeta}>
                              {item.product?.name} ({item.quantity}{" "}
                              {t("checkoutModal.form.pcs")})
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {itemsTotal > 0 && (
                  <p className={styles.itemsTotal}>
                    {t("checkoutModal.form.total", { defaultValue: "Итого" })}:{" "}
                    {itemsTotal.toLocaleString()}{" "}
                    {t("checkoutModal.form.currency")}
                  </p>
                )}
              </div>

              <div className={styles.right}>
                {/* Способ получения */}
                <div className={styles.field}>
                  <label>
                    {t("checkoutModal.form.deliveryMethod", {
                      defaultValue: "Способ получения",
                    })}
                  </label>
                  <div className={styles.radioGroup}>
                    <label
                      className={`${styles.radioOption} ${deliveryMethod === "delivery" ? styles.radioActive : ""}`}
                    >
                      <input
                        type="radio"
                        name="delivery_method"
                        checked={deliveryMethod === "delivery"}
                        onChange={() => setDeliveryMethod("delivery")}
                      />
                      {t("checkoutModal.form.delivery", {
                        defaultValue: "Доставка",
                      })}
                    </label>
                    <label
                      className={`${styles.radioOption} ${deliveryMethod === "pickup" ? styles.radioActive : ""}`}
                    >
                      <input
                        type="radio"
                        name="delivery_method"
                        checked={deliveryMethod === "pickup"}
                        onChange={() => {
                          setDeliveryMethod("pickup");
                          setErrors((e) => ({ ...e, address: undefined }));
                        }}
                      />
                      {t("checkoutModal.form.pickup", {
                        defaultValue: "Самовывоз из офиса",
                      })}
                    </label>
                  </div>
                  {errors.delivery_method && (
                    <p className={styles.fieldError}>
                      {errors.delivery_method}
                    </p>
                  )}
                </div>

                {/* Имя и телефон: гость вводит сам, у вошедшего — из аккаунта */}
                {
                  <>
                    <div className={styles.field}>
                      <label>
                        *{" "}
                        {t("checkoutModal.form.name", { defaultValue: "Имя" })}
                      </label>
                      <input
                        className={errors.name ? styles.inputError : ""}
                        placeholder={t(
                          "checkoutModal.form.firstNamePlaceholder",
                        )}
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        autoComplete="name"
                      />
                      {errors.name && (
                        <p className={styles.fieldError}>{errors.name}</p>
                      )}
                    </div>
                    <div className={styles.field}>
                      <label>* {t("checkoutModal.form.phone")}</label>
                      <input
                        type="tel"
                        className={errors.phone_number ? styles.inputError : ""}
                        placeholder="0700 123 456"
                        value={form.phone_number}
                        onChange={(e) =>
                          updateField("phone_number", e.target.value)
                        }
                        autoComplete="tel"
                      />
                      {errors.phone_number && (
                        <p className={styles.fieldError}>
                          {errors.phone_number}
                        </p>
                      )}
                    </div>
                  </>
                }

                {/* Адрес — только при доставке */}
                {deliveryMethod === "delivery" ? (
                  <div className={styles.field}>
                    <label>* {t("checkoutModal.form.address")}</label>
                    {isAuth && addresses.length > 0 ? (
                      <select
                        className={errors.address ? styles.inputError : ""}
                        value={selectedAddressId || ""}
                        onChange={(e) => handleAddressChange(e.target.value)}
                      >
                        {addresses.map((a) => (
                          <option key={a.id} value={a.id}>
                            {buildAddressString(a)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className={errors.address ? styles.inputError : ""}
                        placeholder={t(
                          "checkoutModal.form.addressPlaceholder",
                          { defaultValue: "Город, улица, дом, квартира" },
                        )}
                        value={form.address}
                        onChange={(e) => updateField("address", e.target.value)}
                        autoComplete="street-address"
                      />
                    )}
                    {errors.address && (
                      <p className={styles.fieldError}>{errors.address}</p>
                    )}
                  </div>
                ) : (
                  <p className={styles.hint}>
                    {t("checkoutModal.form.pickupHint", {
                      defaultValue: "Заберите заказ в нашем офисе:",
                    })}{" "}
                    {t("footer.address.street")}
                  </p>
                )}

                {/* Оплата */}
                <div className={styles.paymentSection}>
                  <p className={styles.paymentTitle}>
                    {t("checkoutModal.form.paymentMethod")}
                  </p>

                  {guestBonusBlocked ? (
                    <p className={styles.fieldError}>
                      {t("checkoutModal.form.bonusOnlyForUsers", {
                        defaultValue:
                          "Товары за баллы можно купить только после входа в аккаунт.",
                      })}{" "}
                      <Link
                        href="/login"
                        onClick={onClose}
                        className={styles.link}
                      >
                        {t("auth.modal.login")}
                      </Link>
                    </p>
                  ) : isBonusOrder ? (
                    canPayWithBonus ? (
                      <p>
                        {t("checkoutModal.form.payWithBonus", {
                          balance: bonusBalance.toLocaleString("ru-RU"),
                        })}
                      </p>
                    ) : (
                      <p className={styles.fieldError}>
                        {t("checkoutModal.form.noBonus")}
                      </p>
                    )
                  ) : (
                    <div className={styles.radioGroup}>
                      <label
                        className={`${styles.radioOption} ${payment === "qr" ? styles.radioActive : ""}`}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          checked={payment === "qr"}
                          onChange={() => setPayment("qr")}
                        />
                        {t("checkoutModal.form.payQr", {
                          defaultValue: "QR-код (онлайн)",
                        })}
                      </label>
                      <label
                        className={`${styles.radioOption} ${payment === "cash" ? styles.radioActive : ""}`}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          checked={payment === "cash"}
                          onChange={() => setPayment("cash")}
                        />
                        {t("checkoutModal.form.payCash", {
                          defaultValue: "Наличными при получении",
                        })}
                      </label>
                    </div>
                  )}
                  {errors.payment_method && (
                    <p className={styles.fieldError}>{errors.payment_method}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={submitDisabled}
                >
                  {orderMutation.isPending
                    ? t("checkoutModal.form.processing")
                    : t("checkoutModal.form.submitButton")}
                </button>
              </div>
            </form>
          </>
        )}

        {step === "pay" && createdOrder && (
          <div className={styles.successBlock}>
            <h3 className={styles.title}>{t("checkoutModal.success.title")}</h3>

            {createdOrder.order_number && (
              <div className={styles.orderNumberBox}>
                <span>
                  {t("checkoutModal.success.orderNumber", {
                    defaultValue: "Номер заказа",
                  })}
                </span>
                <strong>{formatOrderNumber(createdOrder.order_number)}</strong>
              </div>
            )}

            <div className={styles.orderSummary}>
              {deliveryMethod === "delivery" &&
                (createdOrder.address || form.address) && (
                  <p className={styles.summaryRow}>
                    <span>{t("checkoutModal.success.deliveryAddress")}:</span>
                    <span>{createdOrder.address || form.address}</span>
                  </p>
                )}
              {deliveryMethod === "pickup" && (
                <p className={styles.summaryRow}>
                  <span>
                    {t("checkoutModal.form.pickup", {
                      defaultValue: "Самовывоз из офиса",
                    })}
                    :
                  </span>
                  <span>{t("footer.address.street")}</span>
                </p>
              )}
              {orderDateValue && (
                <p className={styles.summaryRow}>
                  <span>{orderDateLabel}:</span>
                  <span>{orderDateValue}</span>
                </p>
              )}
              <p className={styles.summaryRow}>
                <span>{t("checkoutModal.success.totalAmount")}:</span>
              </p>
              <p className={styles.summaryTotal}>
                {Number(createdOrder.total_price).toLocaleString()}{" "}
                {t("checkoutModal.form.currency")}
              </p>
            </div>
            <div style={{ marginBottom: 12 }}>
              <PaymentDeadline order={createdOrder} />
            </div>
            <button
              className={styles.btnPrimary}
              onClick={handlePay}
              disabled={payMutation.isPending}
            >
              {payMutation.isPending
                ? t("checkoutModal.success.processingPayment")
                : t("checkoutModal.success.payButton")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
