"use client";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { FiSearch, FiClock, FiX, FiTrendingUp, FiGrid } from "react-icons/fi";
import { productApi } from "@/lib/products/api/useProducts";
import { useSearchProductsPool } from "@/lib/products/hooks/useSearchProductsPool";
import {
  searchProductsSmart,
  getQuerySuggestions,
  getHighlightRanges,
  buildCategoryNameMap,
  buildBrandNameMap,
  normalizeText,
} from "@/lib/products/search";
import styles from "./SearchBox.module.scss";

// ─── Настройки ───────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 120; // поиск локальный, поэтому задержка маленькая
const INITIAL_PRODUCTS = 30; // сколько товаров показать сразу
const LOAD_MORE_STEP = 20; // сколько добавлять по кнопке «Показать ещё»
const MAX_COMPLETIONS = 4;
const MAX_CATEGORIES = 3;
const HISTORY_KEY = "searchHistory";
const HISTORY_LIMIT = 8;
const HIGH_PRICE_LIMIT = 100000; // как в карточках: от этой цены — «Свяжитесь с нами»

const TOTAL_PRODUCTS = 100000;
const INTRO_MS = 3600;
const HINT_MS = 1600;

const HINTS_BY_LANG = {
  ru: [
    "Wi-Fi камера",
    "артикул 12345",
    "бренд DAHUA",
    "серверный Шкаф",
    "Монитор 34 дюйма",
  ],
  en: [
    "Wi-Fi camera",
    "article 12345",
    "DAHUA brand",
    "Server cabinet",
    "34-inch monitor",
  ],
  ky: [
    "Wi-Fi камера",
    "артикул 12345",
    "DAHUA бренди",
    "Сервердик шкаф",
    "34 дюймдук монитор",
  ],
};

// Популярные запросы — показываются при пустом поле, если истории мало
const POPULAR_QUERIES = [
  "камера hikvision",
  "видеорегистратор",
  "турникет",
  "шлагбаум",
  "коммутатор",
];

// ─── Вспомогательные функции (вне компонента, чтобы не пересоздавались) ─────

const normalizeListResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const flattenCategories = (items, acc = []) => {
  (items || []).forEach((category) => {
    if (!category?.name) return;
    acc.push({
      id: category.id,
      name: category.name,
      norm: normalizeText(category.name),
    });
    if (
      Array.isArray(category.subcategories) &&
      category.subcategories.length > 0
    ) {
      flattenCategories(category.subcategories, acc);
    }
  });
  return acc;
};

const readHistory = () => {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(value)
      ? value.filter((v) => typeof v === "string")
      : [];
  } catch {
    return [];
  }
};

const writeHistory = (list) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {}
};

const formatNumber = (num) => Math.round(num).toLocaleString("ru-RU");

// Что показать вместо цены: обычную цену, цену со скидкой или «Свяжитесь с нами»
const getPriceInfo = (product) => {
  const price = Number(product.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  if (price >= HIGH_PRICE_LIMIT) return { type: "contact" };

  const discount = Number(product.discount) || 0;
  if (discount > 0 && discount < 100) {
    return {
      type: "discount",
      old: price,
      current: (price * (100 - discount)) / 100,
    };
  }
  return { type: "regular", current: price };
};

// ─── Мелкие компоненты ──────────────────────────────────────────────────────

function Highlight({ text, query }) {
  const ranges = useMemo(() => getHighlightRanges(text, query), [text, query]);
  if (ranges.length === 0) return text;

  const parts = [];
  let last = 0;
  ranges.forEach(([start, end], i) => {
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <mark key={i} className={styles.mark}>
        {text.slice(start, end)}
      </mark>,
    );
    last = end;
  });
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

// Как в Google: напечатанная часть обычным шрифтом, дополнение — жирным
function Completion({ text, query }) {
  const q = normalizeText(query);
  if (q && text.startsWith(q)) {
    return (
      <>
        <strong>{text.slice(0, q.length)}</strong>
        {text.slice(q.length)}
      </>
    );
  }
  return text;
}

function AnimatedSearchPlaceholder({ hidden }) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || "ru").split("-")[0];
  const hints = HINTS_BY_LANG[lang] || HINTS_BY_LANG.ru;

  const [step, setStep] = useState(-1);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setTimeout(
      () => setStep((s) => (s + 1 >= hints.length ? -1 : s + 1)),
      step === -1 ? INTRO_MS : HINT_MS,
    );
    return () => clearTimeout(id);
  }, [step, hints.length]);

  useEffect(() => {
    if (step !== -1) return;
    setCount(0);
    const delay = 700;
    const duration = 1200;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(Math.max((now - start - delay) / duration, 0), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(TOTAL_PRODUCTS * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step]);

  return (
    <span className={`sp ${hidden ? "sp--hidden" : ""}`} aria-hidden="true">
      {step === -1 ? (
        <span className="sp__intro">
          <span className="sp__word" style={{ animationDelay: "0ms" }}>
            {t("searchPlaceholder.search")}
          </span>
          <span className="sp__word" style={{ animationDelay: "300ms" }}>
            {t("searchPlaceholder.among")}
          </span>
          <span
            className="sp__word sp__num"
            style={{ animationDelay: "600ms" }}
          >
            <span className="sp__ghost">100&nbsp;000+</span>
            <span>{count.toLocaleString("ru-RU")}+</span>
          </span>
          <span className="sp__word" style={{ animationDelay: "900ms" }}>
            {t("searchPlaceholder.products")}
          </span>
        </span>
      ) : (
        <span className="sp__hint" key={step}>
          {hints[step]}
        </span>
      )}
    </span>
  );
}

// ─── Основной компонент ─────────────────────────────────────────────────────

/**
 * variant: "desktop" | "mobile" — только для CSS-классов формы
 * autoFocus: фокус сразу при появлении (для мобильной панели)
 * onDone: вызывается после перехода на другую страницу (закрыть мобильную панель)
 */
export default function SearchBox({
  variant = "desktop",
  autoFocus = false,
  onDone,
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("query") || "";

  const listId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const [query, setQuery] = useState(urlQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery.trim());
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [history, setHistory] = useState([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_PRODUCTS);

  // ── Данные ──
  const { data: pool = [], isLoading: isPoolLoading } = useSearchProductsPool();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: productApi.getCategories,
    select: normalizeListResponse,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: productApi.getBrands,
    select: normalizeListResponse,
  });

  const categoriesById = useMemo(
    () => buildCategoryNameMap(categories),
    [categories],
  );
  const brandsById = useMemo(() => buildBrandNameMap(brands), [brands]);
  const flatCategories = useMemo(
    () => flattenCategories(categories),
    [categories],
  );
  const searchOptions = useMemo(
    () => ({ categoriesById, brandsById }),
    [categoriesById, brandsById],
  );

  // ── Синхронизация с адресом страницы ──
  useEffect(() => {
    setQuery(urlQuery);
    setDebouncedQuery(urlQuery.trim());
    setIsOpen(false);
    setActiveIndex(-1);
  }, [pathname, urlQuery]);

  // ── История (localStorage доступен только в браузере) ──
  useEffect(() => {
    setHistory(readHistory());
  }, []);

  const saveToHistory = useCallback((text) => {
    const value = text.trim();
    if (!value) return;
    setHistory((prev) => {
      const next = [
        value,
        ...prev.filter((h) => h.toLowerCase() !== value.toLowerCase()),
      ].slice(0, HISTORY_LIMIT);
      writeHistory(next);
      return next;
    });
  }, []);

  const removeFromHistory = useCallback((text) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h !== text);
      writeHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    writeHistory([]);
  }, []);

  // ── Debounce ──
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  // ── Закрытие при клике вне поиска ──
  useEffect(() => {
    const handleMouseDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // ── Поиск ──
  const search = useMemo(() => {
    if (!debouncedQuery || pool.length === 0) return null;
    return searchProductsSmart(pool, debouncedQuery, searchOptions);
  }, [pool, debouncedQuery, searchOptions]);

  const effectiveQuery = search?.correctedQuery || debouncedQuery;
  const products = search ? search.results.slice(0, visibleCount) : [];
  const totalFound = search ? search.results.length : 0;
  const hasMore = products.length < totalFound;

  const completions = useMemo(() => {
    if (!debouncedQuery || pool.length === 0) return [];
    return getQuerySuggestions(
      pool,
      debouncedQuery,
      searchOptions,
      MAX_COMPLETIONS,
    );
  }, [pool, debouncedQuery, searchOptions]);

  const categoryMatches = useMemo(() => {
    const q = normalizeText(effectiveQuery);
    if (!q) return [];
    const seen = new Set();
    return flatCategories
      .filter((c) => {
        if (!c.norm.includes(q) || seen.has(c.norm)) return false;
        seen.add(c.norm);
        return true;
      })
      .slice(0, MAX_CATEGORIES);
  }, [flatCategories, effectiveQuery]);

  // ── Действия ──
  const finish = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
    onDone?.();
  }, [onDone]);

  const goToResults = useCallback(
    (text) => {
      const value = text.trim();
      if (!value) {
        router.push("/catalog");
      } else {
        saveToHistory(value);
        setQuery(value);
        router.push(`/catalog?query=${encodeURIComponent(value)}`);
      }
      finish();
    },
    [router, saveToHistory, finish],
  );

  const goToProduct = useCallback(
    (product) => {
      saveToHistory(query);
      router.push(`/productdetail/${product.id}`);
      finish();
    },
    [router, saveToHistory, query, finish],
  );

  const goToCategory = useCallback(
    (name) => {
      router.push(`/catalog?category=${encodeURIComponent(name)}`);
      finish();
    },
    [router, finish],
  );

  // ── Плоский список пунктов (для навигации стрелками) ──
  const hasQuery = Boolean(debouncedQuery);

  const items = useMemo(() => {
    const list = [];

    if (!hasQuery) {
      history.forEach((text) =>
        list.push({
          type: "history",
          key: `h-${text}`,
          text,
          onSelect: () => goToResults(text),
        }),
      );
      if (history.length < 3) {
        POPULAR_QUERIES.filter((p) => !history.includes(p)).forEach((text) =>
          list.push({
            type: "popular",
            key: `p-${text}`,
            text,
            onSelect: () => goToResults(text),
          }),
        );
      }
      return list;
    }

    completions.forEach((text) =>
      list.push({
        type: "completion",
        key: `c-${text}`,
        text,
        onSelect: () => goToResults(text),
      }),
    );
    categoryMatches.forEach((category) =>
      list.push({
        type: "category",
        key: `cat-${category.id ?? category.name}`,
        text: category.name,
        onSelect: () => goToCategory(category.name),
      }),
    );
    products.forEach((product) =>
      list.push({
        type: "product",
        key: `pr-${product.id}`,
        product,
        onSelect: () => goToProduct(product),
      }),
    );
    return list;
  }, [
    hasQuery,
    history,
    completions,
    products,
    categoryMatches,
    goToResults,
    goToProduct,
    goToCategory,
  ]);

  // Новый запрос — сбрасываем выделение и снова показываем первые 30 товаров
  useEffect(() => {
    setActiveIndex(-1);
    setVisibleCount(INITIAL_PRODUCTS);
  }, [debouncedQuery]);

  // Выделенный пункт всегда виден при прокрутке
  useEffect(() => {
    if (activeIndex < 0) return;
    document
      .getElementById(`${listId}-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, listId]);

  // ── Клавиатура ──
  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (items.length) setActiveIndex((i) => (i + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (items.length)
        setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      if (isOpen && activeIndex >= 0 && items[activeIndex]) {
        event.preventDefault();
        items[activeIndex].onSelect();
      }
      // иначе сработает обычная отправка формы
    } else if (event.key === "Escape") {
      if (isOpen) {
        event.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
      } else if (query) {
        setQuery("");
      }
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    goToResults(query);
  };

  // «Показать ещё» — добавляем товары в этом же окне, без перехода
  const handleLoadMore = () => {
    setVisibleCount((count) => count + LOAD_MORE_STEP);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery("");
    setDebouncedQuery("");
    setIsOpen(true);
    inputRef.current?.focus();
  };

  // ── Рендер пунктов ──
  const optionProps = (index, extraClass = "") => ({
    id: `${listId}-${index}`,
    role: "option",
    "aria-selected": index === activeIndex,
    className: `${styles.item} ${extraClass} ${index === activeIndex ? styles.itemActive : ""}`,
    onMouseEnter: () => setActiveIndex(index),
    // mousedown вместо click — чтобы поле не теряло фокус до выбора
    onMouseDown: (e) => e.preventDefault(),
    onClick: () => items[index].onSelect(),
  });

  const renderPrice = (product) => {
    const info = getPriceInfo(product);
    if (!info) return null;
    const currency = t("search.currency");

    if (info.type === "contact") {
      return (
        <span className={styles.priceContact}>{t("card.contactForPrice")}</span>
      );
    }

    return (
      <span className={styles.priceRow}>
        {info.type === "discount" && (
          <span className={styles.priceOld}>
            {formatNumber(info.old)} {currency}
          </span>
        )}
        <span className={styles.priceCurrent}>
          {formatNumber(info.current)} {currency}
        </span>
      </span>
    );
  };

  const renderItem = (item, index) => {
    switch (item.type) {
      case "history":
        return (
          <li key={item.key} {...optionProps(index)}>
            <FiClock className={styles.icon} aria-hidden="true" />
            <span className={styles.text}>{item.text}</span>
            <button
              type="button"
              className={styles.remove}
              aria-label={t("search.removeFromHistory", { text: item.text })}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                removeFromHistory(item.text);
              }}
            >
              <FiX />
            </button>
          </li>
        );

      case "popular":
        return (
          <li key={item.key} {...optionProps(index)}>
            <FiTrendingUp className={styles.icon} aria-hidden="true" />
            <span className={styles.text}>{item.text}</span>
          </li>
        );

      case "completion":
        return (
          <li key={item.key} {...optionProps(index, styles.completionItem)}>
            <span className={styles.text}>
              <Completion text={item.text} query={debouncedQuery} />
            </span>
          </li>
        );

      case "product": {
        const { product } = item;
        const brand = brandsById[product.brand];
        return (
          <li key={item.key} {...optionProps(index, styles.productItem)}>
            <span className={styles.thumb}>
              {product.image ? (
                <img src={product.image} alt="" loading="lazy" />
              ) : (
                <FiSearch aria-hidden="true" />
              )}
            </span>
            <span className={styles.productBody}>
              <span className={styles.productName}>
                <Highlight text={product.name || ""} query={effectiveQuery} />
              </span>
              {renderPrice(product)}
              <span className={styles.productMeta}>
                {product.article && (
                  <span>
                    <Highlight
                      text={String(product.article)}
                      query={effectiveQuery}
                    />
                  </span>
                )}
                {brand && <span>{brand}</span>}
                {product.is_available === false && (
                  <span className={styles.unavailable}>
                    {t("search.unavailable")}
                  </span>
                )}
              </span>
            </span>
          </li>
        );
      }

      case "category":
        return (
          <li key={item.key} {...optionProps(index)}>
            <FiGrid className={styles.icon} aria-hidden="true" />
            <span className={styles.text}>
              <Highlight text={item.text} query={effectiveQuery} />
            </span>
            <span className={styles.hint}>{t("search.categoryLabel")}</span>
          </li>
        );

      default:
        return null;
    }
  };

  // Группируем пункты по секциям, сохраняя сквозную нумерацию для стрелок
  const renderSections = () => {
    const groups = [];
    items.forEach((item, index) => {
      const groupKey =
        item.type === "history"
          ? "history"
          : item.type === "popular"
            ? "popular"
            : item.type === "product"
              ? "products"
              : item.type === "category"
                ? "categories"
                : "completions";
      const last = groups[groups.length - 1];
      if (last && last.key === groupKey) last.entries.push([item, index]);
      else groups.push({ key: groupKey, entries: [[item, index]] });
    });

    const titles = {
      history: (
        <div className={styles.sectionHead}>
          <span>{t("search.recent")}</span>
          <button
            type="button"
            className={styles.clearHistory}
            onMouseDown={(e) => e.preventDefault()}
            onClick={clearHistory}
          >
            {t("search.clearHistory")}
          </button>
        </div>
      ),
      popular: <div className={styles.sectionHead}>{t("search.popular")}</div>,
      completions: (
        <div className={styles.sectionHead}>
          {t("search.similar", "Похожие запросы")}
        </div>
      ),
      products: (
        <div className={styles.sectionHead}>
          <span>{t("search.products")}</span>
          <span className={styles.sectionCount}>
            {t("search.productsCount", {
              count: totalFound,
              defaultValue: "{{count}} товара(ов)",
            })}
          </span>
        </div>
      ),
      categories: (
        <div className={styles.sectionHead}>{t("search.categories")}</div>
      ),
    };

    return groups.map((group) => (
      <div key={group.key} className={styles.section}>
        {titles[group.key] || null}
        <ul className={styles.list} role="group">
          {group.entries.map(([item, index]) => renderItem(item, index))}
        </ul>
      </div>
    ));
  };

  // ── Что показывать в выпадающем окне ──
  const isTyping = query.trim() !== debouncedQuery;
  const showDropdown = isOpen && (hasQuery || items.length > 0);
  const nothingFound =
    hasQuery &&
    !isPoolLoading &&
    !isTyping &&
    products.length === 0 &&
    completions.length === 0 &&
    categoryMatches.length === 0;
  const showViewAll = hasQuery && totalFound > 0;

  return (
    <form
      ref={rootRef}
      role="search"
      className={`header__search header__search--${variant} ${styles.root}`}
      onSubmit={handleSubmit}
    >
      <input
        ref={inputRef}
        type="text"
        placeholder=""
        autoComplete="off"
        autoFocus={autoFocus}
        enterKeyHint="search"
        aria-label={t("header.search")}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
        }
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      <AnimatedSearchPlaceholder hidden={!!query} />

      {query && (
        <button
          type="button"
          className={styles.clear}
          aria-label={t("search.clearInput")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClear}
        >
          <FiX />
        </button>
      )}

      <button
        type="submit"
        className="header__search-btn"
        aria-label={t("header.search")}
      >
        <FiSearch className="icon" />
      </button>

      {showDropdown && (
        <div
          className={`header__search-dropdown ${styles.dropdown}`}
          id={listId}
          role="listbox"
        >
          <div className={styles.scroll}>
            {hasQuery && isPoolLoading && (
              <div className={styles.status}>{t("search.loading")}</div>
            )}

            {search?.correction && (
              <div className={styles.correction}>
                {search.correction === "layout"
                  ? t("search.wrongLayout")
                  : t("search.showingFor")}{" "}
                <button
                  type="button"
                  className={styles.correctionLink}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setQuery(search.correctedQuery);
                    inputRef.current?.focus();
                  }}
                >
                  {search.correctedQuery}
                </button>
              </div>
            )}

            {renderSections()}

            {nothingFound && (
              <div className={styles.empty}>
                <p className={styles.emptyTitle}>
                  {t("search.nothingFound", { query: debouncedQuery })}
                </p>
                <p className={styles.emptyText}>
                  {t("search.nothingFoundHint")}
                </p>
              </div>
            )}
          </div>

          {/* Кнопки внизу окна — всегда видны, не прокручиваются со списком */}
          {showViewAll && (
            <div className={styles.footer}>
              <button
                type="button"
                className={styles.viewAll}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goToResults(effectiveQuery)}
              >
                {t("search.viewAll", "Посмотреть все")}
              </button>

              {hasMore && (
                <button
                  type="button"
                  className={styles.loadMore}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleLoadMore}
                >
                  {t("search.loadMore", "Показать ещё")}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
