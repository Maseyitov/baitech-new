'use client';
import { useState, useCallback, useEffect } from 'react';
import { Menu, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './CatalogButton.module.scss';
import { useProducts } from '@/lib/products/hooks/hooks';
import { productApi } from '@/lib/products/api/useProducts';
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from '../catalogmenu/Categoryicons';
import { useSectionCategories } from '@/lib/catalog/sectionCategories';

export default function CatalogButton() {
  const router = useRouter();
  const { categories: rawCategories, brands: allBrands, isLoading } = useProducts();
  const categories = useSectionCategories(rawCategories);
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  // subBrandsMap теперь используется и для подкатегорий (уровень 2), и для под-подкатегорий (уровень 3)
  const [subBrandsMap, setSubBrandsMap] = useState({});

  const toggleCategory = (id) => {
    setActiveCategory((prev) => (prev === id ? null : id));
  };

  const fetchBrandsFor = useCallback(
    async (item) => {
      try {
        const data = await productApi.getByCategory(item.name);
        const products = data.results || data;
        const brandIds = [...new Set(products.map((p) => p.brand))];
        return (allBrands || []).filter((brand) => brandIds.includes(brand.id));
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    [allBrands]
  );

  // Универсальный тоггл — работает и для подкатегории, и для под-подкатегории
  const toggleSubBrands = useCallback(
    async (item) => {
      const current = subBrandsMap[item.id];

      if (current?.open) {
        setSubBrandsMap((prev) => ({
          ...prev,
          [item.id]: { ...prev[item.id], open: false },
        }));
        return;
      }

      if (current?.brands) {
        if (current.brands.length === 0) return;

        setSubBrandsMap((prev) => ({
          ...prev,
          [item.id]: { ...prev[item.id], open: true },
        }));
        return;
      }

      setSubBrandsMap((prev) => ({
        ...prev,
        [item.id]: { brands: null, loading: true, open: true },
      }));

      const filtered = await fetchBrandsFor(item);
      setSubBrandsMap((prev) => ({
        ...prev,
        [item.id]: { brands: filtered, loading: false, open: filtered.length > 0 },
      }));
    },
    [subBrandsMap, fetchBrandsFor]
  );

  // Предзагружаем бренды только для "листовых" элементов:
  // — подкатегорий (уровень 2) БЕЗ своих детей
  // — всех под-подкатегорий (уровень 3)
  useEffect(() => {
    const preloadBrands = async () => {
      const activeSubcategories =
        categories?.find((category) => category.id === activeCategory)?.subcategories || [];

      const leafSubs = activeSubcategories.filter((sub) => !sub.subcategories?.length);
      const allChildren = activeSubcategories.flatMap((sub) => sub.subcategories || []);
      const allItems = [...leafSubs, ...allChildren];

      const missingSubs = allItems.filter((item) => !(item.id in subBrandsMap));
      if (missingSubs.length === 0) return;

      const loadedEntries = await Promise.all(
        missingSubs.map(async (item) => {
          const filtered = await fetchBrandsFor(item);
          return [item.id, { brands: filtered, loading: false, open: false }];
        })
      );

      setSubBrandsMap((prev) => ({
        ...prev,
        ...Object.fromEntries(loadedEntries),
      }));
    };

    if (activeCategory) {
      preloadBrands();
    }
  }, [activeCategory, categories, subBrandsMap, fetchBrandsFor]);

  const handleCategoryClick = (category) => {
    setIsOpen(false);
    router.push(`/catalog?category=${encodeURIComponent(category.name)}`);
  };

  const handleSubcategoryClick = (subcategory) => {
    setIsOpen(false);
    router.push(`/catalog?category=${encodeURIComponent(subcategory.name)}`);
  };

  const handleBrandClick = (sub, brandId) => {
    setIsOpen(false);
    router.push(`/catalog?category=${encodeURIComponent(sub.name)}&brand=${brandId}`);
  };

  return (
    <div className={styles.catalogWrapper}>
      <button
        className={styles.catalogButton}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Menu size={18} />
        <span>Каталог</span>
        <ChevronDown
          size={16}
          className={`${styles.arrow} ${isOpen ? styles.rotate : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />

          <div className={styles.catalogDropdown}>
            {isLoading ? (
              <div className={styles.loader}>Загрузка...</div>
            ) : (
              <ul className={styles.categoryList}>
                {categories?.map((category) => (
                  <li key={category.id} className={styles.categoryWrapper}>
                    <div className={`${styles.categoryItem} ${activeCategory === category.id ? styles.active : ''}`}>
                      <button
                        className={styles.itemLeft}
                        onClick={() => handleCategoryClick(category)}
                      >
                        <span className={styles.icon}>
                          {CATEGORY_ICONS[category.id] ?? DEFAULT_CATEGORY_ICON}
                        </span>
                        <span className={styles.itemTitle}>{category.name}</span>
                      </button>

                      {category.subcategories?.length > 0 && (
                        <button
                          className={styles.toggleBtn}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategory(category.id);
                          }}
                        >
                          <ChevronRight
                            size={15}
                            className={`${styles.subArrow} ${activeCategory === category.id ? styles.subArrowOpen : ''}`}
                          />
                        </button>
                      )}
                    </div>

                    {activeCategory === category.id && category.subcategories?.length > 0 && (
                      <div className={styles.subDrawer}>
                        {category.subcategories.map((sub) => {
                          const hasChildren = sub.subcategories?.length > 0;
                          const subState = subBrandsMap[sub.id];
                          const isSubOpen = subState?.open;
                          // Бренды у уровня 2 показываем только если у sub НЕТ своих детей —
                          // иначе за бренды отвечают уже под-подкатегории
                          const hasBrands = !hasChildren && (subState?.brands || []).length > 0;

                          return (
                            <div key={sub.id} className={styles.subGroup}>
                              <div className={styles.subRow}>
                                <button
                                  className={styles.subTitle}
                                  onClick={() => handleSubcategoryClick(sub)}
                                >
                                  {sub.name}
                                </button>

                                {hasBrands && (
                                  <button
                                    className={styles.brandToggle}
                                    onClick={() => toggleSubBrands(sub)}
                                  >
                                    <ChevronRight
                                      size={13}
                                      className={`${styles.brandArrow} ${isSubOpen ? styles.brandArrowOpen : ''}`}
                                    />
                                  </button>
                                )}
                              </div>

                              {isSubOpen && hasBrands && (
                                <div className={styles.brandsInline}>
                                  {subState?.loading ? (
                                    <Loader2 size={14} className={styles.spinner} />
                                  ) : (
                                    subState.brands.map((brand) => (
                                      <button
                                        key={brand.id}
                                        className={styles.brandChip}
                                        onClick={() => handleBrandClick(sub, brand.id)}
                                      >
                                        {brand.name}
                                      </button>
                                    ))
                                  )}
                                </div>
                              )}

                              {sub.subcategories?.length > 0 && (
                                <ul className={styles.subList}>
                                  {sub.subcategories.map((child) => {
                                    const childState = subBrandsMap[child.id];
                                    const isChildOpen = childState?.open;
                                    const childHasBrands = (childState?.brands || []).length > 0;

                                    return (
                                      <li key={child.id}>
                                        <div className={styles.subRow}>
                                          <button
                                            className={styles.subItem}
                                            onClick={() => handleSubcategoryClick(child)}
                                          >
                                            {child.name}
                                          </button>

                                          {childHasBrands && (
                                            <button
                                              className={styles.brandToggle}
                                              onClick={() => toggleSubBrands(child)}
                                            >
                                              <ChevronRight
                                                size={13}
                                                className={`${styles.brandArrow} ${isChildOpen ? styles.brandArrowOpen : ''}`}
                                              />
                                            </button>
                                          )}
                                        </div>

                                        {isChildOpen && childHasBrands && (
                                          <div className={styles.brandsInline}>
                                            {childState?.loading ? (
                                              <Loader2 size={14} className={styles.spinner} />
                                            ) : (
                                              childState.brands.map((brand) => (
                                                <button
                                                  key={brand.id}
                                                  className={styles.brandChip}
                                                  onClick={() => handleBrandClick(child, brand.id)}
                                                >
                                                  {brand.name}
                                                </button>
                                              ))
                                            )}
                                          </div>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}