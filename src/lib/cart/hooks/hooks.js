import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cart, isCartPayload, normalizeCart } from "../api/api";

const CART_KEY = ["cart"];

// Бэк после изменения возвращает всю корзину — кладём её сразу в кэш
const useApplyCartResponse = () => {
  const queryClient = useQueryClient();
  return (data) => {
    if (isCartPayload(data)) {
      queryClient.setQueryData(CART_KEY, normalizeCart(data));
    } else {
      queryClient.invalidateQueries({ queryKey: CART_KEY });
    }
  };
};

// Полная корзина: { items, items_count, total_quantity, total_price }
export const useCartSummary = () => {
  return useQuery({
    queryKey: CART_KEY,
    queryFn: cart.getCart,
    retry: 1,
  });
};

// Только список товаров (массив) — как было раньше, для шапки и карточек
export const useCart = () => {
  return useQuery({
    queryKey: CART_KEY,
    queryFn: cart.getCart,
    select: (data) => data?.items ?? [],
    retry: 1,
  });
};

// Добавление товара
export const useCreateCartItem = () => {
  const applyCart = useApplyCartResponse();

  return useMutation({
    mutationFn: ({ product_id, quantity }) =>
      cart.createCartItem(product_id, quantity),
    onSuccess: applyCart,
  });
};

// Изменение количества
export const useUpdateCartItem = () => {
  const applyCart = useApplyCartResponse();

  return useMutation({
    mutationFn: ({ id, quantity }) => cart.updateCartItem(id, quantity),
    onSuccess: applyCart,
  });
};

// Удаление товара
export const useDeleteCartItem = () => {
  const applyCart = useApplyCartResponse();

  return useMutation({
    mutationFn: (id) => cart.deleteCartItem(id),
    onSuccess: applyCart,
  });
};

// Очистка корзины
export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cart.clearCart,
    onSuccess: () => {
      queryClient.setQueryData(CART_KEY, normalizeCart({ items: [] }));
      queryClient.invalidateQueries({ queryKey: CART_KEY });
    },
  });
};