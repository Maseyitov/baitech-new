"use client";
import { useState, useEffect } from "react";
import styles from "./Navbar.module.scss";
import {
  LayoutGrid,
  Monitor,
  Video,
  FileText,
  BookOpen,
  Wrench,
} from "lucide-react";
import Catalog from "../catalogmenu/Catalog";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/lib/products/hooks/hooks";

const CATEGORY_MATCHERS = {
  videoSurveillance: [
    "видеонаблюд",
    "камер",
    "video surveillance",
    "cctv",
    "видеокөз",
  ],
  pcComponents: [
    "компьютер",
    "комплектующ",
    "pc component",
    "hardware",
    "компьютердик",
  ],
};

export default function NavItem() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { categories } = useProducts();
  const [lastSection, setLastSection] = useState(null);

  useEffect(() => {
    try {
      setLastSection(
        localStorage.getItem("lastSection") || "videoSurveillance",
      );
    } catch {}
  }, [pathname, searchParams]);

  const normalizeText = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const resolveCategoryName = (categoryKey, fallbackName = "") => {
    const topCategories = (categories || []).filter(
      (category) => category?.parent === null,
    );
    const matchers = CATEGORY_MATCHERS[categoryKey] || [];

    const found = topCategories.find((category) => {
      const normalizedName = normalizeText(category?.name);
      return matchers.some((matcher) =>
        normalizedName.includes(normalizeText(matcher)),
      );
    });

    return found?.name || fallbackName;
  };

  const getItemCategory = (item) => {
    if (!item.categoryKey) return "";
    return resolveCategoryName(item.categoryKey, item.fallbackCategory);
  };
  const menuItems = [
    {
      label: t("navbar.catalog"),
      icon: <LayoutGrid size={18} />,
      isCatalog: true,
    },
    {
      label: t("navbar.videoSurveillance"),
      link: "/",
      categoryKey: "videoSurveillance",
      fallbackCategory: t("navbar.videoSurveillance"),
      icon: <Video size={18} />,
    },
    {
      label: t("navbar.pcComponents"),
      link: "/",
      categoryKey: "pcComponents",
      fallbackCategory: t("navbar.pcComponents"),
      icon: <Monitor size={18} />,
    },
    {
      label: t("navbar.solutions"),
      link: "/solution",
      icon: <FileText size={18} />,
    },
    {
      label: t("navbar.courses"),
      link: "/kurs-videonablyudenie",
      icon: <BookOpen size={18} />,
    },
    // {
    //   label: t('navbar.services'),
    //   link: '/services',
    //   newTab: true, // новый флаг
    //   icon: <Wrench size={18} />,
    // },
  ];
  const hasNestedCategory = (category, currentCategory) => {
    if (!category || !currentCategory) return false;
    if (category.name === currentCategory) return true;
    return (category.subcategories || []).some((subcategory) =>
      hasNestedCategory(subcategory, currentCategory),
    );
  };
  const normalizePath = (path) => {
    if (!path) return "/";
    return path.length > 1 ? path.replace(/\/+$/, "") : path;
  };

  const isActive = (item) => {
    if (normalizePath(pathname) !== normalizePath(item.link)) return false;
    const itemCategory = getItemCategory(item);
    if (itemCategory) {
      const currentCategory = searchParams.get("category");
      if (!currentCategory) return item.categoryKey === lastSection;
      if (currentCategory === itemCategory) return true;

      const parentCategory = categories?.find(
        (category) => category.name === itemCategory,
      );
      return hasNestedCategory(parentCategory, currentCategory);
    }
    return true;
  };

  const getHref = (item) => {
    const itemCategory = getItemCategory(item);
    if (itemCategory) {
      return `${item.link}?category=${encodeURIComponent(itemCategory)}`;
    }
    return item.link;
  };

  return (
    <>
      <nav className={`${styles.navContainer} container`}>
        {menuItems.map((item, index) =>
          item.isCatalog ? (
            <button
              key={index}
              className={`${styles.navItemCatalog} ${open ? styles.navItemActive : ""}`}
              onClick={() => setOpen((prev) => !prev)}
              type="button"
            >
              <span className={styles.label}>{item.label}</span>
              <span className={styles.icon}>{item.icon}</span>
            </button>
          ) : item.link ? (
            <Link
              key={index}
              href={getHref(item)}
              className={`${styles.navItem} ${isActive(item) ? styles.navItemActive : ""}`}
              {...(item.newTab
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <span className={styles.label}>{item.label}</span>
              <span className={styles.icon}>{item.icon}</span>
            </Link>
          ) : (
            <button key={index} className={styles.navItem} type="button">
              <span className={styles.label}>{item.label}</span>
              <span className={styles.icon}>{item.icon}</span>
            </button>
          ),
        )}
      </nav>
      {open && <Catalog onClose={() => setOpen(false)} />}
    </>
  );
}
