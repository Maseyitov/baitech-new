"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const STORAGE_KEY = "lastSection";
const DEFAULT_SECTION = "videoSurveillance";

// ─── КАКИЕ КАТЕГОРИИ ПОКАЗЫВАТЬ В КАЖДОМ РАЗДЕЛЕ И В КАКОМ ПОРЯДКЕ ───
// Показываются ТОЛЬКО категории из списка. Остальные скрываются.
// В скобках слова, по которым ищется категория (маленькими буквами).
// Чтобы поменять порядок, просто переставьте строки.
const SECTION_ORDER = {
  videoSurveillance: [
    ["видеонаблюд", "video surveillance", "cctv", "видеокөз"], // Видеонаблюдение
    ["проектн", "project"], // Проектное оборудование
    ["скуд", "домофон", "access control"], // Системы доступа СКУД и Домофоны
    ["пожар", "охран", "fire"], // Охранно-пожарное оборудование
    ["монитор", "monitor"], // Мониторы
    ["коммутатор", "switch"], // Сетевые коммутаторы
    ["источник", "питани", "power"], // Источники питания
    ["кабел", "шнур", "cable"], // Кабели и шнуры
    ["программ", "software"], // Программное обеспечение
    ["звуков", "sound"], // Звуковое оборудование
  ],
  pcComponents: [
    ["сетевое оборуд", "network"], // Сетевое оборудование
    ["комплектующ", "pc component", "hardware"], // Компьютерные комплектующие
    ["периф", "peripher"], // Компьютерная периферия
    ["аксессуар", "accessor"], // Аксессуары
    ["носител", "storage"], // Носители информации
    ["оргтех", "office"], // Оргтехника
    ["акуст", "колонк", "speaker"], // Акустические системы/колонки
    ["гаджет", "gadget", "умный дом", "smart home"], // Гаджеты для дома
    ["источник", "питани", "power"], // Источники питания
    ["аккумулятор", "batter"], // Аккумуляторы
  ],
};
// ─────────────────────────────────────────────────────────────────────

// Слова для определения раздела (те же, что в меню)
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

export const getSectionKeyByName = (name) => {
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

// Место категории в списке раздела (-1, если её в списке нет)
const getPosition = (category, order) => {
  const n = normalize(category?.name);
  return order.findIndex((words) => words.some((w) => n.includes(w)));
};

export const sortCategoriesForSection = (categories, sectionKey) => {
  const order = SECTION_ORDER[sectionKey];
  if (!order) return categories;

  const result = categories
    .map((category) => ({ category, position: getPosition(category, order) }))
    .filter((item) => item.position !== -1) // оставляем только категории из списка
    .sort((a, b) => a.position - b.position)
    .map((item) => item.category);

  // Защита: если ничего не нашлось (например, другой язык), показываем всё,
  // чтобы каталог не оказался пустым
  return result.length > 0 ? result : categories;
};

// Хук: возвращает категории текущего раздела в нужном порядке
export function useSectionCategories(categories) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category");
  const [savedKey, setSavedKey] = useState(DEFAULT_SECTION);

  useEffect(() => {
    try {
      setSavedKey(localStorage.getItem(STORAGE_KEY) || DEFAULT_SECTION);
    } catch {}
  }, [pathname, urlCategory]);

  const list = categories || [];

  const sectionKey = useMemo(() => {
    if (pathname === "/" && urlCategory) {
      const top = findTopCategory(urlCategory, list);
      const key = getSectionKeyByName(top?.name || urlCategory);
      if (key) return key;
    }
    return savedKey;
  }, [pathname, urlCategory, list, savedKey]);

  return useMemo(
    () => sortCategoriesForSection(list, sectionKey),
    [list, sectionKey],
  );
}
