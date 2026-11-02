"use client";

import { Eye, Users, Globe } from "lucide-react";
import { formatNumber, countryName, percent } from "../statsUtils";

const CountriesList = ({ countries = [], totalViews }) => {
  const sorted = [...countries].sort((a, b) => b.views - a.views);

  return (
    <section className="stats__section">
      <h3 className="stats__section-title">Страны посетителей</h3>

      {sorted.length === 0 ? (
        <div className="stats__empty">
          <Globe size={26} />
          <span>Пока нет данных</span>
        </div>
      ) : (
        <ul className="rank-list">
          {sorted.map((c) => {
            const share = percent(c.views, totalViews);
            return (
              <li key={c.country || "unknown"} className="rank-list__item">
                <div className="rank-list__top">
                  <div className="rank-list__name">
                    <span className="rank-list__code">{c.country || "??"}</span>
                    <span>{countryName(c.country)}</span>
                  </div>
                  <div className="rank-list__nums">
                    <span title="Просмотры">
                      <Eye size={14} />
                      {formatNumber(c.views)}
                    </span>
                    <span title="Посетители">
                      <Users size={14} />
                      {formatNumber(c.visitors)}
                    </span>
                  </div>
                </div>
                <div className="rank-list__bar-row">
                  <div className="rank-list__bar rank-list__bar--green">
                    <div style={{ width: `${share}%` }} />
                  </div>
                  <span className="rank-list__pct">{share}%</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default CountriesList;
