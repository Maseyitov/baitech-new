"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import styles from "./CatalogMenu.module.scss";
import { ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { useProducts } from "@/lib/products/hooks/hooks";
import { productApi } from "@/lib/products/api/useProducts";
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from "./Categoryicons";
import { useSectionCategories } from "@/lib/catalog/sectionCategories";

// Сколько под-подкатегорий показывать сразу. Остальные — по кнопке «Показать ещё»,
// чтобы одна длинная группа не растягивала колонку (как на Дельте)
const MAX_VISIBLE_CHILDREN = 8;

export default function Catalog({ onClose }) {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    categories: rawCategories,
    brands: allBrands,
    isLoading,
  } = useProducts();
  const categories = useSectionCategories(rawCategories);
  const [activeCategory, setActiveCategory] = useState(null);

  // hoveredSub может быть как подкатегорией (уровень 2), так и под-подкатегорией (уровень 3)
  const [hoveredSub, setHoveredSub] = useState(null);
  const [subBrands, setSubBrands] = useState([]);
  const [brandsBySubId, setBrandsBySubId] = useState({});
  const [isBrandsLoading, setIsBrandsLoading] = useState(false);
  const [expandedSubs, setExpandedSubs] = useState({});

  const hideTimer = useRef(null);
  const contentRef = useRef(null);
  const currentCategory = activeCategory ?? categories?.[0] ?? null;

  // При смене категории правая часть прокручивается в начало
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [currentCategory?.id]);

  const toggleExpanded = (id) =>
    setExpandedSubs((prev) => ({ ...prev, [id]: !prev[id] }));

  const fetchBrandsForSub = useCallback(
    async (sub) => {
      try {
        const data = await productApi.getByCategory(sub.name);
        const products = data.results || data;
        const brandIds = [...new Set(products.map((p) => p.brand))];
        return (allBrands || []).filter((brand) => brandIds.includes(brand.id));
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    [allBrands],
  );

  const handleParentMouseEnter = (item) => {
    clearTimeout(hideTimer.current);
    setHoveredSub(item);
    setSubBrands([]);
  };

  // Предзагружаем бренды только для "листовых" элементов:
  // — подкатегорий (уровень 2) БЕЗ своих детей
  // — всех под-подкатегорий (уровень 3)
  useEffect(() => {
    const preloadBrands = async () => {
      const subcategories = currentCategory?.subcategories || [];
      const leafSubs = subcategories.filter(
        (sub) => !sub.subcategories?.length,
      );
      const allChildren = subcategories.flatMap(
        (sub) => sub.subcategories || [],
      );
      const allItems = [...leafSubs, ...allChildren];
      const missingSubs = allItems.filter(
        (item) => !(item.id in brandsBySubId),
      );

      if (missingSubs.length === 0) return;

      const loadedEntries = await Promise.all(
        missingSubs.map(async (item) => [
          item.id,
          await fetchBrandsForSub(item),
        ]),
      );

      setBrandsBySubId((prev) => ({
        ...prev,
        ...Object.fromEntries(loadedEntries),
      }));
    };

    preloadBrands();
  }, [brandsBySubId, currentCategory, fetchBrandsForSub]);

  // Универсальный обработчик — для подкатегории и под-подкатегории
  const handleSubMouseEnter = async (item) => {
    clearTimeout(hideTimer.current);

    const cachedBrands = brandsBySubId[item.id];
    if (cachedBrands) {
      if (cachedBrands.length === 0) {
        setHoveredSub(null);
        setSubBrands([]);
        return;
      }
      setHoveredSub(item);
      setSubBrands(cachedBrands);
      return;
    }

    setIsBrandsLoading(true);
    const brands = await fetchBrandsForSub(item);
    setBrandsBySubId((prev) => ({ ...prev, [item.id]: brands }));
    setIsBrandsLoading(false);

    if (brands.length === 0) {
      setHoveredSub(null);
      setSubBrands([]);
      return;
    }
    setHoveredSub(item);
    setSubBrands(brands);
  };

  const scheduleHide = () => {
    hideTimer.current = setTimeout(() => {
      setHoveredSub(null);
      setSubBrands([]);
    }, 150);
  };

  const handleSubMouseLeave = scheduleHide;
  const handlePopupMouseEnter = () => clearTimeout(hideTimer.current);
  const handlePopupMouseLeave = scheduleHide;

  const handleCategoryClick = (category) => {
    onClose();
    router.push(`/catalog?category=${encodeURIComponent(category.name)}`);
  };

  const handleSubcategoryClick = (subcategory) => {
    onClose();
    router.push(`/catalog?category=${encodeURIComponent(subcategory.name)}`);
  };

  const handleBrandClick = (sub, brandId) => {
    onClose();
    router.push(
      `/catalog?category=${encodeURIComponent(sub.name)}&brand=${brandId}`,
    );
  };

  if (isLoading) {
    return (
      <div className={styles.overlay}>
        <Loader2 className={styles.spinner} />
      </div>
    );
  }

  const subcategories = currentCategory?.subcategories || [];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${styles.catalogContainer} container`}
      >
        <aside className={styles.sidebar}>
          {categories?.map((category) => (
            <button
              key={category.id}
              className={`${styles.navButton} ${currentCategory?.id === category.id ? styles.active : ""}`}
              onMouseEnter={() => setActiveCategory(category)}
              onClick={() => handleCategoryClick(category)}
              title={category.name}
            >
              <div className={styles.navLeft}>
                <span className={styles.icon}>
                  {CATEGORY_ICONS[category.id] ?? DEFAULT_CATEGORY_ICON}
                </span>
                <span className={styles.label}>{category.name}</span>
              </div>
              <ChevronRight size={14} className={styles.chevron} />
            </button>
          ))}
        </aside>

        {currentCategory && (
          <main className={styles.content} ref={contentRef}>
            {subcategories.length > 0 ? (
              // Группы сами распределяются по колонкам сверху вниз (CSS columns),
              // поэтому колонки получаются ровными, а окно не меняет размер
              <div className={styles.columnsWrap}>
                {subcategories.map((sub) => {
                  const children = sub.subcategories || [];
                  const hasChildren = children.length > 0;
                  // Попап брендов у уровня 2 — только если у sub НЕТ своих детей
                  const hasBrands =
                    !hasChildren && (brandsBySubId[sub.id] || []).length > 0;

                  const isExpanded = Boolean(expandedSubs[sub.id]);
                  const hiddenCount = children.length - MAX_VISIBLE_CHILDREN;
                  const visibleChildren =
                    isExpanded || hiddenCount <= 0
                      ? children
                      : children.slice(0, MAX_VISIBLE_CHILDREN);

                  return (
                    <div key={sub.id} className={styles.subGroup}>
                      <button
                        className={`${styles.subTitle} ${hoveredSub?.id === sub.id ? styles.subTitleActive : ""}`}
                        onMouseEnter={() => {
                          if (!hasChildren) handleSubMouseEnter(sub);
                        }}
                        onMouseLeave={handleSubMouseLeave}
                        onClick={() => handleSubcategoryClick(sub)}
                      >
                        {sub.name}
                        {hasBrands && (
                          <ChevronRight
                            size={13}
                            className={styles.subChevron}
                          />
                        )}

                        {hoveredSub?.id === sub.id && hasBrands && (
                          <div
                            className={styles.brandsPopup}
                            onMouseEnter={handlePopupMouseEnter}
                            onMouseLeave={handlePopupMouseLeave}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isBrandsLoading ? (
                              <div className={styles.popupLoader}>
                                <Loader2 size={16} className={styles.spinner} />
                              </div>
                            ) : (
                              <ul className={styles.brandsList}>
                                {subBrands.map((brand) => (
                                  <li key={brand.id}>
                                    <button
                                      className={styles.brandItem}
                                      onClick={() =>
                                        handleBrandClick(hoveredSub, brand.id)
                                      }
                                    >
                                      {brand.name}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </button>

                      {hasChildren && (
                        <ul className={styles.subList}>
                          {visibleChildren.map((child) => {
                            const grandChildren = child.subcategories || [];
                            const hasGrand = grandChildren.length > 0;
                            const childHasBrands =
                              !hasGrand &&
                              (brandsBySubId[child.id] || []).length > 0;
                            const hasPopup = hasGrand || childHasBrands;

                            return (
                              <li key={child.id} className={styles.subGroup1}>
                                <button
                                  className={`${styles.subItem} ${hoveredSub?.id === child.id ? styles.subItemActive : ""}`}
                                  onMouseEnter={() =>
                                    hasGrand
                                      ? handleParentMouseEnter(child)
                                      : handleSubMouseEnter(child)
                                  }
                                  onMouseLeave={handleSubMouseLeave}
                                  onClick={() => handleSubcategoryClick(child)}
                                >
                                  {child.name}
                                  {hasPopup && (
                                    <ChevronRight
                                      size={12}
                                      className={styles.subChevron}
                                    />
                                  )}

                                  {hoveredSub?.id === child.id && hasPopup && (
                                    <div
                                      className={styles.brandsPopup}
                                      onMouseEnter={handlePopupMouseEnter}
                                      onMouseLeave={handlePopupMouseLeave}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ul className={styles.brandsList}>
                                        {hasGrand
                                          ? grandChildren.map((g) => (
                                              <li key={g.id}>
                                                <button
                                                  className={styles.brandItem}
                                                  onClick={() =>
                                                    handleSubcategoryClick(g)
                                                  }
                                                >
                                                  {g.name}
                                                </button>
                                              </li>
                                            ))
                                          : subBrands.map((brand) => (
                                              <li key={brand.id}>
                                                <button
                                                  className={styles.brandItem}
                                                  onClick={() =>
                                                    handleBrandClick(
                                                      child,
                                                      brand.id,
                                                    )
                                                  }
                                                >
                                                  {brand.name}
                                                </button>
                                              </li>
                                            ))}
                                      </ul>
                                    </div>
                                  )}
                                </button>
                              </li>
                            );
                          })}

                          {hiddenCount > 0 && (
                            <li>
                              <button
                                type="button"
                                className={styles.showMore}
                                onClick={() => toggleExpanded(sub.id)}
                                aria-expanded={isExpanded}
                              >
                                {isExpanded
                                  ? t("catalog.showLess", "Свернуть")
                                  : t("catalog.showMore", "Показать ещё")}
                                <ChevronDown
                                  size={13}
                                  className={`${styles.showMoreIcon} ${isExpanded ? styles.showMoreIconOpen : ""}`}
                                />
                              </button>
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.empty}>
                {t("catalog.noSubcategories", "Нет подкатегорий")}
              </p>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
