"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./PopularBrands.module.scss";
import { popularBrands } from "./brandsList";

export default function PopularBrands({ brands = popularBrands }) {
  const { t } = useTranslation();
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startScroll: 0,
    moved: false,
  });

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateArrows, brands.length]);

  const scrollByPage = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  // --- Перетаскивание мышкой ---
  const onPointerDown = (e) => {
    if (e.pointerType !== "mouse") return; // на телефоне работает обычный свайп
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: trackRef.current.scrollLeft,
      moved: false,
    };
    // setIsDragging(true) здесь больше НЕ вызываем, иначе клик не срабатывает
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      setIsDragging(true); // включаем режим перетаскивания только после реального сдвига
    }
    if (d.moved) {
      trackRef.current.scrollLeft = d.startScroll - dx;
    }
  };

  const endDrag = () => {
    dragRef.current.active = false;
    setIsDragging(false);
  };

  // Если был перетаск, клик по плитке не открывает ссылку
  const onCardClick = (e) => {
    if (dragRef.current.moved) {
      e.preventDefault();
      dragRef.current.moved = false;
    }
  };

  if (!brands.length) return null;

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.title}>
          {t("popularBrands.title", "Популярные бренды")}
        </h2>
      </div>

      <div className={styles.wrap}>
        {canPrev && (
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowPrev}`}
            onClick={() => scrollByPage(-1)}
            aria-label="Назад"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <div
          className={`${styles.track} ${isDragging ? styles.dragging : ""}`}
          ref={trackRef}
          onScroll={updateArrows}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
        >
          {brands.map((brand) => (
            <Link
              key={brand.name}
              href={
                brand.href || `/catalog?query=${encodeURIComponent(brand.name)}`
              }
              className={styles.card}
              onClick={onCardClick}
              draggable={false}
            >
              {brand.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logo.src ?? brand.logo}
                  alt={brand.name}
                  className={styles.logo}
                  draggable={false}
                />
              ) : (
                <span className={styles.name}>{brand.name}</span>
              )}
            </Link>
          ))}
        </div>

        {canNext && (
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowNext}`}
            onClick={() => scrollByPage(1)}
            aria-label="Вперёд"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </section>
  );
}
