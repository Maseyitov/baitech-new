import { $api } from "../../../../API/api";

// Если в Swagger параметр называется иначе — поменяйте здесь
export const PERIOD_PARAM = "period";

export const statsApi = {
  getOverview: async ({ period } = {}) => {
    const params = period ? { [PERIOD_PARAM]: period } : {};
    const { data } = await $api.get("api/stats/overview/", { params });
    return data;
  },
};
