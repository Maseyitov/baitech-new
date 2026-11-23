import { $api } from "../../../../API/api";

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// Приводим любой ответ бэка к одному виду:
// { items, items_count, total_quantity, total_price }
export const normalizeCart = (data) => {
  let source = data;
  // На случай, если корзина пришла списком: { results: [ { items: [...] } ] }
  if (Array.isArray(data?.results) && data.results[0]?.items) {
    source = data.results[0];
  }

  let items = [];
  if (Array.isArray(source)) items = source;
  else if (Array.isArray(source?.items)) items = source.items;
  else if (Array.isArray(source?.results)) items = source.results;

  const calcTotal = items.reduce((sum, item) => {
    const lineTotal =
      item.total_price ??
      toNumber(item.price ?? item.product?.price) * toNumber(item.quantity);
    return sum + toNumber(lineTotal);
  }, 0);

  return {
    items,
    items_count: source?.items_count ?? items.length,
    total_quantity:
      source?.total_quantity ??
      items.reduce((sum, item) => sum + toNumber(item.quantity), 0),
    total_price:
      source?.total_price != null ? toNumber(source.total_price) : calcTotal,
  };
};

// Пришла ли в ответе вся корзина (после добавления/изменения/удаления)
export const isCartPayload = (data) =>
  !!data && (Array.isArray(data.items) || Array.isArray(data.results));

export const cart = {
  getCart: async () => {
    const { data } = await $api.get("/cart/cart/");
    return normalizeCart(data);
  },

  createCartItem: async (product_id, quantity = 1) => {
    const { data } = await $api.post("/cart/cart-items/", {
      product_id,
      quantity,
    });
    return data;
  },

  // quantity = 0 — бэк удалит товар
  updateCartItem: async (id, quantity) => {
    const { data } = await $api.patch(`/cart/cart-items/${id}/`, { quantity });
    return data;
  },

  deleteCartItem: async (id) => {
    const { data } = await $api.delete(`/cart/cart-items/${id}/`);
    return data;
  },

  clearCart: async () => {
    const { data } = await $api.delete("/cart/cart/clear/");
    return data;
  },
};