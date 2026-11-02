import { $api } from "../../../../API/api";

export const bannerget = {
  getBanner: async () => {
    const { data } = await $api.get("/banners/banners/?category=event");
    return data;
  },
  getBannerById: async (id) => {
    const { data } = await $api.get(`/banners/banners/${id}/`);
    return data;
  },
};