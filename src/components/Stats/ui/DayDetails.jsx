"use client";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Users,
  Layers,
  CalendarX,
} from "lucide-react";
import TopPages from "./TopPages.jsx";
import CountriesList from "./CountriesList.jsx";
import {
  formatPoint,
  formatNumber,
  plural,
  VISITORS_FORMS,
} from "../statsUtils";

const DayDetails = ({
  day,
  group = "day",
  hasPagesData,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}) => {
  if (!day) return null;

  const depth = day.visitors
    ? (day.views / day.visitors).toFixed(1).replace(".", ",")
    : "0";
  const hasCountries = day.countries.length > 0;

  return (
    <section className="stats__section day-details">
      <div className="day-details__head">
        <button
          type="button"
          className="day-details__nav"
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label="Назад"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="day-details__title">
          <h3>{formatPoint(day.day, group, "full")}</h3>
          <p>
            {day.visitors > 0
              ? `На сайт ${plural(day.visitors, ["зашёл", "зашли", "зашли"])} ${formatNumber(day.visitors)} ${plural(day.visitors, VISITORS_FORMS)}`
              : "В этот период посещений не было"}
          </p>
        </div>

        <button
          type="button"
          className="day-details__nav"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Вперёд"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {day.views === 0 ? (
        <div className="stats__empty">
          <CalendarX size={28} />
          <span>Нет данных за этот период</span>
        </div>
      ) : (
        <>
          <div className="day-details__metrics">
            <div className="day-metric">
              <Users
                size={18}
                className="day-metric__icon day-metric__icon--purple"
              />
              <span className="day-metric__label">Посетители</span>
              <span className="day-metric__value">
                {formatNumber(day.visitors)}
              </span>
            </div>
            <div className="day-metric">
              <Eye
                size={18}
                className="day-metric__icon day-metric__icon--blue"
              />
              <span className="day-metric__label">Просмотры</span>
              <span className="day-metric__value">
                {formatNumber(day.views)}
              </span>
            </div>
            <div className="day-metric">
              <Layers
                size={18}
                className="day-metric__icon day-metric__icon--gray"
              />
              <span className="day-metric__label">Страниц на посетителя</span>
              <span className="day-metric__value">{depth}</span>
            </div>
          </div>

          {hasPagesData && (
            <div
              className={`stats__grid ${hasCountries ? "" : "stats__grid--single"}`}
            >
              <TopPages
                title="Какие страницы открывали"
                pages={day.pages}
                totalViews={day.views}
              />
              {hasCountries && (
                <CountriesList
                  title="Откуда заходили"
                  countries={day.countries}
                  totalViews={day.views}
                />
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default DayDetails;
