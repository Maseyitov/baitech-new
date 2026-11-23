"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./style.scss";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  useCart,
  useCreateCartItem,
  useDeleteCartItem,
} from "@/lib/cart/hooks/hooks";
import { IoCart, IoCartOutline, IoClose, IoEyeOutline } from "react-icons/io5";
import { FaWhatsapp } from "react-icons/fa";
import { useSiteSettings } from "@/lib/settings/hook";

const HIGH_PRICE_LIMIT = 100000;
const PRODUCT_PLACEHOLDER = "/product-placeholder.svg";

const buildWhatsAppLink = (whatsapp, phone, message) => {
  const encodedMessage = encodeURIComponent(message);
  const raw = String(whatsapp || "").trim();

  if (raw) {
    if (/^https?:\/\//i.test(raw)) {
      try {
        const url = new URL(raw);
        url.searchParams.set("text", message);
        return url.toString();
      } catch {
        const separator = raw.includes("?") ? "&" : "?";
        return `${raw}${separator}text=${encodedMessage}`;
      }
    }

    const digits = raw.replace(/\D/g, "");
    if (digits) return `https://wa.me/${digits}?text=${encodedMessage}`;
  }

  const phoneDigits = String(phone || "").replace(/\D/g, "");
  if (phoneDigits) return `https://wa.me/${phoneDigits}?text=${encodedMessage}`;

  return null;
};

function Card({ product }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { mutate: addToCart, isPending } = useCreateCartItem();
  const { mutate: deleteFromCart } = useDeleteCartItem();
  const { data: cartItems } = useCart();
  const { settings } = useSiteSettings();
  const [showImageModal, setShowImageModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const productId =
    product?.id ?? product?.pk ?? product?.product_id ?? product?.product?.id;
  const productDetailPath = productId
    ? `/productdetail/${encodeURIComponent(String(productId))}`
    : "#";
  const cartItem = cartItems?.find(
    (item) => item.product?.id === productId || item.product_id === productId,
  );
  const isInCart = !!cartItem;
  const imageSrc = product?.existing_images?.[0]?.image || PRODUCT_PLACEHOLDER;
  const isAvailable = product?.is_available;
  const discount = Number(product?.discount || 0);
  const hasDiscount = discount > 0;
  const numericPrice =
    product?.price === null ||
    product?.price === undefined ||
    product?.price === ""
      ? null
      : Number(product.price);
  const formattedPrice = Number.isFinite(numericPrice)
    ? numericPrice.toLocaleString("ru-RU", { maximumFractionDigits: 0 })
    : "-";
  const isHighPrice =
    Number.isFinite(numericPrice) && numericPrice >= HIGH_PRICE_LIMIT;
  // Товар без цены (или с ценой 0) продаётся только за бонусные баллы
  const isBonusOnly = !(numericPrice > 0);

  const whatsappMessage = isHighPrice
    ? "Здравствуйте! Интересует товар: " +
      (product?.name || "-") +
      ", артикул: " +
      (product?.article || "-") +
      "."
    : "Здравствуйте! Интересует товар: " +
      (product?.name || "-") +
      ", артикул: " +
      (product?.article || "-") +
      ", цена: " +
      formattedPrice +
      " сом.";
  const whatsappLink = buildWhatsAppLink(
    settings?.whatsapp,
    settings?.phone,
    whatsappMessage,
  );

  const handleAddToCart = () => {
    if (!productId) return;
    if (isInCart) {
      deleteFromCart(cartItem.id);
    } else {
      addToCart({ product_id: productId, quantity: 1 });
    }
  };

  const handleCardClick = (event) => {
    const target = event.target;
    if (
      target.closest(
        "a, button, input, textarea, select, label, [role='button']",
      )
    ) {
      return;
    }
    if (productId) {
      router.push(productDetailPath);
    }
  };

  const handleCardKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (productId) {
        router.push(productDetailPath);
      }
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div
        className="product-card"
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        role="link"
        tabIndex={0}
      >
        <div
          className="product-card__badge"
          style={{ backgroundColor: isAvailable ? "#94C184" : "#E35845" }}
        >
          {isAvailable ? t("card.inStock") : t("card.outOfStock")}
        </div>
        {hasDiscount && (
          <div className="product-card__discount">-{discount}%</div>
        )}

        <Link href={productDetailPath}>
          <div className="product-card__image">
            <button
              type="button"
              className="product-card__preview-btn"
              aria-label=""
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setShowImageModal(true);
              }}
            >
              <IoEyeOutline size={18} />
            </button>
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={"product"}
                width={300}
                height={300}
                className="product-card__img"
                sizes="(max-width: 480px) 45vw, (max-width: 768px) 30vw, 300px"
                quality={75}
                loading="eager"
              />
            ) : (
              <div className="image-placeholder">
                <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                  <circle
                    cx="50"
                    cy="40"
                    r="15"
                    stroke="#ccc"
                    strokeWidth="2"
                  />
                  <path
                    d="M30 80 Q50 60 70 80"
                    stroke="#ccc"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
            )}
          </div>
        </Link>

        <h3 className="product-card__article">
          {t("card.article")}: {product.article}
        </h3>
        <h3 className="product-card__title" title={product.name}>
          {product.name}
        </h3>

        <p className="product-card__features">{product.description}</p>

        <div className="product-card__footer">
          {isHighPrice ? (
            <div className="product-card__contact-price">
              <p className="product-card__contact-title">
                {t("card.contactForPrice")}
              </p>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="product-card__whatsapp product-card__whatsapp--full"
                >
                  <FaWhatsapp size={16} />
                  {t("card.writeToWhatsApp")}
                </a>
              )}
            </div>
          ) : isAvailable ? (
            <>
              <div className="product-card__price">
                {isBonusOnly ? (
                  <span className="amount product-card__price--bonus">
                    {product.bonus_price ?? 0}{" "}
                    {t("card.bonusPoints", t("ball"))}
                  </span>
                ) : (
                  <>
                    <span className="currency">
                      {product.bonus || 0} {t("card.bonuses")}
                    </span>
                    <span className="amount">
                      {formattedPrice} {t("card.currency")}
                    </span>
                  </>
                )}
              </div>
              <button
                className={`product-card__cart ${isInCart ? "product-card__cart--active" : ""}`}
                aria-label={t("card.addToCart")}
                onClick={handleAddToCart}
                disabled={isPending}
              >
                {isInCart ? <IoCart size={20} /> : <IoCartOutline size={20} />}
              </button>
            </>
          ) : (
            <a
              href={
                whatsappLink ?? settings?.whatsapp ?? `tel:${settings?.phone}`
              }
              target="_blank"
              rel="noreferrer"
              className="product-card__availability-btn"
            >
              {t("card.checkAvailability")}
            </a>
          )}
        </div>

        {!isAvailable && !isHighPrice && whatsappLink ? (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="product-card__whatsapp"
          >
            <FaWhatsapp size={16} />
            {t("card.whatsapp")}
          </a>
        ) : null}
      </div>

      {mounted && showImageModal
        ? createPortal(
            <div
              className="product-card__preview-overlay"
              onClick={() => setShowImageModal(false)}
            >
              <div
                className="product-card__preview-modal"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="product-card__preview-close"
                  aria-label="Close preview"
                  onClick={() => setShowImageModal(false)}
                >
                  <IoClose size={20} />
                </button>
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={product?.name || "product"}
                    width={1400}
                    height={1000}
                    className="product-card__preview-image"
                  />
                ) : (
                  <div className="product-card__preview-empty">No image</div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export default Card;
