"use client";

import React, { useMemo, useState } from "react";
import "./Stats.scss";
import {
  RefreshCw,
  AlertCircle,
  Eye,
  Users,
  CalendarCheck,
  UserCheck,
  Layers,
} from "lucide-react";
import StatCard from "./ui/StatCard.jsx";
import ViewsChart from "./ui/ViewsChart.jsx";
import DayDetails from "./ui/DayDetails.jsx";
import TopPages from "./ui/TopPages.jsx";
import CountriesList from "./ui/CountriesList.jsx";
import { useStatsOverview } from "@/lib/stats/hooks/useStats";
import {
  formatNumber,
  fillSeries,
  periodText as getPeriodText,
  PERIODS,
} from "./statsUtils";

const Stats = () => {
  const [period, setPeriod] = useState("month");
  const [selectedKey, setSelectedKey] = useState(null);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useStatsOverview({ period });

  const days = data?.days || 30;
  const group = data?.group || "day";
  const points = useMemo(
    () => fillSeries(data?.by_day || [], group, days),
    [data, group, days],
  );
  const hasPagesData = (data?.by_day || []).some((d) => Array.isArray(d.pages));

  const changePeriod = (id) => {
    setPeriod(id);
    setSelectedKey(null);
  };

  if (isLoading) {
    return (
      <div className="stats stats--center">
        <div className="stats__loader" />
        <h2>Загружаем статистику</h2>
        <p>Получаем актуальные данные...</p>
      </div>
    );
  }

  if (isError) {
    const status = error?.response?.status;
    return (
      <div className="stats stats--center">
        <AlertCircle size={40} className="stats__error-icon" />
        <h2>
          {status === 403
            ? "Нет доступа к статистике"
            : "Не удалось загрузить статистику"}
        </h2>
        <p>
          {status === 403
            ? "У вашей учётной записи нет прав администратора."
            : "Проверьте подключение и попробуйте ещё раз."}
        </p>
        <button
          type="button"
          className="stats__refresh"
          onClick={() => refetch()}
        >
          <RefreshCw size={18} />
          <span>Повторить</span>
        </button>
      </div>
    );
  }

  const foundIndex = points.findIndex((d) => d.day === selectedKey);
  const selectedIndex = foundIndex === -1 ? points.length - 1 : foundIndex;
  const selectedPoint = points[selectedIndex];

  const periodLabel = getPeriodText(period, days);
  const total = data?.total || { views: 0, visitors: 0 };
  const today = data?.today || { views: 0, visitors: 0 };
  const depth = total.visitors
    ? (total.views / total.visitors).toFixed(1).replace(".", ",")
    : "0";

  const updatedTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="stats">
      <div className="stats__header">
        <div>
          <h1 className="stats__title">Статистика посещений</h1>
          <p className="stats__subtitle">
            Данные {periodLabel}
            {updatedTime && <> · обновлено в {updatedTime}</>}
          </p>
        </div>

        <div className="stats__controls">
          <div className="period-switch" role="tablist">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={period === p.id}
                className={`period-switch__btn ${period === p.id ? "is-active" : ""}`}
                onClick={() => changePeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="stats__refresh"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={18} className={isFetching ? "stats__spin" : ""} />
            <span>{isFetching ? "Обновляем..." : "Обновить"}</span>
          </button>
        </div>
      </div>

      <div className={isFetching ? "stats__body is-fetching" : "stats__body"}>
        <div className="stats__cards">
          <StatCard
            icon={Eye}
            color="blue"
            label={`Просмотры ${periodLabel}`}
            value={formatNumber(total.views)}
            hint="Сколько раз открывали страницы"
          />
          <StatCard
            icon={Users}
            color="purple"
            label={`Посетители ${periodLabel}`}
            value={formatNumber(total.visitors)}
            hint="Уникальные люди"
          />
          <StatCard
            icon={CalendarCheck}
            color="green"
            label="Просмотры сегодня"
            value={formatNumber(today.views)}
          />
          <StatCard
            icon={UserCheck}
            color="orange"
            label="Посетители сегодня"
            value={formatNumber(today.visitors)}
          />
          <StatCard
            icon={Layers}
            color="gray"
            label="Глубина просмотра"
            value={depth}
            hint="Страниц на одного посетителя"
          />
        </div>

        <ViewsChart
          data={points}
          group={group}
          selectedKey={selectedPoint?.day}
          onSelect={setSelectedKey}
        />

        <DayDetails
          day={selectedPoint}
          group={group}
          hasPagesData={hasPagesData}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < points.length - 1}
          onPrev={() => setSelectedKey(points[selectedIndex - 1]?.day)}
          onNext={() => setSelectedKey(points[selectedIndex + 1]?.day)}
        />

        <h2 className="stats__block-title">Итоги {periodLabel}</h2>
        <div className="stats__grid">
          <TopPages
            title="Популярные страницы"
            pages={data?.top_pages || []}
            totalViews={total.views}
          />
          <CountriesList
            countries={data?.countries || []}
            totalViews={total.views}
          />
        </div>
      </div>
    </div>
  );
};

export default Stats;
