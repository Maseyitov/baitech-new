"use client";
import React, { useMemo } from "react";
import Image from "next/image";
import styles from "./Partners.module.css";
import { useTranslation } from "react-i18next";

import logo03 from "../../../assets/svg/3.svg";
import logo07 from "../../../assets/svg/7.svg";
import logo08 from "../../../assets/svg/8.svg";
import logo12 from "../../../assets/svg/12.svg";
import logo15 from "../../../assets/svg/15.jpg";
import logo17 from "../../../assets/svg/17.svg";
import Customers1 from "../../../assets/png/Customers1.jpg";
import Customers2 from "../../../assets/png/Customers2.jpg";
import Customers4 from "../../../assets/png/Customers4.jpg";
import Customers6 from "../../../assets/png/Customers6.jpg";
import Customers7 from "../../../assets/png/Customers7.jpg";
import Customers10 from "../../../assets/png/Customers10.jpg";
import Customers12 from "../../../assets/png/Customers12.jpg";
import Customers13 from "../../../assets/png/Customers13.png";
import Customers15 from "../../../assets/png/Customers15.jpg";
import Customers16 from "../../../assets/png/Customers16.jpg";
import Customers18 from "../../../assets/png/Customers18.jpg";
import Customers20 from "../../../assets/png/Customers20.jpg";
import Customers22 from "../../../assets/png/Customers22.jpg";
import Customers24 from "../../../assets/png/Customers24.jpg";
import Customers33 from "../../../assets/png/Customers33.png";
import Customers26 from "../../../assets/png/Customers26.png";
import Customers5 from "../../../assets/png/Customers5.jpg";
import Customers27 from "../../../assets/png/Customers27.jpg";
import Customers28 from "../../../assets/png/Customers28.png";
import Customers29 from "../../../assets/png/Customers29.jpg";
import Customers30 from "../../../assets/png/Customers30.jpg";
import Customers31 from "../../../assets/png/Customers31.jpg";
import Customers32 from "../../../assets/png/Customers32.jpg";


// Окончательный список заказчиков и партнёров (29 шт.)
// У кого нет src — показывается только текст. Чтобы добавить логотип,
// импортируйте файл и пропишите src (и при необходимости scale).
const DEFAULT_PARTNERS = [
  { src: Customers4, name: "БМ Групп", kind: "Офис" },
  { src: Customers31, name: "Кумтор", kind: "Горнодобыча" },
  {
    src: Customers6,
    name: "Президентский лицей «Акылман»",
    kind: "Образование",
  },
  { src: Customers12, name: "ЖК «Сандык»", kind: "Жилой комплекс" },
  { src: Customers13, name: "ЖК «Чырак»", kind: "Жилой комплекс" },
  { src: Customers33, name: "Грин Сити", kind: "Балыкчы", scale: 2.4 },
  { src: Customers26, name: "Мечеть Сарахси", kind: "Религиозный объект" },
  { src: Customers27, name: "Олд Бишкек", kind: "Бишкек", scale: 1.4 },
  {
    src: Customers15,
    name: "Пансионат «Кооператор»",
    kind: "Отдых",
    scale: 1.2,
  },
  { src: Customers16, name: "Пансионат «Alpha White»", kind: "Иссык-Куль" },
  { src: Customers5, name: "Кадастр", kind: "Госучреждение" },
  { src: Customers2, name: "Маариф", kind: "Образование", scale: 1.7 },
  { src: Customers28, name: "Университет «Ала-Тоо»", kind: "Образование" },
  {
    src: logo12,
    name: "Бишкекский штамповочный завод",
    kind: "Производство",
    scale: 3.5,
  },
  { src: Customers29, name: "Университет им. Арабаева", kind: "Образование", scale: 1.3 },
  { src: Customers18, name: "Школа MIT", kind: "Образование" },
  { src: logo08, name: "Ололо Юрт", kind: "Отдых", scale: 3.3 },
  { src: Customers20, name: "КЭМП Ала-Тоо", kind: "Отдых", scale: 1.1 },
  { src: logo15, name: "Международный аэропорт «Манас»", kind: "Аэропорт" },
  { src: logo17, name: "Фитнес-центр «Дасмия»", kind: "Спорт", scale: 1.9 },
  {
    src: Customers10,
    name: "Международный аэропорт «Ош»",
    kind: "Аэропорт",
    scale: 1.4,
  },
  { src: Customers22, name: "Фитнес-клуб «Импульс»", kind: "Спорт" },
  {
    src: logo03,
    name: "Эл аралык Кувейт университети",
    kind: "Образование",
    scale: 2.1,
  },
  { src: logo07, name: "Лего роботов", kind: "Образование", scale: 2.3 },
  { src: Customers30, name: "Кембридж школа", kind: "Образование" },
  { src: Customers24, name: "Колледж «Интеллект»", kind: "Образование" },
  { src: Customers32, name: "Ала-Тоо Девелопмент", kind: "Строительство" },
  { src: Customers1, name: "Школа им. Ломоносова", kind: "Образование" },
  { src: Customers7, name: "МИД", kind: "Бишкек" },
];

const ROWS = 3;
const MIN_PER_ROW = 6; // чтобы ряд всегда был шире экрана
const SECONDS_PER_ITEM = 9; // больше = медленнее

// Делим партнёров на 3 ряда по очереди: 1-й → ряд 1, 2-й → ряд 2, ...
function splitIntoRows(list, rows) {
  const result = Array.from({ length: rows }, () => []);
  list.forEach((p, i) => result[i % rows].push(p));
  return result.filter((r) => r.length > 0);
}

// Повторяем короткий ряд, пока не станет достаточно элементов
function fillRow(row) {
  if (row.length === 0) return row;
  const out = [...row];
  while (out.length < MIN_PER_ROW) out.push(...row);
  return out;
}

function PartnerItem({ partner, hidden }) {
  const content = (
    <>
      {partner.src ? (
        <span className={styles.logoBox}>
          <Image
            className={styles.logo}
            src={partner.src}
            alt=""
            width={320}
            height={200}
            quality={90}
            draggable={false}
            style={{
              objectFit: partner.fit || "contain",
              transform:
                partner.scale && partner.scale !== 1
                  ? `scale(${partner.scale})`
                  : undefined,
            }}
          />
        </span>
      ) : null}
      <span className={styles.text}>
        {partner.kind ? (
          <span className={styles.kind}>{partner.kind}</span>
        ) : null}
        <span className={styles.name}>{partner.name}</span>
      </span>
    </>
  );

  return (
    <li className={styles.item} aria-hidden={hidden || undefined}>
      <span className={styles.dot} aria-hidden="true" />
      {partner.href ? (
        <a
          className={styles.link}
          href={partner.href}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={hidden ? -1 : undefined}
        >
          {content}
        </a>
      ) : (
        content
      )}
    </li>
  );
}

export default function Partners({ partners = DEFAULT_PARTNERS }) {
  const { t } = useTranslation();

  const rows = useMemo(
    () => splitIntoRows(partners, ROWS).map(fillRow),
    [partners],
  );

  if (partners.length === 0) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>
          {t("ClientsAndPartners", "Заказчики и партнёры")}
        </h2>
        <p className={styles.empty}>Список партнёров скоро появится.</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>
        {t("ClientsAndPartners", "Заказчики и партнёры")}
      </h2>

      <div className={styles.rows}>
        {rows.map((row, rowIndex) => {
          // ряд 1 — влево, ряд 2 — вправо, ряд 3 — влево
          const reverse = rowIndex % 2 === 1;
          const duration = row.length * SECONDS_PER_ITEM;

          return (
            <div className={styles.row} key={rowIndex}>
              <ul
                className={`${styles.track} ${reverse ? styles.toRight : styles.toLeft}`}
                style={{ animationDuration: `${duration}s` }}
              >
                {/* Две одинаковые копии: анимация сдвигает на -50%,
                    и вторая копия бесшовно занимает место первой */}
                {[0, 1].map((copy) =>
                  row.map((partner, i) => (
                    <PartnerItem
                      key={`${copy}-${i}`}
                      partner={partner}
                      hidden={copy === 1}
                    />
                  )),
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
