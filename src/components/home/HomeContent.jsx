"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Banner } from "../banner/Banner";
import Features from "../features/Features";
import CatalogButton from "../catalogbutton/CatalogButton";
import { Recommendations } from "../recomendation/Recommendations";
import { News } from "../News/News";
import Partners from "../services/Partners";
import PopularBrands from "@/components/popularbrands/PopularBrands";
import ProductCategories from "@/components/productcategories/ProductCategories";
import { productApi } from "@/lib/products/api/useProducts";

const STORAGE_KEY = "lastSection"; // раздел: videoSurveillance / pcComponents
const NAME_KEY = "lastSectionName"; // точное название категории
const DEFAULT_SECTION = "videoSurveillance";

const SECTION_MATCHERS = {
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

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .trim();

const normalizeListResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const getSectionKeyByName = (name) => {
  const n = normalize(name);
  return Object.keys(SECTION_MATCHERS).find((key) =>
    SECTION_MATCHERS[key].some((word) => n.includes(word)),
  );
};

const findTopCategory = (categoryName, categories) => {
  const contains = (cat) =>
    cat?.name === categoryName || (cat?.subcategories || []).some(contains);
  return categories.filter((c) => c?.parent == null).find(contains);
};

const getCategoryNameByKey = (key, categories) => {
  const found = categories
    .filter((c) => c?.parent == null)
    .find((c) => getSectionKeyByName(c?.name) === key);
  return found?.name;
};

function HomeInner() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const categoryName = searchParams.get("category");

  // Тот же запрос, что и в шапке, поэтому данные берутся из кэша
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: productApi.getCategories,
    select: normalizeListResponse,
  });

  const [saved, setSaved] = useState(null);
  const [waitedTooLong, setWaitedTooLong] = useState(false);

  // 1. Если раздел есть в адресе, запоминаем раздел и его название
  useEffect(() => {
    if (!categoryName) return;
    const top = categories.length
      ? findTopCategory(categoryName, categories)
      : null;
    const key = getSectionKeyByName(top?.name || categoryName);
    if (!key) return;
    try {
      localStorage.setItem(STORAGE_KEY, key);
      localStorage.setItem(
        NAME_KEY,
        top?.name || getCategoryNameByKey(key, categories) || categoryName,
      );
    } catch {}
  }, [categoryName, categories]);

  // 2. Сразу читаем из памяти последний раздел и его название
  useEffect(() => {
    let key = DEFAULT_SECTION;
    let name = null;
    try {
      key = localStorage.getItem(STORAGE_KEY) || DEFAULT_SECTION;
      name = localStorage.getItem(NAME_KEY);
    } catch {}
    setSaved({ key, name });
  }, [categoryName]);

  // Точное название из категорий (на случай, если сменили язык)
  const nameFromCategories = saved
    ? getCategoryNameByKey(saved.key, categories)
    : null;

  // 3. Обновляем запомненное название, когда категории загрузились
  useEffect(() => {
    if (categoryName || !nameFromCategories) return;
    try {
      localStorage.setItem(NAME_KEY, nameFromCategories);
    } catch {}
  }, [categoryName, nameFromCategories]);

  // 4. Запасной вариант для первого захода, если категории долго грузятся
  useEffect(() => {
    if (categoryName || categories.length || saved?.name) return;
    const timer = setTimeout(() => setWaitedTooLong(true), 1000);
    return () => clearTimeout(timer);
  }, [categoryName, categories.length, saved?.name]);

  // Что показывать: адрес → категории → память → запасное название
  const activeCategory =
    categoryName ||
    nameFromCategories ||
    saved?.name ||
    (waitedTooLong && saved
      ? saved.key === "pcComponents"
        ? t("navbar.pcComponents")
        : t("navbar.videoSurveillance")
      : null);

  if (!activeCategory) return null;

  return (
    <div>
      <Banner categoryName={activeCategory} />
      <CatalogButton />
      <Features categoryName={activeCategory} />
      <Recommendations categoryName={activeCategory} />
      <ProductCategories />
      <News />
      <PopularBrands />
      <Partners />
    </div>
  );
}

export default function HomeContent() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  );
}
