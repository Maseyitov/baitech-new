"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./Cart.module.scss";
import { Trash2, Minus, Plus } from "lucide-react";
import { useDeleteCartItem, useUpdateCartItem } from "@/lib/cart/hooks/hooks";
import { useTranslation } from "react-i18next";
import { getProductImage } from "@/lib/cart/api/guestOrder";

export default function CartItem({ item, checked, onToggle, index = 0 }) {
  const { t } = useTranslation();
  const product = item.product || {};
  const discount = Number(product?.discount || 0);
  const hasDiscount = discount > 0;
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteCartItem();
  const { mutate: updateItem, isPending } = useUpdateCartItem();
  const imageSrc = getProductImage(product);
  const productLink = product.id ? `/productdetail/${product.id}` : null;

  const handleDelete = () => {
    if (item.id) deleteItem(item.id);
  };

  const handleIncrement = () => {
    updateItem({ id: item.id, quantity: item.quantity + 1 });
  };

  const handleDecrement = () => {
    if (item.quantity <= 1) return;
    updateItem({ id: item.id, quantity: item.quantity - 1 });
  };

  const rawPrice = product?.price ?? item.price;
  const numericPrice =
    rawPrice === null || rawPrice === undefined || rawPrice === ""
      ? null
      : Number(rawPrice);
  const isBonusOnly = !(numericPrice > 0);
  const lineTotal = Number(
    item.total_price ?? (numericPrice || 0) * item.quantity,
  );

  return (
    <div
      className={`${styles.card} ${checked ? styles.cardSelected : ""} ${isDeleting ? styles.cardRemoving : ""}`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <label
        className={styles.selectBox}
        title={t("cart.select", { defaultValue: "Выбрать для заказа" })}
      >
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
        />
      </label>

      <div className={styles.imageBlock}>
        {product.is_available !== undefined && (
          <span className={styles.badge}>
            {product.is_available
              ? t("cartItem.inStock")
              : t("cartItem.outOfStock")}
          </span>
        )}
        {hasDiscount && <span className={styles.discount}>-{discount}%</span>}
        {imageSrc && (
          <Image
            src={imageSrc}
            alt={product.name || "product"}
            width={160}
            height={160}
          />
        )}
      </div>

      <div className={styles.infoBlock}>
        <div className={styles.header}>
          <span className={styles.article}>
            {product.article
              ? `${t("cartItem.article")}: ${product.article}`
              : ""}
          </span>
          <button
            className={styles.deleteBtn}
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={t("cart.remove", { defaultValue: "Удалить" })}
          >
            <Trash2 size={18} />
          </button>
        </div>

        {productLink ? (
          <Link href={productLink} className={styles.itemTitle}>
            {product.name}
          </Link>
        ) : (
          <h4 className={styles.itemTitle}>{product.name}</h4>
        )}
        <p className={styles.description}>
          {product.description?.slice(0, 85)}
          {product.description?.length > 85 ? "..." : ""}
        </p>

        <div className={styles.footer}>
          <div className={styles.counter}>
            <button
              onClick={handleDecrement}
              disabled={isPending || item.quantity <= 1}
              aria-label="-"
            >
              <Minus size={16} />
            </button>
            <span>{item.quantity}</span>
            <button
              onClick={handleIncrement}
              disabled={isPending}
              aria-label="+"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className={styles.priceRow}>
            {product.bonus !== undefined && !isBonusOnly && (
              <div className={styles.bonus}>
                +{Number((product.bonus || 0) * item.quantity).toLocaleString()}{" "}
                {t("cartItem.bonuses")}
              </div>
            )}
            <div className={styles.price} key={lineTotal}>
              {isBonusOnly
                ? `${Number((product.bonus_price || 0) * item.quantity).toLocaleString()} ${t("ball")}`
                : `${lineTotal.toLocaleString()} ${t("cartItem.currency")}`}
            </div>
            {!isBonusOnly && item.quantity > 1 && (
              <div className={styles.unitPrice}>
                {Number(numericPrice).toLocaleString()} {t("cartItem.currency")}{" "}
                × {item.quantity}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
