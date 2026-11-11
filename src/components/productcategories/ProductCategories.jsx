"use client";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import styles from "./ProductCategories.module.scss";
import { productCategories } from "./categoriesList";

export default function ProductCategories({ items = productCategories }) {
  const { t } = useTranslation();

  if (!items.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.title}>
          {t("productCategories.title", "Категории товаров")}
        </h2>

        <Link href="/catalog" className={styles.all}>
          {t("productCategories.all", "Смотреть все")}
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className={styles.grid}>
        {items.map((item) => (
          <Link
            key={item.key}
            href={`/catalog?category=${encodeURIComponent(item.category)}`}
            className={styles.card}
          >
            {item.image && (
              <span className={styles.imageBox}>
                <Image
                  className={styles.image}
                  src={item.image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1100px) 33vw, 320px"
                  quality={90}
                />
              </span>
            )}

            <span className={styles.info}>
              <span className={styles.name}>
                {t(
                  `productCategories.names.${item.key}`,
                  item.title || item.category,
                )}
              </span>
              {item.count != null && (
                <span className={styles.count}>
                  {item.count} {t("productCategories.items", "товаров")}
                </span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
