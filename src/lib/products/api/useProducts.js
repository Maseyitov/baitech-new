import { $api } from "../../../../API/api";
const apiClient = $api;

const normalizeListResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

// Сортируем категории по id: старые сверху, новые снизу.
// Подкатегории внутри тоже сортируются.
const sortCategoriesTree = (items) =>
  [...items]
    .sort((a, b) => (a?.id ?? 0) - (b?.id ?? 0))
    .map((category) =>
      Array.isArray(category?.subcategories) &&
      category.subcategories.length > 0
        ? {
            ...category,
            subcategories: sortCategoriesTree(category.subcategories),
          }
        : category,
    );

// Лёгкая версия товара — только то, что нужно для поиска и подсказок.
// Тяжёлые поля (description, characteristics на 4 языках) отбрасываем,
// чтобы меньше хранить в памяти и чтобы Fuse работал быстрее.
const toSearchItem = (p) => ({
  id: p.id,
  name: p.name,
  name_ru: p.name_ru,
  name_ky: p.name_ky,
  name_en: p.name_en,
  article: p.article,
  price: p.price,
  discount: p.discount,
  brand: p.brand,
  category: p.category,
  is_available: p.is_available,
  image: p.existing_images?.[0]?.image || null,
});

const SEARCH_POOL_URL = "products/products/search/";
const POOL_PAGE_SIZE = 500;

export const productApi = {
  search: async (query) => {
    const { data } = await apiClient.get("products/products/search/", {
      params: { q: query },
    });
    return data;
  },

  getAll: async (params = {}) => {
    // Убираем пустые значения чтобы не слать ?search=&category=
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined,
      ),
    );
    const { data } = await apiClient.get("products/products/", {
      params: cleanParams,
    });
    return data;
  },

  getAllPages: async (params = {}) => {
    const {
      page: _page,
      search: _search,
      article: _article,
      ...baseParams
    } = params;

    // 1. Первая страница — чтобы узнать count
    const firstPage = await productApi.getAll({ ...baseParams, page: 1 });
    const firstResults = normalizeListResponse(firstPage);
    const pageSize = firstResults.length || 20;
    const totalPages = firstPage?.count
      ? Math.ceil(firstPage.count / pageSize)
      : 1;

    // 2. Все остальные страницы одновременно
    const pageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const otherPages = await Promise.all(
      pageNumbers.map((page) =>
        productApi
          .getAll({ ...baseParams, page })
          .then(normalizeListResponse)
          .catch(() => []),
      ),
    );

    const allResults = [...firstResults, ...otherPages.flat()];

    return {
      ...firstPage,
      count: allResults.length,
      next: null,
      previous: null,
      results: allResults,
    };
  },

  // Все товары для поиска одним запросом (через page_size).
  // Возвращает массив лёгких товаров (см. toSearchItem).
  getSearchPool: async ({ signal } = {}) => {
    const fetchPage = (page) =>
      apiClient
        .get(SEARCH_POOL_URL, {
          params: { page, page_size: POOL_PAGE_SIZE },
          signal,
        })
        .then((r) => r.data);

    const first = await fetchPage(1);
    const firstResults = normalizeListResponse(first);

    let all = firstResults;

    // Если бэкенд ограничил page_size — догружаем остальное параллельно
    if (first?.next && firstResults.length > 0) {
      const totalPages = Math.ceil((first.count || 0) / firstResults.length);
      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          fetchPage(i + 2)
            .then(normalizeListResponse)
            .catch(() => []),
        ),
      );
      all = [...firstResults, ...rest.flat()];
    }

    return all.map(toSearchItem);
  },

  getSimilar: async (productId) => {
    const response = await apiClient.get("/products/products/", {
      params: { similar_features: productId },
    });
    return response.data;
  },

  getByBrand: async (brandId, page = 1) => {
    const response = await apiClient.get("/products/products/", {
      params: { brand: brandId, page },
    });
    return response.data;
  },

  getByCategory: async (category, page = 1) => {
    const response = await apiClient.get("/products/products/", {
      params: { category, page },
    });
    return response.data;
  },

  getByArticle: async (article) => {
    const response = await apiClient.get("/products/products/", {
      params: { article },
    });
    return response.data;
  },

  getByPrice: async (price, page = 1) => {
    const response = await apiClient.get("/products/products/", {
      params: { price, page },
    });
    return response.data;
  },

  getById: async (id) => {
    const { data } = await apiClient.get(`products/products/${id}/`);
    return data;
  },

  delete: async (id) => {
    const { data } = await apiClient.delete(`products/products/${id}/`);
    return data;
  },

  patch: async (id, payload) => {
    const { data } = await apiClient.patch(`products/products/${id}/`, payload);
    return data;
  },

  changeAvailability: async (id, is_available) => {
    const { data } = await apiClient.patch(
      `products/products/${id}/availability/`,
      { is_available },
    );
    return data;
  },

  getCategories: async () => {
    const { data } = await apiClient.get("products/categories/");
    if (Array.isArray(data)) return sortCategoriesTree(data);
    if (Array.isArray(data?.results)) {
      return { ...data, results: sortCategoriesTree(data.results) };
    }
    return data;
  },

  getBrands: async () => {
    const { data } = await apiClient.get("products/brands/");
    return data;
  },

  create: async (payload) => {
    const { data } = await apiClient.post("products/products/", payload);
    return data;
  },

  createCategory: async (payload) => {
    const { data } = await apiClient.post("products/categories/", payload);
    return data;
  },

  createBrand: async (payload) => {
    const { data } = await apiClient.post("products/brands/", payload);
    return data;
  },

  deleteCategory: async (id) => {
    const { data } = await apiClient.delete(`products/categories/${id}/`);
    return data;
  },

  deleteBrand: async (id) => {
    const { data } = await apiClient.delete(`products/brands/${id}/`);
    return data;
  },
};
