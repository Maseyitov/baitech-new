"use client";

import { Eye, Users, FileText } from "lucide-react";
import {
  formatNumber,
  pageName,
  isAdminPath,
  isBotPath,
  percent,
} from "../statsUtils";

const TopPages = ({ pages = [], totalViews }) => {
  const sorted = [...pages].sort((a, b) => b.views - a.views);

  return (
    <section className="stats__section">
      <h3 className="stats__section-title">Популярные страницы</h3>

      {sorted.length === 0 ? (
        <div className="stats__empty">
          <FileText size={26} />
          <span>Пока нет данных</span>
        </div>
      ) : (
        <ul className="rank-list">
          {sorted.map((page) => {
            const share = percent(page.views, totalViews);
            return (
              <li key={page.path} className="rank-list__item">
                <div className="rank-list__top">
                  <div className="rank-list__name">
                    <a href={page.path} target="_blank" rel="noreferrer">
                      {pageName(page.path)}
                    </a>
                    {isAdminPath(page.path) && (
                      <span className="rank-list__tag">админка</span>
                    )}
                    {isBotPath(page.path) && (
                      <span className="rank-list__tag rank-list__tag--bot">
                        бот
                      </span>
                    )}
                    <span className="rank-list__sub">{page.path}</span>
                  </div>
                  <div className="rank-list__nums">
                    <span title="Просмотры">
                      <Eye size={14} />
                      {formatNumber(page.views)}
                    </span>
                    <span title="Посетители">
                      <Users size={14} />
                      {formatNumber(page.visitors)}
                    </span>
                  </div>
                </div>
                <div className="rank-list__bar-row">
                  <div className="rank-list__bar">
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

export default TopPages;
