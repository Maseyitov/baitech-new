"use client";
import { useState, useEffect } from "react";
import { IoCartOutline, IoCart } from "react-icons/io5";
import { FaWhatsapp } from "react-icons/fa";
import Image from "next/image";
import "./ProductCard.scss";
import { productApi } from "@/lib/products/api/useProducts";
import { useTranslation } from "react-i18next";
import {
  useCart,
  useCreateCartItem,
  useDeleteCartItem,
} from "@/lib/cart/hooks/hooks";
import { useSiteSettings } from "@/lib/settings/hook";
import { useQuery } from "@tanstack/react-query";

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

const ProductCard = ({ productId }) => {
  const [activeImage, setActiveImage] = useState(null);
  const [count, setCount] = useState(1);
  const { t } = useTranslation();
  const { settings } = useSiteSettings();

  const { data: product, isLoading: loading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productApi.getById(productId),
    enabled: !!productId,
  });

  const { data: cartItems } = useCart();
  const { mutate: addToCart, isPending: isAdding } = useCreateCartItem();
  const { mutate: deleteFromCart, isPending: isDeleting } = useDeleteCartItem();

  const cartItem = cartItems?.find(
    (item) =>
      item.product?.id === product?.id || item.product_id === product?.id,
  );
  const isInCart = !!cartItem;
  const isAvailable = product?.is_available;

  useEffect(() => {
    if (cartItem?.quantity) {
      setCount(cartItem.quantity);
    }
  }, [cartItem]);

  useEffect(() => {
    if (!product) return;
    const imgs =
      product.existing_images?.map((img) => img.image).filter(Boolean) || [];
    setActiveImage(imgs[0] || PRODUCT_PLACEHOLDER);
  }, [product]);

  const images =
    product?.existing_images?.map((img) => img.image).filter(Boolean) || [];
  const displayImages = images.length > 0 ? images : [PRODUCT_PLACEHOLDER];
  const currentImage = activeImage || displayImages[0];

  const increment = () => setCount((c) => c + 1);
  const decrement = () => count > 1 && setCount((c) => c - 1);
  const productName = product?.name || t("productCard.notFound");
  const productDescription = product?.description || "";
  const shortDescription =
    productDescription.length > 150
      ? `${productDescription.slice(0, 150)}...`
      : productDescription;
  const parsedPrice = Number(product?.price);
  const formattedPrice = Number.isFinite(parsedPrice)
    ? parsedPrice.toLocaleString()
    : product?.price || "0";
  const isHighPrice =
    Number.isFinite(parsedPrice) && parsedPrice >= HIGH_PRICE_LIMIT;
  // Товар без цены (или с ценой 0) продаётся только за бонусные баллы
  const isBonusOnly = !(parsedPrice > 0);
  const whatsappMessage = isHighPrice
    ? `Здравствуйте! Интересует товар: ${product?.name || "-"}, артикул: ${product?.article || "-"}.`
    : `Здравствуйте! Интересует товар: ${product?.name || "-"}, артикул: ${product?.article || "-"}, цена: ${formattedPrice} сом.`;
  const whatsappLink = buildWhatsAppLink(
    settings?.whatsapp,
    settings?.phone,
    whatsappMessage,
  );

  const handleCartClick = () => {
    if (!product?.id) return;

    if (isInCart) {
      deleteFromCart(cartItem.id);
    } else {
      addToCart({ product_id: product.id, quantity: count });
    }
  };

  if (loading) return <div className="loader"></div>;
  if (!product)
    return (
      <div className="product text-center">{t("productCard.notFound")}</div>
    );

  return (
    <>
      <div className="product">
        <div className="product__gallery">
          <div className="product__thumbs">
            {displayImages.map((img) => (
              <button
                key={img}
                className={`product__thumb ${currentImage === img ? "active" : ""}`}
                onClick={() => setActiveImage(img)}
                type="button"
              >
                <Image
                  src={img}
                  alt={`${productName} preview`}
                  width={82}
                  height={82}
                />
              </button>
            ))}
          </div>

          <div className="product__image">
            <Image
              src={currentImage}
              alt={productName}
              width={471}
              height={471}
            />
          </div>
        </div>

        <div className="product__info">
          <h1>
            {t("productCard.article")}: {product.article || "-"}
          </h1>
          <p className="product__desc">{productName}</p>
          <p
            className="product__descip line-clamp-3"
            title={productDescription}
          >
            {shortDescription}
          </p>
          {isHighPrice ? (
            <div className="product__contact-title">
              {t("card.contactForPrice")}
            </div>
          ) : isBonusOnly ? (
            <div className="product__price product__price--bonus">
              {product.bonus_price || 0}{" "}
              {t("productCard.bonusPoints", t("ball"))}
            </div>
          ) : (
            <>
              <div className="product__price">
                {formattedPrice} {t("productCard.currency")}
              </div>
              <div className="product__bonus">
                {product.bonus || 0} {t("productCard.bonuses")}
              </div>
            </>
          )}

          <div className="product__actions">
            {isHighPrice ? (
              whatsappLink ? (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="product-card__whatsapp"
                >
                  <FaWhatsapp size={16} />
                  {t("card.writeToWhatsApp")}
                </a>
              ) : null
            ) : isAvailable ? (
              <>
                <div className="counter">
                  <button onClick={decrement} type="button">
                    -
                  </button>
                  <span>{count}</span>
                  <button onClick={increment} type="button">
                    +
                  </button>
                </div>

                <button
                  className="add-to-cart"
                  onClick={handleCartClick}
                  disabled={isAdding || isDeleting}
                  style={{
                    backgroundColor: isInCart ? "#0E2E5B" : "",
                    color: isInCart ? "#FFFFFF" : "",
                  }}
                >
                  {isInCart ? (
                    <IoCart size={20} />
                  ) : (
                    <IoCartOutline size={20} />
                  )}
                  {t("productCard.addToCart")}
                </button>
              </>
            ) : (
              <a
                href={
                  whatsappLink ??
                  settings?.whatsapp ??
                  `tel:${settings?.phone ?? ""}`
                }
                target="_blank"
                rel="noreferrer"
                className="product-card__availability-btn"
              >
                {t("card.checkAvailability")}
              </a>
            )}
          </div>

          {!isAvailable && !isHighPrice && (
            <a
              href={
                whatsappLink ??
                settings?.whatsapp ??
                `tel:${settings?.phone ?? ""}`
              }
              target="_blank"
              rel="noreferrer"
              className="product-card__whatsapp"
            >
              <FaWhatsapp size={16} />
              {t("card.whatsapp")}
            </a>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductCard;
