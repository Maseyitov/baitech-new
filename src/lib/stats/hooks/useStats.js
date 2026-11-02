"use client";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { statsApi } from "../api/statsApi";

export const STATS_OVERVIEW_KEY = ["stats", "overview"];

// series: [{ t, views, visitors }] → by_day: [{ day, views, visitors }]
const normalizeStats = (data) => {
  if (!data) return data;
  const raw = data.series || data.by_day || [];
  return {
    ...data,
    group: data.group || "day",
    by_day: raw.map((item) => ({
      ...item,
      day: String(item.t ?? item.day ?? ""),
    })),
  };
};

export function useStatsOverview({ period = "month", enabled = true } = {}) {
  return useQuery({
    queryKey: [...STATS_OVERVIEW_KEY, period],
    queryFn: () => statsApi.getOverview({ period }),
    select: normalizeStats,
    placeholderData: keepPreviousData, // при переключении периода старые данные не пропадают
    enabled,
    retry: false,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
