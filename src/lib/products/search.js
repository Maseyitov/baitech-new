import Fuse from "fuse.js";

// ─── Синонимы ────────────────────────────────────────────────────────────────
// Каждое слово группы находит товары по любому другому слову этой группы.

const SEARCH_SYNONYMS = {
  камера: [
    "камера",
    "камеры",
    "камеру",
    "камерой",
    "camera",
    "cctv",
    "видеокамера",
    "видеокамеры",
  ],
  видеонаблюдение: [
    "видеонаблюдение",
    "видеонаблюд",
    "cctv",
    "camera",
    "камеры",
    "камера",
  ],
  регистратор: [
    "регистратор",
    "регистраторы",
    "видеорегистратор",
    "видеорегистраторы",
    "nvr",
    "dvr",
  ],
  домофон: ["домофон", "домофоны", "видеодомофон", "видеодомофоны", "intercom"],
  монитор: ["монитор", "мониторы", "monitor", "display"],
  компьютер: ["компьютер", "компьютеры", "computer", "pc"],
  ноутбук: ["ноутбук", "ноутбуки", "laptop", "notebook"],
  телефон: [
    "телефон",
    "телефоны",
    "смартфон",
    "смартфоны",
    "phone",
    "smartphone",
  ],
  сеть: ["сеть", "сетевое", "сетевой", "network", "wifi", "wi-fi"],
  роутер: ["роутер", "роутеры", "router", "маршрутизатор"],
  коммутатор: ["коммутатор", "коммутаторы", "switch", "свитч"],
  точка_доступа: ["точка доступа", "точки доступа", "access point"],
  видеокарта: ["видеокарта", "видеокарты", "видюха", "gpu", "graphics card"],
  шкаф: ["шкаф", "шкафы", "серверный шкаф", "server rack", "rack"],
  шлагбаум: ["шлагбаум", "шлагбаумы", "шлагбаума", "barrier"],
  турникет: ["турникет", "турникеты", "турникета", "turnstile"],
  кабель: ["кабель", "кабели", "кабеля", "шнур", "провод", "cable"],
  dahua: ["dahua", "дахуа", "даха"],
  hikvision: ["hikvision", "хиквижн", "хиквизион", "хик"],
  tplink: ["tp-link", "tplink", "тп линк", "тплинк"],
  ajax: ["ajax", "аджакс", "аякс"],
  baitech: ["baitech", "байтек", "байтех"],
};

// ё → е, всё в нижний регистр, знаки препинания → пробелы.
// Кыргызские буквы (ң, ө, ү) сохраняются.
const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-яңөү0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const splitTokens = (text) => normalizeText(text).split(" ").filter(Boolean);

// Слово → все его синонимы (считается один раз при загрузке файла)
const SYNONYM_LOOKUP = new Map();
Object.values(SEARCH_SYNONYMS).forEach((group) => {
  const normalized = [...new Set(group.map(normalizeText))];
  normalized.forEach((word) => {
    const prev = SYNONYM_LOOKUP.get(word) || [];
    SYNONYM_LOOKUP.set(word, [...new Set([...prev, ...normalized])]);
  });
});

const getVariants = (token) => SYNONYM_LOOKUP.get(token) || [token];

// ─── Разбор цены: «до 5000», «от 2к до 10к», «дешевле 3 тыс» ────────────────

const NUMBER_TOKEN = "[\\d]+(?:[.,]\\d+)?\\s*(?:к|k|тыс\\.?)?";

const toNumber = (str) => {
  let s = String(str || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(",", ".");
  let mult = 1;
  if (/тыс\.?$/i.test(s)) {
    mult = 1000;
    s = s.replace(/тыс\.?$/i, "");
  } else if (/[кk]$/i.test(s)) {
    mult = 1000;
    s = s.replace(/[кk]$/i, "");
  }
  const num = parseFloat(s);
  return Number.isFinite(num) ? Math.round(num * mult) : null;
};

export const parsePriceIntent = (rawQuery) => {
  let text = String(rawQuery || "")
    .toLowerCase()
    .replace(/ё/g, "е");
  text = text.replace(/(\d)\s+(?=\d{3}(\D|$))/g, "$1");

  let minPrice = null;
  let maxPrice = null;

  const rangeRe = new RegExp(
    `от\\s*(${NUMBER_TOKEN})\\s*до\\s*(${NUMBER_TOKEN})`,
    "i",
  );
  const rangeMatch = text.match(rangeRe);

  if (rangeMatch) {
    minPrice = toNumber(rangeMatch[1]);
    maxPrice = toNumber(rangeMatch[2]);
    text = text.replace(rangeMatch[0], " ");
  } else {
    const maxPatterns = [
      new RegExp(`не\\s*дороже\\s*(${NUMBER_TOKEN})`, "i"),
      new RegExp(`дешевле\\s*(${NUMBER_TOKEN})`, "i"),
      new RegExp(`менее\\s*(${NUMBER_TOKEN})`, "i"),
      new RegExp(`до\\s*(${NUMBER_TOKEN})`, "i"),
      new RegExp(`за\\s*(${NUMBER_TOKEN})`, "i"),
    ];
    for (const re of maxPatterns) {
      const m = text.match(re);
      if (m) {
        maxPrice = toNumber(m[1]);
        text = text.replace(m[0], " ");
        break;
      }
    }

    const minPatterns = [
      new RegExp(`дороже\\s*(${NUMBER_TOKEN})`, "i"),
      new RegExp(`более\\s*(${NUMBER_TOKEN})`, "i"),
      new RegExp(`от\\s*(${NUMBER_TOKEN})`, "i"),
    ];
    for (const re of minPatterns) {
      const m = text.match(re);
      if (m) {
        minPrice = toNumber(m[1]);
        text = text.replace(m[0], " ");
        break;
      }
    }
  }

  text = text.replace(/(^|\s)(сом|сомов|som|kgs|руб|рублей|₽)(?=\s|$)/gi, " ");
  text = text.replace(/\s+/g, " ").trim();

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  return { keywords: text, minPrice, maxPrice };
};

// ─── Разбор сортировки: «самый дешёвый», «подороже» ─────────────────────────

// \w в JavaScript не понимает кириллицу, поэтому окончания слов — через [а-яё]
const W = "[а-яёa-z]*";
const SORT_ASC_PATTERNS = [
  new RegExp(`самы[йхе]?\\s+дешев${W}`, "i"),
  new RegExp(`самая\\s+дешев${W}`, "i"),
  /подешевле/i,
  /дешевле\s+всех/i,
  new RegExp(`дешев${W}`, "i"),
  new RegExp(`недорог${W}`, "i"),
  new RegExp(`бюджетн${W}`, "i"),
];

const SORT_DESC_PATTERNS = [
  new RegExp(`самы[йхе]?\\s+дорог${W}`, "i"),
  new RegExp(`самая\\s+дорог${W}`, "i"),
  /подороже/i,
  /дороже\s+всех/i,
  new RegExp(`дорог${W}`, "i"),
  new RegExp(`топов${W}`, "i"),
  new RegExp(`премиум${W}`, "i"),
  new RegExp(`флагман${W}`, "i"),
  new RegExp(`лучш${W}`, "i"),
];

export const parseSortIntent = (text) => {
  let remaining = String(text || "");
  let sort = null;

  for (const re of SORT_ASC_PATTERNS) {
    const m = remaining.match(re);
    if (m) {
      sort = "price_asc";
      remaining = remaining.replace(m[0], " ");
      break;
    }
  }
  if (!sort) {
    for (const re of SORT_DESC_PATTERNS) {
      const m = remaining.match(re);
      if (m) {
        sort = "price_desc";
        remaining = remaining.replace(m[0], " ");
        break;
      }
    }
  }

  remaining = remaining.replace(/\s+/g, " ").trim();
  return { keywords: remaining, sort };
};

export const getSearchIntent = (query) => {
  const { keywords: afterPrice, minPrice, maxPrice } = parsePriceIntent(query);
  const { keywords, sort } = parseSortIntent(afterPrice);
  return { keywords, minPrice, maxPrice, sort };
};

// ─── Неправильная раскладка: «rfvthf» → «камера» ────────────────────────────

const EN_KEYS = "`qwertyuiop[]asdfghjkl;'zxcvbnm,.";
const RU_KEYS = "ёйцукенгшщзхъфывапролджэячсмитьбю";
const EN_TO_RU = {};
const RU_TO_EN = {};
[...EN_KEYS].forEach((ch, i) => {
  EN_TO_RU[ch] = RU_KEYS[i];
  RU_TO_EN[RU_KEYS[i]] = ch;
});

export const switchKeyboardLayout = (text) => {
  const lower = String(text || "").toLowerCase();
  const latin = (lower.match(/[a-z]/g) || []).length;
  const cyrillic = (lower.match(/[а-яё]/g) || []).length;
  const map = latin >= cyrillic ? EN_TO_RU : RU_TO_EN;
  return [...lower].map((ch) => map[ch] ?? ch).join("");
};

// ─── Карты id → название ─────────────────────────────────────────────────────

export const buildCategoryNameMap = (categories) => {
  const map = {};
  const walk = (items) => {
    (items || []).forEach((cat) => {
      if (cat?.id != null && cat?.name) map[cat.id] = cat.name;
      if (Array.isArray(cat?.subcategories) && cat.subcategories.length > 0) {
        walk(cat.subcategories);
      }
    });
  };
  walk(categories);
  return map;
};

export const buildBrandNameMap = (brands) => {
  const map = {};
  (brands || []).forEach((brand) => {
    if (brand?.id != null && brand?.name) map[brand.id] = brand.name;
  });
  return map;
};

const getBrandName = (product, brandsById) => {
  if (product?.brand && typeof product.brand === "object")
    return product.brand.name || "";
  return brandsById[product?.brand] || "";
};

const getCategoryName = (product, categoriesById) => {
  if (product?.category && typeof product.category === "object")
    return product.category.name || "";
  return categoriesById[product?.category] || "";
};

// ─── Индекс ──────────────────────────────────────────────────────────────────
// Строится один раз на массив товаров (кэш по ссылке на массив),
// поэтому при каждом нажатии клавиши ничего не пересобирается.

const EMPTY_MAP = Object.freeze({});
const indexCache = new WeakMap();

const FUSE_OPTIONS = {
  includeScore: true,
  useExtendedSearch: true,
  ignoreLocation: true,
  threshold: 0.3,
  minMatchCharLength: 3,
  keys: [
    { name: "name", weight: 0.5 },
    { name: "article", weight: 0.25 },
    { name: "brand", weight: 0.15 },
    { name: "category", weight: 0.1 },
  ],
};

const getIndex = (products, categoriesById, brandsById) => {
  const cached = indexCache.get(products);
  if (
    cached &&
    cached.categoriesById === categoriesById &&
    cached.brandsById === brandsById
  ) {
    return cached;
  }

  const docs = products.map((product) => {
    const names = [
      ...new Set(
        [
          product?.name,
          product?.name_ru,
          product?.name_ky,
          product?.name_en,
        ].filter(Boolean),
      ),
    ];
    const brandRaw = getBrandName(product, brandsById);
    const doc = {
      product,
      name: normalizeText(names.join(" ")),
      article: normalizeText(product?.article),
      brand: normalizeText(brandRaw),
      brandRaw,
      category: normalizeText(getCategoryName(product, categoriesById)),
    };
    doc.haystack = ` ${doc.name} ${doc.article} ${doc.brand} ${doc.category} `;
    return doc;
  });

  const index = {
    categoriesById,
    brandsById,
    docs,
    fuse: new Fuse(docs, FUSE_OPTIONS),
    vocabulary: null, // строится лениво — нужен только для исправления опечаток
    phrases: null, // строится лениво — нужен только для подсказок
  };

  indexCache.set(products, index);
  return index;
};

// ─── Поиск ───────────────────────────────────────────────────────────────────
// Каждое слово запроса оценивается отдельно (меньше — лучше):
//   -1    точное совпадение артикула
//    0    слово найдено с начала слова в товаре
//    0.05 слово найдено внутри другого слова
//    0.1+ нечёткое совпадение (опечатка), через Fuse
// Товар попадает в результат, только если найдены ВСЕ слова запроса.

const scoreToken = (index, token) => {
  const variants = getVariants(token);
  const scores = new Map();

  for (const doc of index.docs) {
    let best = Infinity;
    for (const variant of variants) {
      if (doc.article && doc.article === variant) {
        best = -1;
        break;
      }
      const pos = doc.haystack.indexOf(variant);
      if (pos === -1) continue;
      const score = doc.haystack[pos - 1] === " " ? 0 : 0.05;
      if (score < best) best = score;
    }
    if (best !== Infinity) scores.set(doc, best);
  }

  // Нечёткий поиск — только для слов от 3 букв, иначе слишком много мусора
  if (token.length >= 3) {
    const pattern = variants.filter((v) => v.length >= 3).join(" | ");
    if (pattern) {
      for (const result of index.fuse.search(pattern)) {
        if (!scores.has(result.item))
          scores.set(result.item, 0.1 + result.score);
      }
    }
  }

  return scores;
};

const runSearch = (index, tokens) => {
  if (tokens.length === 0) return index.docs.map((doc) => doc.product);

  // Начинаем с самого «редкого» слова — так быстрее
  const scoreMaps = tokens.map((token) => scoreToken(index, token));
  scoreMaps.sort((a, b) => a.size - b.size);

  const ranked = [];
  for (const [doc, firstScore] of scoreMaps[0]) {
    let total = firstScore;
    let matchedAll = true;
    for (let i = 1; i < scoreMaps.length; i++) {
      const score = scoreMaps[i].get(doc);
      if (score === undefined) {
        matchedAll = false;
        break;
      }
      total += score;
    }
    if (matchedAll) ranked.push({ doc, total });
  }

  ranked.sort((a, b) => {
    if (a.total !== b.total) return a.total - b.total;
    // При равной релевантности — сначала товары в наличии
    const availA = a.doc.product?.is_available === false ? 1 : 0;
    const availB = b.doc.product?.is_available === false ? 1 : 0;
    return availA - availB;
  });

  return ranked.map((item) => item.doc.product);
};

// ─── «Возможно, вы имели в виду» ────────────────────────────────────────────

const getVocabulary = (index) => {
  if (!index.vocabulary) {
    const words = new Set();
    index.docs.forEach((doc) => {
      `${doc.name} ${doc.brand} ${doc.category}`.split(" ").forEach((word) => {
        if (word.length >= 3 && !/^\d+$/.test(word)) words.add(word);
      });
    });
    const list = [...words];
    index.vocabulary = {
      set: words,
      fuse: new Fuse(list, {
        includeScore: true,
        threshold: 0.45,
        ignoreLocation: true,
      }),
    };
  }
  return index.vocabulary;
};

const correctTokens = (index, tokens) => {
  const vocab = getVocabulary(index);
  let changed = false;

  const corrected = tokens.map((token) => {
    if (token.length < 3 || /^\d+$/.test(token)) return token;
    if (vocab.set.has(token) || SYNONYM_LOOKUP.has(token)) return token;
    const [best] = vocab.fuse.search(token);
    if (best && best.score <= 0.45) {
      changed = true;
      return best.item;
    }
    return token;
  });

  return changed ? corrected : null;
};

// ─── Цена и сортировка поверх результатов ───────────────────────────────────

const matchesPriceRange = (product, minPrice, maxPrice) => {
  if (minPrice === null && maxPrice === null) return true;
  const price = Number(product?.price);
  if (!Number.isFinite(price)) return false;
  if (minPrice !== null && price < minPrice) return false;
  if (maxPrice !== null && price > maxPrice) return false;
  return true;
};

const sortByPrice = (products, direction) =>
  [...products].sort((a, b) => {
    const priceA = Number(a?.price);
    const priceB = Number(b?.price);
    const validA = Number.isFinite(priceA);
    const validB = Number.isFinite(priceB);
    if (!validA && !validB) return 0;
    if (!validA) return 1;
    if (!validB) return -1;
    return direction === "price_asc" ? priceA - priceB : priceB - priceA;
  });

const applyIntent = (products, intent) => {
  let result = products;
  if (intent.minPrice !== null || intent.maxPrice !== null) {
    result = result.filter((p) =>
      matchesPriceRange(p, intent.minPrice, intent.maxPrice),
    );
  }
  if (intent.sort === "price_asc" || intent.sort === "price_desc") {
    result = sortByPrice(result, intent.sort);
  }
  return result;
};

// ─── Публичное API ───────────────────────────────────────────────────────────

/**
 * Умный поиск. Возвращает:
 *  - results: товары по релевантности
 *  - correctedQuery: исправленный запрос, если исходный ничего не нашёл
 *  - correction: "layout" (неправильная раскладка) | "typo" (опечатка) | null
 *  - intent: разобранные цена и сортировка
 *
 * options:
 *  - categoriesById: { [id]: name } — из buildCategoryNameMap(categories)
 *  - brandsById: { [id]: name } — из buildBrandNameMap(brands)
 * Передавайте одни и те же объекты (через useMemo), иначе индекс пересоберётся.
 */
export const searchProductsSmart = (products, query, options = EMPTY_MAP) => {
  const list = products || [];
  const categoriesById = options.categoriesById || EMPTY_MAP;
  const brandsById = options.brandsById || EMPTY_MAP;

  const intent = getSearchIntent(query);
  const tokens = splitTokens(intent.keywords);
  const index = getIndex(list, categoriesById, brandsById);

  let results = runSearch(index, tokens);
  let correctedQuery = null;
  let correction = null;

  if (results.length === 0 && tokens.length > 0) {
    // 1. Возможно, забыли переключить раскладку
    const switched = splitTokens(switchKeyboardLayout(intent.keywords));
    const byLayout = runSearch(index, switched);

    if (byLayout.length > 0) {
      results = byLayout;
      correctedQuery = switched.join(" ");
      correction = "layout";
    } else {
      // 2. Возможно, сильная опечатка
      const fixed = correctTokens(index, tokens);
      if (fixed) {
        const byTypo = runSearch(index, fixed);
        if (byTypo.length > 0) {
          results = byTypo;
          correctedQuery = fixed.join(" ");
          correction = "typo";
        }
      }
    }
  }

  return {
    results: applyIntent(results, intent),
    correctedQuery,
    correction,
    intent,
  };
};

// Старая сигнатура — возвращает только массив товаров (для CatalogPage и т.д.)
export const searchProducts = (products, query, options = EMPTY_MAP) =>
  searchProductsSmart(products, query, options).results;

export const productMatchesSearch = (product, query, options = EMPTY_MAP) =>
  searchProducts([product], query, options).length > 0;

// ─── Подсказки запросов, как в Google ───────────────────────────────────────
// Фразы собираются из категорий, брендов и начала названий товаров
// («турникет hikvision», «шлагбаум dahua»). Чем чаще фраза встречается,
// тем выше она в подсказках.

const getPhrases = (index) => {
  if (index.phrases) return index.phrases;

  const byNorm = new Map();
  const add = (text, weight) => {
    const norm = normalizeText(text);
    if (norm.length < 2) return;
    const existing = byNorm.get(norm);
    if (existing) existing.weight += weight;
    else byNorm.set(norm, { text: norm, norm, weight });
  };

  index.docs.forEach((doc) => {
    const words = doc.name
      .split(" ")
      .filter((w) => w.length >= 3 && !/^\d+$/.test(w));
    const head = words[0];
    if (head) {
      add(head, 1);
      if (doc.brand && head !== doc.brand) add(`${head} ${doc.brand}`, 1);
    }
    if (doc.brand) add(doc.brand, 1);
    if (doc.category) add(doc.category, 1);
  });

  Object.values(index.categoriesById).forEach((name) => add(name, 0.5));

  index.phrases = [...byNorm.values()];
  return index.phrases;
};

export const getQuerySuggestions = (
  products,
  query,
  options = EMPTY_MAP,
  limit = 5,
) => {
  const q = normalizeText(query);
  if (!q) return [];

  const index = getIndex(
    products || [],
    options.categoriesById || EMPTY_MAP,
    options.brandsById || EMPTY_MAP,
  );

  const matches = [];
  for (const phrase of getPhrases(index)) {
    if (phrase.norm === q) continue;
    let rank;
    if (phrase.norm.startsWith(q)) rank = 0;
    else if (phrase.norm.includes(` ${q}`)) rank = 1;
    else continue;
    matches.push({ ...phrase, rank });
  }

  matches.sort(
    (a, b) =>
      a.rank - b.rank || b.weight - a.weight || a.norm.length - b.norm.length,
  );

  return matches.slice(0, limit).map((m) => m.text);
};

// ─── Подсветка найденных слов ───────────────────────────────────────────────
// Возвращает отрезки [start, end] в исходном тексте, которые надо выделить.

export const getHighlightRanges = (text, query) => {
  const source = String(text || "")
    .toLowerCase()
    .replace(/ё/g, "е");
  if (!source) return [];

  const tokens = splitTokens(getSearchIntent(query).keywords).filter(
    (t) => t.length >= 2,
  );
  const ranges = [];

  tokens.forEach((token) => {
    getVariants(token).forEach((variant) => {
      if (variant.length < 2 || variant.includes(" ")) return;
      let pos = source.indexOf(variant);
      while (pos !== -1) {
        ranges.push([pos, pos + variant.length]);
        pos = source.indexOf(variant, pos + variant.length);
      }
    });
  });

  if (ranges.length === 0) return [];

  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const last = merged[merged.length - 1];
    if (ranges[i][0] <= last[1]) last[1] = Math.max(last[1], ranges[i][1]);
    else merged.push(ranges[i]);
  }
  return merged;
};

export { normalizeText };
