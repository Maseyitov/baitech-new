"use client";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "@/lib/products/api/useProducts";

// Общий пул товаров для поиска. Header и CatalogPage используют один ключ,
// поэтому товары грузятся один раз и берутся из кэша.
// "v2" — чтобы не подхватился старый кэш с полными (тяжёлыми) товарами.
export const SEARCH_POOL_BASE_KEY = ["products", "search-pool-v2"];

export function useSearchProductsPool({ enabled = true } = {}) {
  return useQuery({
    queryKey: SEARCH_POOL_BASE_KEY,
    queryFn: ({ signal }) => productApi.getSearchPool({ signal }),
    enabled,
    retry: 1,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
