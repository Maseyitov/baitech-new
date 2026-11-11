"use client";
import React, { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import styles from "./Partners.module.css";
import { useTranslation } from "react-i18next";

// Новые логотипы
import bmGroup from "../../../assets/png/partners/bm-group.png";
import kumtor from "../../../assets/png/partners/kumtor.png";
import akylman from "../../../assets/png/partners/akylman.png";
import greenCity from "../../../assets/png/partners/green-city.png";
import oldBishkek from "../../../assets/png/partners/old-bishkek.png";
import alphaWhite from "../../../assets/png/partners/alpha-white.png";
import kadastr from "../../../assets/png/partners/kadastr.png";
import maarif from "../../../assets/png/partners/maarif.png";
import alatooUniversity from "../../../assets/png/partners/alatoo-university.png";
import bshz from "../../../assets/png/partners/bshz.png";
import arabaev from "../../../assets/png/partners/arabaev.png";
import mitSchool from "../../../assets/png/partners/mit-school.png";
import ololoYurt from "../../../assets/png/partners/ololo-yurt.png";
import campAlatoo from "../../../assets/png/partners/camp-alatoo.png";
import manasAirport from "../../../assets/png/partners/manas-airport.png";
import dasmia from "../../../assets/png/partners/dasmia.png";
import oshAirport from "../../../assets/png/partners/osh-airport.png";
import impulse from "../../../assets/png/partners/impulse.png";
import kuwaitUniversity from "../../../assets/png/partners/kuwait-university.png";
import ligaRobotov from "../../../assets/png/partners/liga-robotov.png";
import cambridge from "../../../assets/png/partners/cambridge.png";
import intellect from "../../../assets/png/partners/intellect.png";
import alatooDevelopment from "../../../assets/png/partners/alatoo-development.png";
import lomonosov from "../../../assets/png/partners/lomonosov.png";
import mid from "../../../assets/png/partners/mid.png";

// Старые логотипы (новых пока нет)
import Customers12 from "../../../assets/png/Customers12.jpg";
import Customers13 from "../../../assets/png/Customers13.png";
import Customers15 from "../../../assets/png/Customers15.jpg";
import Customers26 from "../../../assets/png/Customers26.png";

// Список заказчиков и партнёров (29 шт.)
const DEFAULT_PARTNERS = [
  { src: bmGroup, name: "ОсОО «БМ Групп»", kind: "Строительство" },
  { src: kumtor, name: "ЗАО «Кумтор Голд Компани»", kind: "Горнодобыча" },
  { src: akylman, name: "Президентский лицей «Акылман»", kind: "Образование" },
  { src: Customers12, name: "ЖК «Сандык»", kind: "Жилой комплекс" },
  { src: Customers13, name: "ЖК «Чырак»", kind: "Жилой комплекс" },
  {
    src: greenCity,
    name: "Курортный комплекс «Green City Centre»",
    kind: "Балыкчы",
  },
  {
    src: Customers26,
    name: "Центральная мечеть имени Имама Сарахси",
    kind: "Религиозный объект",
  },
  {
    src: oldBishkek,
    name: "Подземный торговый комплекс «Old Bishkek»",
    kind: "Торговля",
  },
  {
    src: Customers15,
    name: "Пансионат «Кооператор»",
    kind: "Отдых",
    scale: 1.2,
  },
  {
    src: alphaWhite,
    name: "Пансионат «Alpha Life Resort»",
    kind: "Иссык-Куль",
  },
  {
    src: kadastr,
    name: "Государственное учреждение «Кадастр»",
    kind: "Госучреждение",
  },
  {
    src: maarif,
    name: "Образовательный комплекс «Маариф»",
    kind: "Образование",
  },
  {
    src: alatooUniversity,
    name: "Международный университет Ала-Тоо",
    kind: "Образование",
  },
  { src: bshz, name: "Бишкекский штамповочный завод", kind: "Производство" },
  { src: arabaev, name: "КГУ им. И. Арабаева", kind: "Образование" },
  {
    src: mitSchool,
    name: "Частная школа MIT",
    kind: "Образование",
    scale: 1.8,
  },
  {
    src: ololoYurt,
    name: "Этнохостел и коворкинг-центр «ololoYurt»",
    kind: "Отдых",
  },
  { src: campAlatoo, name: "КЭМП Ала-Тоо", kind: "Общественный фонд" },
  {
    src: manasAirport,
    name: "Международный аэропорт «Манас»",
    kind: "Аэропорт",
  },
  { src: dasmia, name: "Фитнес-клуб «Дасмия»", kind: "Спорт" },
  { src: oshAirport, name: "Международный аэропорт «Ош»", kind: "Аэропорт", scale: 1.4 },
  { src: impulse, name: "Фитнес-клуб «Impulse»", kind: "Спорт" },
  {
    src: kuwaitUniversity,
    name: "Эл аралык Кувейт университети",
    kind: "Образование",
  },
  {
    src: ligaRobotov,
    name: "Международная школа программирования и робототехники «Лига роботов»",
    kind: "Образование",
  },
  {
    src: cambridge,
    name: "Кембриджская международная школа",
    kind: "Образование",
  },
  {
    src: intellect,
    name: "Intellect IT & Business College",
    kind: "Образование",
  },
  {
    src: alatooDevelopment,
    name: "Ала-Тоо Девелопмент",
    kind: "Строительство",
  },
  { src: lomonosov, name: "НОК «Школа Ломоносова»", kind: "Образование" },
  {
    src: mid,
    name: "Министерство иностранных дел Кыргызской Республики",
    kind: "Госучреждение",
  },
];

const ROWS = 3;
const MIN_PER_ROW = 6; // чтобы ряд всегда был шире экрана
const SECONDS_PER_ITEM = 9; // больше = медленнее
const DRAG_THRESHOLD = 5; // сколько px надо сдвинуть, чтобы это считалось перетаскиванием
const INERTIA_DECAY = 0.04; // доля скорости, что остаётся через 1 с после броска
const PAUSE_ON_HOVER = true; // останавливать ряд, когда на нём курсор

// Делим партнёров на 3 ряда по очереди
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

// Держим сдвиг в диапазоне (-half, 0], чтобы лента была бесконечной
function wrap(x, half) {
  if (half <= 0) return 0;
  let r = x % half;
  if (r > 0) r -= half;
  return r;
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
            width={160}
            height={160}
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
      {partner.href ? (
        <a
          className={styles.link}
          href={partner.href}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={hidden ? -1 : undefined}
          draggable={false}
        >
          {content}
        </a>
      ) : (
        content
      )}
    </li>
  );
}

function MarqueeRow({ row, reverse }) {
  const trackRef = useRef(null);
  const s = useRef({
    offset: 0,
    half: 0,
    vel: 0,
    dragging: false,
    moved: false,
    hovered: false,
    startX: 0,
    startOffset: 0,
    lastX: 0,
    lastT: 0,
  });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const st = s.current;

    const measure = () => {
      st.half = track.scrollWidth / 2;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const dir = reverse ? 1 : -1;

    let raf;
    let prev = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - prev) / 1000, 0.1);
      prev = now;

      if (st.half > 0 && !st.dragging) {
        // автопрокрутка
        if (!reduceMotion && !(PAUSE_ON_HOVER && st.hovered)) {
          const speed = st.half / (row.length * SECONDS_PER_ITEM);
          st.offset += dir * speed * dt;
        }
        // инерция после броска
        if (Math.abs(st.vel) > 1) {
          st.offset += st.vel * dt;
          st.vel *= Math.pow(INERTIA_DECAY, dt);
        } else {
          st.vel = 0;
        }
      }

      st.offset = wrap(st.offset, st.half);
      track.style.transform = `translate3d(${st.offset}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [row.length, reverse]);

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const st = s.current;
    st.dragging = true;
    st.moved = false;
    st.vel = 0;
    st.startX = e.clientX;
    st.startOffset = st.offset;
    st.lastX = e.clientX;
    st.lastT = performance.now();
  };

  const onPointerMove = (e) => {
    const st = s.current;
    if (!st.dragging) return;
    const dx = e.clientX - st.startX;

    if (!st.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      st.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.style.cursor = "grabbing";
    }

    st.offset = st.startOffset + dx;

    const now = performance.now();
    const dtMs = now - st.lastT;
    if (dtMs > 0) {
      const v = ((e.clientX - st.lastX) / dtMs) * 1000;
      st.vel = st.vel * 0.7 + v * 0.3; // сглаживаем скорость
    }
    st.lastX = e.clientX;
    st.lastT = now;
  };

  const endDrag = (e) => {
    const st = s.current;
    if (!st.dragging) return;
    st.dragging = false;
    // если перед отпусканием остановились — без инерции
    if (performance.now() - st.lastT > 80) st.vel = 0;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    e.currentTarget.style.cursor = "";
  };

  // Не даём сработать клику по ссылке, если ряд тянули
  const onClickCapture = (e) => {
    if (s.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      s.current.moved = false;
    }
  };

  return (
    <div
      className={styles.row}
      style={{ cursor: "grab", touchAction: "pan-y", userSelect: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") s.current.hovered = true;
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") s.current.hovered = false;
      }}
      onClickCapture={onClickCapture}
      onDragStart={(e) => e.preventDefault()}
    >
      <ul ref={trackRef} className={styles.track}>
        {/* Две одинаковые копии для бесшовной ленты */}
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
        {rows.map((row, rowIndex) => (
          // ряд 1 — влево, ряд 2 — вправо, ряд 3 — влево
          <MarqueeRow key={rowIndex} row={row} reverse={rowIndex % 2 === 1} />
        ))}
      </div>
    </section>
  );
}
