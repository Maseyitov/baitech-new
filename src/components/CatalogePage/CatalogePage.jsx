"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useProducts } from "@/lib/products/hooks/hooks";
import { productApi } from "@/lib/products/api/useProducts";
import { useQuery } from "@tanstack/react-query";
import styles from "./CatalogPage.module.scss";
import {
  LayoutGrid,
  List,
  AlignJustify,
  ChevronDown,
  Search,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  X,
  Check,
} from "lucide-react";
import ProductCard from "./ProductCard";
import FullProductCard from "./FullProductCard";
import Card from "../ui/card/Card";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  searchProducts,
  buildCategoryNameMap,
  buildBrandNameMap,
} from "@/lib/products/search";
import { useSearchProductsPool } from "@/lib/products/hooks/useSearchProductsPool";

const CATALOG_TEXTS = {
  ru: {
    home: "Главная",
    catalog: "Каталог",
    loading: "Загрузка...",
    filterTitle: "Фильтры",
    subcategories: "Подкатегории",
    category: "Категория",
    categorySearch: "Поиск категории...",
    brand: "Бренд",
    brandSearch: "Поиск бренда...",
    price: "Цена",
    from: "От",
    to: "До",
    show: "Показать",
    reset: "Сбросить",
    notFound: "Товары не найдены",
    notMatched: "Ничего не найдено",
    prev: "Назад",
    next: "Вперед",
    filters: "Фильтры",
    apply: "Применить",
    closeFilters: "Закрыть фильтры",
    activeFilters: "активных фильтра",
  },
  en: {
    home: "Home",
    catalog: "Catalog",
    loading: "Loading...",
    filterTitle: "Filters",
    subcategories: "Subcategories",
    category: "Category",
    categorySearch: "Search category...",
    brand: "Brand",
    brandSearch: "Search brand...",
    price: "Price",
    from: "From",
    to: "To",
    show: "Show",
    reset: "Reset",
    notFound: "No products found",
    notMatched: "Nothing found",
    prev: "Previous",
    next: "Next",
    filters: "Filters",
    apply: "Apply",
    closeFilters: "Close filters",
    activeFilters: "active filters",
  },
  ky: {
    home: "Башкы бет",
    catalog: "Каталог",
    loading: "Жүктөлүүдө...",
    filterTitle: "Фильтрлер",
    subcategories: "Подкатегориялар",
    category: "Категория",
    categorySearch: "Категория издөө...",
    brand: "Бренд",
    brandSearch: "Бренд издөө...",
    price: "Баа",
    from: "Баштап",
    to: "Чейин",
    show: "Көрсөтүү",
    reset: "Тазалоо",
    notFound: "Товарлар табылган жок",
    notMatched: "Эч нерсе табылган жок",
    prev: "Артка",
    next: "Алга",
    filters: "Фильтрлер",
    apply: "Колдонуу",
    closeFilters: "Жабуу",
    activeFilters: "активдүү фильтр",
  },
};

const sanitizePriceParam = (value, fallback) => {
  if (value === null || value === "") return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const clampPrice = (value, min, max) => Math.min(Math.max(value, min), max);
const findCategoryPath = (tree, name, trail = []) => {
  for (const node of tree || []) {
    const next = [...trail, node];
    if (node.name === name) return next;
    const found = findCategoryPath(node.subcategories, name, next);
    if (found) return found;
  }
  return null;
};
const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, "ellipsis", totalPages];
  if (currentPage >= totalPages - 3)
    return [
      1,
      "ellipsis",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
};

// ─── Mobile Filter Bottom Sheet ───────────────────────────────────────────────
function MobileFilterSheet({
  isOpen,
  onClose,
  tr,
  subcategories,
  categories,
  filteredCategories,
  cat,
  bnd,
  categorySearch,
  setCategorySearch,
  brandSource,
  filteredBrands,
  brandSearch,
  setBrandSearch,
  priceRange,
  sliderMaxPrice,
  PRICE_MIN_LIMIT,
  PRICE_STEP,
  handleReset,
  hasActiveFilters,
  activeFilterCount,
  router,
  searchParams,
}) {
  const sheetRef = useRef(null);
  const dragStartY = useRef(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [activeSection, setActiveSection] = useState(null);

  // ── Локальный черновик выбора — не меняет URL пока не нажат «Применить»
  const [draftCat, setDraftCat] = useState(cat);
  const [draftBnd, setDraftBnd] = useState(bnd);
  const [draftPrice, setDraftPrice] = useState({
    min: priceRange.min,
    max: priceRange.max,
  });

  // Синхронизируем черновик при открытии sheet
  useEffect(() => {
    if (isOpen) {
      setDraftCat(cat);
      setDraftBnd(bnd);
      setDraftPrice({ min: priceRange.min, max: priceRange.max });
    }
  }, [isOpen]);

  const draftProgressLeft =
    ((draftPrice.min - PRICE_MIN_LIMIT) /
      Math.max(1, sliderMaxPrice - PRICE_MIN_LIMIT)) *
    100;
  const draftProgressRight =
    ((draftPrice.max - PRICE_MIN_LIMIT) /
      Math.max(1, sliderMaxPrice - PRICE_MIN_LIMIT)) *
    100;

  const hasDraftChanges =
    draftCat !== cat ||
    draftBnd !== bnd ||
    draftPrice.min !== priceRange.min ||
    draftPrice.max !== priceRange.max;

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (draftCat) params.set("category", draftCat);
    else params.delete("category");
    if (draftBnd) params.set("brand", draftBnd);
    else params.delete("brand");
    if (draftPrice.min > PRICE_MIN_LIMIT)
      params.set("min_price", String(draftPrice.min));
    else params.delete("min_price");
    if (draftPrice.max < sliderMaxPrice)
      params.set("max_price", String(draftPrice.max));
    else params.delete("max_price");
    router.push(`?${params.toString()}`);
    onClose();
  };

  const handleDraftReset = () => {
    setDraftCat(null);
    setDraftBnd(null);
    setDraftPrice({ min: PRICE_MIN_LIMIT, max: sliderMaxPrice });
  };

  const hasDraftActive =
    draftCat ||
    draftBnd ||
    draftPrice.min > PRICE_MIN_LIMIT ||
    draftPrice.max < sliderMaxPrice;

  // Drag-to-close
  const onTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e) => {
    const delta = Math.max(0, e.touches[0].clientY - dragStartY.current);
    setDragOffset(delta);
  };
  const onTouchEnd = () => {
    if (dragOffset > 120) onClose();
    setDragOffset(0);
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const sections = [
    subcategories.length > 0 && { key: "sub", label: tr.subcategories },
    { key: "cat", label: tr.category },
    { key: "brand", label: tr.brand },
    { key: "price", label: tr.price },
  ].filter(Boolean);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 1000,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.28s ease",
          backdropFilter: isOpen ? "blur(2px)" : "none",
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1001,
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          maxHeight: "92dvh",
          display: "flex",
          flexDirection: "column",
          transform: isOpen
            ? `translateY(${dragOffset}px)`
            : "translateY(100%)",
          transition:
            dragOffset > 0
              ? "none"
              : "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          willChange: "transform",
        }}
      >
        {/* Drag handle + header */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            padding: "12px 0 4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            cursor: "grab",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "#D1D5DB",
              marginBottom: 8,
            }}
          />
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 16px 8px",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 18, color: "#111" }}>
              {tr.filterTitle}
            </span>
            <button
              onClick={onClose}
              aria-label={tr.closeFilters}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "none",
                background: "#F3F4F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={16} color="#374151" />
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div
          style={{
            borderBottom: "1px solid #F3F4F6",
            flexShrink: 0,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "0 16px",
              minWidth: "max-content",
            }}
          >
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() =>
                  setActiveSection(activeSection === s.key ? null : s.key)
                }
                style={{
                  padding: "10px 16px",
                  border: "none",
                  borderBottom:
                    activeSection === s.key
                      ? "2px solid #2563EB"
                      : "2px solid transparent",
                  background: "none",
                  fontSize: 14,
                  fontWeight: activeSection === s.key ? 600 : 400,
                  color: activeSection === s.key ? "#2563EB" : "#6B7280",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* Subcategories */}
          {(activeSection === "sub" || activeSection === null) &&
            subcategories.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                {activeSection === null && (
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#9CA3AF",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 10,
                    }}
                  >
                    {tr.subcategories}
                  </div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {subcategories.map((sub) => {
                    const selected = draftCat === sub.name;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setDraftCat(selected ? null : sub.name)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 20,
                          border: selected
                            ? "2px solid #2563EB"
                            : "1.5px solid #E5E7EB",
                          background: selected ? "#EFF6FF" : "#F9FAFB",
                          color: selected ? "#2563EB" : "#374151",
                          fontSize: 14,
                          fontWeight: selected ? 600 : 400,
                          cursor: "pointer",
                          transition: "all 0.15s",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {selected && <Check size={13} />}
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Category */}
          {(activeSection === "cat" || activeSection === null) && (
            <div style={{ marginBottom: 24 }}>
              {activeSection === null && (
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#9CA3AF",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 10,
                  }}
                >
                  {tr.category}
                </div>
              )}
              <div style={{ position: "relative", marginBottom: 10 }}>
                <input
                  type="text"
                  placeholder={tr.categorySearch}
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 36px 10px 14px",
                    border: "1.5px solid #E5E7EB",
                    borderRadius: 10,
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                    background: "#F9FAFB",
                  }}
                />
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9CA3AF",
                    pointerEvents: "none",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  maxHeight: 220,
                  overflowY: "auto",
                }}
              >
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => {
                    const selected = draftCat === category.name;
                    return (
                      <label
                        key={category.id}
                        onClick={() =>
                          setDraftCat(selected ? null : category.name)
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 14px",
                          borderRadius: 10,
                          cursor: "pointer",
                          background: selected ? "#EFF6FF" : "transparent",
                          transition: "background 0.12s",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 15,
                            color: selected ? "#2563EB" : "#111",
                            fontWeight: selected ? 600 : 400,
                          }}
                        >
                          {category.name}
                        </span>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            border: selected ? "none" : "1.5px solid #D1D5DB",
                            background: selected ? "#2563EB" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {selected && <Check size={13} color="#fff" />}
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <div
                    style={{
                      padding: "16px 0",
                      color: "#9CA3AF",
                      fontSize: 14,
                      textAlign: "center",
                    }}
                  >
                    {tr.notMatched}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Brand */}
          {(activeSection === "brand" || activeSection === null) &&
            (brandSource.length > 0 || brandSearch) && (
              <div style={{ marginBottom: 24 }}>
                {activeSection === null && (
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#9CA3AF",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 10,
                    }}
                  >
                    {tr.brand}
                  </div>
                )}
                <div style={{ position: "relative", marginBottom: 10 }}>
                  <input
                    type="text"
                    placeholder={tr.brandSearch}
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 36px 10px 14px",
                      border: "1.5px solid #E5E7EB",
                      borderRadius: 10,
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                      background: "#F9FAFB",
                    }}
                  />
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9CA3AF",
                      pointerEvents: "none",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    maxHeight: 220,
                    overflowY: "auto",
                  }}
                >
                  {filteredBrands.length > 0 ? (
                    filteredBrands.map((brand) => {
                      const selected = draftBnd === String(brand.id);
                      return (
                        <label
                          key={brand.id}
                          onClick={() =>
                            setDraftBnd(selected ? null : String(brand.id))
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 14px",
                            borderRadius: 10,
                            cursor: "pointer",
                            background: selected ? "#EFF6FF" : "transparent",
                            transition: "background 0.12s",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 15,
                              color: selected ? "#2563EB" : "#111",
                              fontWeight: selected ? 600 : 400,
                            }}
                          >
                            {brand.name}
                          </span>
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              border: selected ? "none" : "1.5px solid #D1D5DB",
                              background: selected ? "#2563EB" : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {selected && <Check size={13} color="#fff" />}
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div
                      style={{
                        padding: "16px 0",
                        color: "#9CA3AF",
                        fontSize: 14,
                        textAlign: "center",
                      }}
                    >
                      {tr.notMatched}
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Price */}
          {(activeSection === "price" || activeSection === null) && (
            <div style={{ marginBottom: 24 }}>
              {activeSection === null && (
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#9CA3AF",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 10,
                  }}
                >
                  {tr.price}
                </div>
              )}
              <div className={styles.priceRangeValues}>
                <span>
                  {tr.from}: {draftPrice.min.toLocaleString()} с
                </span>
                <span>
                  {tr.to}: {draftPrice.max.toLocaleString()} с
                </span>
              </div>
              <div className={styles.priceSlider}>
                <div className={styles.priceSliderTrack} />
                <div
                  className={styles.priceSliderRange}
                  style={{
                    left: `${draftProgressLeft}%`,
                    width: `${draftProgressRight - draftProgressLeft}%`,
                  }}
                />
                <input
                  type="range"
                  min={PRICE_MIN_LIMIT}
                  max={sliderMaxPrice}
                  step={PRICE_STEP}
                  value={draftPrice.min}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setDraftPrice((prev) => ({
                      ...prev,
                      min: Math.min(v, prev.max - PRICE_STEP),
                    }));
                  }}
                  className={`${styles.priceThumb} ${styles.priceThumbMin}`}
                  aria-label={tr.from}
                />
                <input
                  type="range"
                  min={PRICE_MIN_LIMIT}
                  max={sliderMaxPrice}
                  step={PRICE_STEP}
                  value={draftPrice.max}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setDraftPrice((prev) => ({
                      ...prev,
                      max: Math.max(v, prev.min + PRICE_STEP),
                    }));
                  }}
                  className={`${styles.priceThumb} ${styles.priceThumbMax}`}
                  aria-label={tr.to}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid #F3F4F6",
            display: "flex",
            gap: 10,
            flexShrink: 0,
            background: "#fff",
          }}
        >
          {hasDraftActive && (
            <button
              onClick={handleDraftReset}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 12,
                border: "1.5px solid #E5E7EB",
                background: "#fff",
                color: "#374151",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {tr.reset}
            </button>
          )}
          <button
            onClick={handleApply}
            style={{
              flex: 2,
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: hasDraftChanges ? "#2563EB" : "#93C5FD",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            {tr.apply}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CatalogPage() {
  const ITEMS_PER_PAGE = 20;
  const PRICE_MIN_LIMIT = 0;
  const DEFAULT_PRICE_MAX_LIMIT = 200000;
  const PRICE_STEP = 1000;

  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [staleProducts, setStaleProducts] = useState([]);
  const [priceRange, setPriceRange] = useState({
    min: PRICE_MIN_LIMIT,
    max: DEFAULT_PRICE_MAX_LIMIT,
  });
  const [categoryBrands, setCategoryBrands] = useState([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const isUserPriceChange = useRef(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { i18n } = useTranslation();
  const localeKey = (i18n.resolvedLanguage || i18n.language || "ru").split(
    "-",
  )[0];
  const tr = CATALOG_TEXTS[localeKey] || CATALOG_TEXTS.ru;

  const cat = searchParams.get("category");
  const bnd = searchParams.get("brand");
  const query = searchParams.get("query")?.trim() || "";
  const minParam = searchParams.get("min_price");
  const maxParam = searchParams.get("max_price");

  const { brands: allBrands, categories } = useProducts();
  const categoriesById = useMemo(
    () => buildCategoryNameMap(categories),
    [categories],
  );
  const brandsById = useMemo(() => buildBrandNameMap(allBrands), [allBrands]);

  const {
    products: allProducts,
    totalCount,
    isLoading,
    isFetching,
  } = useProducts({
    page: currentPage,
    category: cat || "",
    brand: bnd || "",
  });

  const {
    data: allSearchProducts = [],
    isLoading: isAllSearchLoading,
    isFetching: isAllSearchFetching,
  } = useSearchProductsPool({
    category: cat || "",
    brand: bnd || "",
    enabled: Boolean(query),
  });

  // В поиске фото приходит в поле `image`, а карточки ждут `existing_images`
  const normalizedSearchProducts = useMemo(
    () =>
      allSearchProducts.map((p) =>
        p.existing_images?.length || !p.image
          ? p
          : { ...p, existing_images: [{ image: p.image }] },
      ),
    [allSearchProducts],
  );

  const prevFiltersRef = useRef({ cat, bnd, query });
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev.cat !== cat || prev.bnd !== bnd || prev.query !== query) {
      setCurrentPage(1);
      setStaleProducts([]);
      prevFiltersRef.current = { cat, bnd, query };
    }
  }, [cat, bnd, query]);

  const searchedProducts = useMemo(
    () =>
      searchProducts(normalizedSearchProducts, query, {
        categoriesById,
        brandsById,
      }),
    [normalizedSearchProducts, query, categoriesById, brandsById],
  );
  const paginatedSearchProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return searchedProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, searchedProducts]);

  const productsSource = query ? paginatedSearchProducts : allProducts;
  const productsLoading = query ? isAllSearchLoading : isLoading;
  const productsFetching = query ? isAllSearchFetching : isFetching;

  useEffect(() => {
    if (!productsLoading && !productsFetching) setStaleProducts(productsSource);
  }, [productsLoading, productsFetching, productsSource]);

  const displayProducts =
    productsLoading || productsFetching ? staleProducts : productsSource;
  const isRefetching =
    (productsLoading || productsFetching) && staleProducts.length > 0;
  const isInitialLoading =
    (productsLoading || productsFetching) && staleProducts.length === 0;
  const totalPages = Math.max(
    1,
    Math.ceil(
      (query ? searchedProducts.length : (totalCount ?? 0)) / ITEMS_PER_PAGE,
    ),
  );

  useEffect(() => {
    if (!cat) return;
    productApi
      .getByCategory(cat)
      .then((data) => {
        const products = data.results || data;
        const brandIds = [...new Set(products.map((p) => p.brand))];
        const filtered = (allBrands || []).filter((b) =>
          brandIds.includes(b.id),
        );
        setCategoryBrands(filtered);
      })
      .catch(() => setCategoryBrands([]));
  }, [cat, allBrands]);

  const activeCategory = useMemo(() => {
    if (!cat) return null;
    return categories?.find((c) => c.parent === null && c.name === cat) || null;
  }, [cat, categories]);

  const activeSubcategory = useMemo(() => {
    if (!cat || !categories) return null;
    for (const parent of categories) {
      const sub = parent.subcategories?.find((s) => s.name === cat);
      if (sub) return { parent, sub };
      for (const s of parent.subcategories || []) {
        const child = s.subcategories?.find((c) => c.name === cat);
        if (child) return { parent, sub: s, child };
      }
    }
    return null;
  }, [cat, categories]);

  const subcategories = useMemo(() => {
    if (activeCategory) return activeCategory.subcategories || [];
    if (activeSubcategory) return activeSubcategory.sub?.subcategories || [];
    return [];
  }, [activeCategory, activeSubcategory]);

  const breadcrumbs = useMemo(() => {
    const crumbs = [
      { label: tr.home, href: "/" },
      // если категория не выбрана, «Каталог» и есть текущая страница
      { label: tr.catalog, href: cat ? "/catalog" : null },
    ];

    const trail = cat ? findCategoryPath(categories, cat) : null;
    (trail || []).forEach((c, i) => {
      const isLast = i === trail.length - 1;
      crumbs.push({
        label: c.name,
        href: isLast ? null : `/catalog?category=${encodeURIComponent(c.name)}`,
      });
    });

    return crumbs;
  }, [cat, categories, tr.home, tr.catalog]);

  const minPriceFilter = searchParams.get("min_price");
  const maxPriceFilter = searchParams.get("max_price");

  const sliderMaxPrice = useMemo(() => {
    const prices = displayProducts
      .map((product) => Number(product.price))
      .filter((price) => Number.isFinite(price) && price >= PRICE_MIN_LIMIT);
    if (prices.length === 0) return DEFAULT_PRICE_MAX_LIMIT;
    const maxPrice = Math.max(...prices);
    return Math.max(PRICE_STEP, Math.ceil(maxPrice / PRICE_STEP) * PRICE_STEP);
  }, [displayProducts]);

  useEffect(() => {
    const normalizedMin = clampPrice(
      sanitizePriceParam(minParam, PRICE_MIN_LIMIT),
      PRICE_MIN_LIMIT,
      sliderMaxPrice - PRICE_STEP,
    );
    const normalizedMax = clampPrice(
      sanitizePriceParam(maxParam, sliderMaxPrice),
      normalizedMin + PRICE_STEP,
      sliderMaxPrice,
    );
    setPriceRange({ min: normalizedMin, max: normalizedMax });
  }, [minParam, maxParam, sliderMaxPrice]);

  const visibleProducts = useMemo(() => {
    const min =
      minPriceFilter === null || minPriceFilter === ""
        ? null
        : Number(minPriceFilter);
    const max =
      maxPriceFilter === null || maxPriceFilter === ""
        ? null
        : Number(maxPriceFilter);

    return displayProducts.filter((product) => {
      const price = Number(product.price);

      if (Number.isNaN(price)) return false;
      if (min !== null && !Number.isNaN(min) && price < min) return false;
      if (max !== null && !Number.isNaN(max) && price > max) return false;

      return true;
    });
  }, [query, displayProducts, minPriceFilter, maxPriceFilter]);

  const filteredCategories = useMemo(
    () =>
      categories?.filter(
        (c) =>
          c.parent === null &&
          c.name.toLowerCase().includes(categorySearch.toLowerCase()),
      ) || [],
    [categories, categorySearch],
  );

  const brandSource = useMemo(
    () => (cat ? categoryBrands : allBrands || []),
    [cat, categoryBrands, allBrands],
  );

  const filteredBrands = useMemo(
    () =>
      brandSource.filter((b) =>
        b.name.toLowerCase().includes(brandSearch.toLowerCase()),
      ),
    [brandSource, brandSearch],
  );

  const updateParams = (newParams) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`?${params.toString()}`);
  };

  const handleReset = () => {
    setCategorySearch("");
    setBrandSearch("");
    setPriceRange({ min: PRICE_MIN_LIMIT, max: sliderMaxPrice });
    setCurrentPage(1);
    router.push("/catalog");
  };

  const handleMinPriceChange = (event) => {
    isUserPriceChange.current = true;
    const nextMin = Number(event.target.value);
    setPriceRange((prev) => ({
      ...prev,
      min: clampPrice(nextMin, PRICE_MIN_LIMIT, prev.max - PRICE_STEP),
    }));
  };

  const handleMaxPriceChange = (event) => {
    isUserPriceChange.current = true;
    const nextMax = Number(event.target.value);
    setPriceRange((prev) => ({
      ...prev,
      max: clampPrice(nextMax, prev.min + PRICE_STEP, sliderMaxPrice),
    }));
  };

  useEffect(() => {
    if (!isUserPriceChange.current) return;
    isUserPriceChange.current = false;

    const nextMinParam =
      priceRange.min > PRICE_MIN_LIMIT ? String(priceRange.min) : null;
    const nextMaxParam =
      priceRange.max < sliderMaxPrice ? String(priceRange.max) : null;
    const isSameAsUrl =
      (nextMinParam ?? null) === (minParam ?? null) &&
      (nextMaxParam ?? null) === (maxParam ?? null);
    if (isSameAsUrl) return;
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextMinParam) params.set("min_price", nextMinParam);
      else params.delete("min_price");
      if (nextMaxParam) params.set("max_price", nextMaxParam);
      else params.delete("max_price");
      const queryString = params.toString();
      router.replace(queryString ? `?${queryString}` : "/catalog", {
        scroll: false,
      });
      setCurrentPage(1);
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [
    priceRange.min,
    priceRange.max,
    sliderMaxPrice,
    minParam,
    maxParam,
    searchParams,
    router,
  ]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasActiveFilters =
    cat ||
    bnd ||
    query ||
    searchParams.get("min_price") ||
    searchParams.get("max_price");

  // Count active filters for badge
  const activeFilterCount = [
    cat,
    bnd,
    searchParams.get("min_price") || searchParams.get("max_price"),
    query,
  ].filter(Boolean).length;

  const priceProgressLeft =
    ((priceRange.min - PRICE_MIN_LIMIT) /
      Math.max(1, sliderMaxPrice - PRICE_MIN_LIMIT)) *
    100;
  const priceProgressRight =
    ((priceRange.max - PRICE_MIN_LIMIT) /
      Math.max(1, sliderMaxPrice - PRICE_MIN_LIMIT)) *
    100;

  const sharedFilterProps = {
    tr,
    subcategories,
    categories,
    filteredCategories,
    cat,
    bnd,
    categorySearch,
    setCategorySearch,
    brandSource,
    filteredBrands,
    brandSearch,
    setBrandSearch,
    priceRange,
    sliderMaxPrice,
    PRICE_MIN_LIMIT,
    PRICE_STEP,
    handleReset,
    hasActiveFilters,
    activeFilterCount,
    router,
    searchParams,
  };

  if (isInitialLoading) {
    return <div className={styles.loader}>{tr.loading}</div>;
  }

  return (
    <div className={`${styles.catalogPage} container`}>
      <nav className={styles.breadcrumbs}>
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className={styles.breadcrumbItem}>
            {i > 0 && (
              <ChevronRight size={14} className={styles.breadcrumbSep} />
            )}
            {crumb.href ? (
              <Link href={crumb.href} className={styles.breadcrumbLink}>
                {crumb.label}
              </Link>
            ) : (
              <span className={styles.breadcrumbCurrent}>{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* ── Mobile filter bar ── */}
      <div className={styles.mobileFilterBar}>
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            padding: "2px 0 8px",
            msOverflowStyle: "none",
          }}
        >
          {/* Все фильтры — всегда первым */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
              padding: "9px 14px",
              borderRadius: 20,
              border:
                activeFilterCount > 0
                  ? "1.5px solid #2563EB"
                  : "1.5px solid #D1D5DB",
              background: activeFilterCount > 0 ? "#2563EB" : "#fff",
              color: activeFilterCount > 0 ? "#fff" : "#374151",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <SlidersHorizontal size={15} />
            {tr.filters}
            {activeFilterCount > 0 && (
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  background: "#fff",
                  color: "#2563EB",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Разделитель */}
          <div
            style={{
              width: 1,
              background: "#E5E7EB",
              flexShrink: 0,
              margin: "4px 0",
            }}
          />

          {/* Категория — дропдаун-пилюля */}
          <button
            onClick={() => {
              setMobileFilterOpen(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              flexShrink: 0,
              padding: "9px 14px",
              borderRadius: 20,
              border: cat ? "1.5px solid #2563EB" : "1.5px solid #D1D5DB",
              background: cat ? "#EFF6FF" : "#F9FAFB",
              color: cat ? "#2563EB" : "#374151",
              fontSize: 14,
              fontWeight: cat ? 600 : 400,
              cursor: "pointer",
              maxWidth: 140,
              overflow: "hidden",
            }}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {cat || tr.category}
            </span>
            {cat ? (
              <X
                size={13}
                onClick={(e) => {
                  e.stopPropagation();
                  updateParams({ category: null });
                }}
              />
            ) : (
              <ChevronDown size={13} />
            )}
          </button>

          {/* Бренд — пилюля */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              flexShrink: 0,
              padding: "9px 14px",
              borderRadius: 20,
              border: bnd ? "1.5px solid #2563EB" : "1.5px solid #D1D5DB",
              background: bnd ? "#EFF6FF" : "#F9FAFB",
              color: bnd ? "#2563EB" : "#374151",
              fontSize: 14,
              fontWeight: bnd ? 600 : 400,
              cursor: "pointer",
              maxWidth: 130,
            }}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {bnd
                ? brandSource.find((b) => String(b.id) === bnd)?.name || bnd
                : tr.brand}
            </span>
            {bnd ? (
              <X
                size={13}
                onClick={(e) => {
                  e.stopPropagation();
                  updateParams({ brand: null });
                }}
              />
            ) : (
              <ChevronDown size={13} />
            )}
          </button>

          {/* Цена — пилюля */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              flexShrink: 0,
              padding: "9px 14px",
              borderRadius: 20,
              border:
                minPriceFilter || maxPriceFilter
                  ? "1.5px solid #2563EB"
                  : "1.5px solid #D1D5DB",
              background:
                minPriceFilter || maxPriceFilter ? "#EFF6FF" : "#F9FAFB",
              color: minPriceFilter || maxPriceFilter ? "#2563EB" : "#374151",
              fontSize: 14,
              fontWeight: minPriceFilter || maxPriceFilter ? 600 : 400,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <span>
              {minPriceFilter || maxPriceFilter
                ? `${priceRange.min.toLocaleString()}–${priceRange.max.toLocaleString()} с`
                : tr.price}
            </span>
            {minPriceFilter || maxPriceFilter ? (
              <X
                size={13}
                onClick={(e) => {
                  e.stopPropagation();
                  const p = new URLSearchParams(searchParams.toString());
                  p.delete("min_price");
                  p.delete("max_price");
                  router.push(`?${p.toString()}`);
                }}
              />
            ) : (
              <ChevronDown size={13} />
            )}
          </button>

          {/* Сброс всего — только если есть активные */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                flexShrink: 0,
                padding: "9px 14px",
                borderRadius: 20,
                border: "1.5px solid #FCA5A5",
                background: "#FEF2F2",
                color: "#DC2626",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <X size={13} />
              {tr.reset}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        {...sharedFilterProps}
      />

      <div className={styles.layout}>
        {/* Desktop sidebar — hidden on mobile via CSS */}
        <aside className={`${styles.sidebar} ${styles.desktopOnly}`}>
          <div
            className={styles.filterTitle}
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            {tr.filterTitle}
          </div>

          {subcategories.length > 0 && (
            <div className={styles.filterSection}>
              <div className={styles.filterGroup}>
                {tr.subcategories} <ChevronDown size={14} />
              </div>
              <div className={styles.subcategoryList}>
                {subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    className={`${styles.subcategoryItem} ${cat === sub.name ? styles.subcategoryActive : ""}`}
                    onClick={() =>
                      updateParams({ category: sub.name, brand: null })
                    }
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {((categories?.length || 0) > 0 || categorySearch) && (
            <div className={styles.filterSection}>
              <div className={styles.filterGroup}>
                {tr.category} <ChevronDown size={14} />
              </div>
              <div
                style={{
                  position: "relative",
                  marginTop: "10px",
                  marginBottom: "10px",
                }}
              >
                <input
                  type="text"
                  placeholder={tr.categorySearch}
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 32px 8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#999",
                    pointerEvents: "none",
                  }}
                />
              </div>
              <div className={styles.scrollArea}>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <label key={category.id} className={styles.checkbox}>
                      <input
                        type="radio"
                        name="category"
                        checked={cat === category.name}
                        onChange={() =>
                          updateParams({
                            category:
                              cat === category.name ? null : category.name,
                            brand: null,
                          })
                        }
                      />
                      <span>{category.name}</span>
                    </label>
                  ))
                ) : (
                  <div className={styles.emptySearch}>{tr.notMatched}</div>
                )}
              </div>
            </div>
          )}

          {((brandSource.length || 0) > 0 || brandSearch) && (
            <div className={styles.filterSection}>
              <div className={styles.filterGroup}>
                {tr.brand} <ChevronDown size={14} />
              </div>
              <div
                style={{
                  position: "relative",
                  marginTop: "10px",
                  marginBottom: "10px",
                }}
              >
                <input
                  type="text"
                  placeholder={tr.brandSearch}
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 32px 8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#999",
                    pointerEvents: "none",
                  }}
                />
              </div>
              <div className={styles.scrollArea}>
                {filteredBrands.length > 0 ? (
                  filteredBrands.map((brand) => (
                    <label key={brand.id} className={styles.checkbox}>
                      <input
                        type="radio"
                        name="brand"
                        checked={bnd === String(brand.id)}
                        onChange={() =>
                          updateParams({
                            brand: bnd === String(brand.id) ? null : brand.id,
                          })
                        }
                      />
                      <span>{brand.name}</span>
                    </label>
                  ))
                ) : (
                  <div className={styles.emptySearch}>{tr.notMatched}</div>
                )}
              </div>
            </div>
          )}

          <div className={styles.filterSection}>
            <div className={styles.filterGroup}>
              {tr.price} <ChevronDown size={14} />
            </div>
            <div className={styles.priceRangeValues}>
              <span>
                {tr.from}: {priceRange.min.toLocaleString()} с
              </span>
              <span>
                {tr.to}: {priceRange.max.toLocaleString()} с
              </span>
            </div>
            <div className={styles.priceSlider}>
              <div className={styles.priceSliderTrack} />
              <div
                className={styles.priceSliderRange}
                style={{
                  left: `${priceProgressLeft}%`,
                  width: `${priceProgressRight - priceProgressLeft}%`,
                }}
              />
              <input
                type="range"
                min={PRICE_MIN_LIMIT}
                max={sliderMaxPrice}
                step={PRICE_STEP}
                value={priceRange.min}
                onChange={handleMinPriceChange}
                className={`${styles.priceThumb} ${styles.priceThumbMin}`}
                aria-label={tr.from}
              />
              <input
                type="range"
                min={PRICE_MIN_LIMIT}
                max={sliderMaxPrice}
                step={PRICE_STEP}
                value={priceRange.max}
                onChange={handleMaxPriceChange}
                className={`${styles.priceThumb} ${styles.priceThumbMax}`}
                aria-label={tr.to}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button className={styles.resetBtn} onClick={handleReset}>
              {tr.reset}
            </button>
          )}
        </aside>

        <main className={styles.main}>
          <div className={styles.toolbar}>
            <div className={styles.viewToggle}>
              <LayoutGrid
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? styles.active : ""}
              />
              <List
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? styles.active : ""}
              />
              <AlignJustify
                onClick={() => setViewMode("full")}
                className={viewMode === "full" ? styles.active : ""}
              />
            </div>
          </div>

          <div style={{ position: "relative" }}>
            {isRefetching && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(255,255,255,0.55)",
                  zIndex: 10,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  paddingTop: "60px",
                  backdropFilter: "blur(1px)",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "#fff",
                    padding: "10px 20px",
                    borderRadius: "20px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                    fontSize: "14px",
                    color: "#333",
                    fontWeight: 500,
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    style={{ animation: "catalog-spin 0.8s linear infinite" }}
                  >
                    <style>{`@keyframes catalog-spin { to { transform: rotate(360deg); } }`}</style>
                    <circle
                      cx="9"
                      cy="9"
                      r="7"
                      fill="none"
                      stroke="#e0e0e0"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M9 2 a7 7 0 0 1 7 7"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  {tr.loading}
                </div>
              </div>
            )}

            <div
              className={`${styles.grid} ${styles[viewMode]}`}
              style={{
                opacity: isRefetching ? 0.5 : 1,
                transition: "opacity 0.2s ease",
                pointerEvents: isRefetching ? "none" : "auto",
              }}
            >
              {visibleProducts.length > 0 ? (
                visibleProducts.map((p) =>
                  viewMode === "grid" ? (
                    <Card key={p.id} product={p} />
                  ) : viewMode === "list" ? (
                    <ProductCard key={p.id} product={p} viewMode={viewMode} />
                  ) : (
                    <FullProductCard key={p.id} product={p} />
                  ),
                )
              ) : (
                <div>{tr.notFound}</div>
              )}
            </div>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={`${styles.pageBtn} ${styles.pageNavBtn}`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label={tr.prev}
              >
                <ChevronLeft size={16} />
              </button>

              {getPaginationItems(currentPage, totalPages).map((item, index) =>
                item === "ellipsis" ? (
                  <span key={`dots-${index}`} className={styles.dots}>
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={`${styles.pageBtn} ${currentPage === item ? styles.pageBtnActive : ""}`}
                    onClick={() => handlePageChange(item)}
                  >
                    {item}
                  </button>
                ),
              )}

              <button
                type="button"
                className={`${styles.pageBtn} ${styles.pageNavBtn}`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label={tr.next}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
