"use client";

import React, { useState } from "react";
import {
  formatPoint,
  formatNumber,
  plural,
  CHART_TITLES,
  VIEWS_FORMS,
  VISITORS_FORMS,
} from "../statsUtils";

const ViewsChart = ({ data, group = "day", selectedKey, onSelect }) => {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(1, ...data.map((d) => d.views));
  const labelStep = Math.ceil(data.length / 7);
  const gap = data.length > 60 ? 1 : data.length > 31 ? 2 : 4;

  return (
    <section className="stats__section">
      <div className="stats__section-head">
        <div>
          <h3 className="stats__section-title">
            {CHART_TITLES[group] || "Посещаемость"}
          </h3>
          <p className="stats__hint">
            {hovered
              ? `${formatPoint(hovered.day, group, "long")}: ${formatNumber(hovered.views)} ${plural(hovered.views, VIEWS_FORMS)}, ${formatNumber(hovered.visitors)} ${plural(hovered.visitors, VISITORS_FORMS)}`
              : "Нажмите на столбик, чтобы увидеть подробности"}
          </p>
        </div>
        <div className="chart-legend">
          <span>
            <i className="chart-legend__dot chart-legend__dot--views" />
            Просмотры
          </span>
          <span>
            <i className="chart-legend__dot chart-legend__dot--visitors" />
            Посетители
          </span>
        </div>
      </div>

      <div className="chart">
        <div className="chart__max">{formatNumber(max)}</div>

        <div className="chart__bars" style={{ gap }}>
          {data.map((d) => (
            <button
              type="button"
              key={d.day}
              className={`chart__col ${selectedKey === d.day ? "is-selected" : ""}`}
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(d.day)}
              aria-label={formatPoint(d.day, group, "long")}
            >
              <div
                className="chart__bar chart__bar--views"
                style={{ height: `${(d.views / max) * 100}%` }}
              />
              <div
                className="chart__bar chart__bar--visitors"
                style={{ height: `${(d.visitors / max) * 100}%` }}
              />
            </button>
          ))}
        </div>

        <div className="chart__labels" style={{ gap }}>
          {data.map((d, i) => (
            <span
              key={d.day}
              className={selectedKey === d.day ? "is-selected" : ""}
            >
              {i % labelStep === 0 ||
              i === data.length - 1 ||
              selectedKey === d.day
                ? formatPoint(d.day, group, "short")
                : ""}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ViewsChart;
