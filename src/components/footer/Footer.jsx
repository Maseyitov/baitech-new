"use client";
import "./style.scss";
import logo from "../../../assets/svg/Байтех лого 2 1.svg";
import finik from "../../../assets/svg/Logo Purple 1.svg";
import mbank from "../../../assets/svg/Component 19.svg";
import optima from "../../../assets/svg/image-removebg-preview (6) 1.svg";
import mapPreview from "../../../assets/png/map-2gis.png"; // скриншот карты 2ГИС

import { FiPhone, FiClock, FiMapPin } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { IoChevronDownSharp } from "react-icons/io5";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useSiteSettings } from "@/lib/settings/hook";

/* ===== Карта 2ГИС ===== */

const BAITECH_COORDS = { lat: 42.844049, lon: 74.636407 };

// Лучше заменить на ссылку карточки фирмы: https://2gis.kg/bishkek/firm/XXXXXXXX
const DGIS_LINK = `https://2gis.kg/bishkek/geo/${BAITECH_COORDS.lon}%2C${BAITECH_COORDS.lat}`;

/* ===== Фирменные иконки соцсетей ===== */

const WhatsAppIcon = () => (
  <span className="brand-icon brand-icon--whatsapp">
    <FaWhatsapp style={{ color: "#fff", fill: "#fff" }} />
  </span>
);

const InstagramIcon = () => (
  <svg
    className="brand-icon"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <radialGradient id="igGradient" cx="30%" cy="107%" r="150%">
        <stop offset="0" stopColor="#fdf497" />
        <stop offset="0.05" stopColor="#fdf497" />
        <stop offset="0.45" stopColor="#fd5949" />
        <stop offset="0.6" stopColor="#d6249f" />
        <stop offset="0.9" stopColor="#285AEB" />
      </radialGradient>
    </defs>
    <rect width="24" height="24" rx="6" style={{ fill: "url(#igGradient)" }} />
    <rect
      x="5"
      y="5"
      width="14"
      height="14"
      rx="4"
      style={{ fill: "none", stroke: "#fff", strokeWidth: 1.8 }}
    />
    <circle
      cx="12"
      cy="12"
      r="3.3"
      style={{ fill: "none", stroke: "#fff", strokeWidth: 1.8 }}
    />
    <circle cx="16.3" cy="7.7" r="1" style={{ fill: "#fff" }} />
  </svg>
);

const YouTubeIcon = () => (
  <svg
    className="brand-icon"
    viewBox="0 0 28 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      style={{ fill: "#FF0000" }}
      d="M27.4 3.1A3.5 3.5 0 0 0 25 .6C22.8 0 14 0 14 0S5.2 0 3 .6A3.5 3.5 0 0 0 .6 3.1C0 5.3 0 10 0 10s0 4.7.6 6.9A3.5 3.5 0 0 0 3 19.4c2.2.6 11 .6 11 .6s8.8 0 11-.6a3.5 3.5 0 0 0 2.4-2.5c.6-2.2.6-6.9.6-6.9s0-4.7-.6-6.9z"
    />
    <path style={{ fill: "#fff" }} d="M11.2 14.3 18.5 10l-7.3-4.3z" />
  </svg>
);

function Footer() {
  const { t } = useTranslation();
  const { settings, isLoading } = useSiteSettings();

  const [openSections, setOpenSections] = useState({
    info: false,
    client: false,
    payment: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <footer className="footer">
      <div className="footer__container">
        {/* Контакты */}
        <div className="footer__col footer__col--contacts">
          <a
            className="footer__logo-link"
            href="/"
            aria-label="Байтех — на главную"
          >
            <Image src={logo} alt="Байтех" width={150} height={50} priority />
          </a>

          <div className="footer__item footer__item--phones">
            <FiPhone />
            {isLoading ? (
              <span className="footer__skeleton" />
            ) : (
              <div className="footer__phones">
                <div className="footer__phone">
                  <span className="footer__phone-label">
                    {t("footer.phones.shop")}
                  </span>
                  <span className="footer__phone-number">+996 558 000 222</span>
                </div>

                <div className="footer__phone">
                  <span className="footer__phone-label">
                    {t("footer.phones.academy")}
                  </span>
                  <span className="footer__phone-number">+996 505 406 805</span>
                </div>
              </div>
            )}
          </div>

          <div className="footer__item">
            <FiClock />
            {isLoading ? (
              <span className="footer__skeleton" />
            ) : (
              <span>{settings?.work_hours}</span>
            )}
          </div>

          <div className="footer__item">
            <FiMapPin />
            <span>
              {t("footer.address.street")} <br />
              {t("footer.address.country")}
            </span>
          </div>

          <div className="footer__socials">
            <a
              href={settings?.whatsapp ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="footer__social footer__social--whatsapp"
            >
              <span className="footer__social-icon">
                <WhatsAppIcon />
              </span>
              <span className="footer__social-text">WhatsApp</span>
            </a>

            <a
              href={settings?.instagram ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="footer__social footer__social--instagram"
            >
              <span className="footer__social-icon">
                <InstagramIcon />
              </span>
              <span className="footer__social-text">Instagram</span>
            </a>

            <a
              href="https://www.youtube.com/@baitech-1565"
              target="_blank"
              rel="noreferrer"
              className="footer__social footer__social--youtube"
            >
              <span className="footer__social-icon">
                <YouTubeIcon />
              </span>
              <span className="footer__social-text">YouTube</span>
            </a>
          </div>
        </div>

        {/* Информация */}
        <div className="footer__col footer__col--accordion">
          <button
            className="footer__accordion-header"
            onClick={() => toggleSection("info")}
            type="button"
          >
            <h4>{t("footer.information.title")}</h4>
            <IoChevronDownSharp
              className={`footer__accordion-icon ${openSections.info ? "footer__accordion-icon--open" : ""}`}
            />
          </button>
          <div
            className={`footer__accordion-content ${openSections.info ? "footer__accordion-content--open" : ""}`}
          >
            <ul>
              <li>
                <Link href="/about">{t("footer.information.aboutUs")}</Link>
              </li>
              <li>
                <Link href="/garantiya">
                  {t("footer.information.warranty", "Гарантия")}
                </Link>
              </li>
              <li>
                <Link href="/privacy">{t("footer.information.privacy")}</Link>
              </li>
              <li>
                <Link href="/terms">{t("footer.information.terms")}</Link>
              </li>
              <li>
                <Link href="/brands">
                  {t("footer.information.manufacturers")}
                </Link>
              </li>
              <li>
                <Link href="/certificates">
                  {t("footer.information.certificates")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Клиенту */}
        <div className="footer__col footer__col--accordion">
          <button
            className="footer__accordion-header"
            onClick={() => toggleSection("client")}
            type="button"
          >
            <h4>{t("footer.client.title")}</h4>
            <IoChevronDownSharp
              className={`footer__accordion-icon ${openSections.client ? "footer__accordion-icon--open" : ""}`}
            />
          </button>
          <div
            className={`footer__accordion-content ${openSections.client ? "footer__accordion-content--open" : ""}`}
          >
            <ul>
              <li>
                <a href="/profile">{t("footer.client.account")}</a>
              </li>
              <li>
                <Link href="/profile?tab=orders">
                  {t("footer.client.orderHistory")}
                </Link>
              </li>
              <li>
                <Link href="/profile?tab=returns">
                  {t("footer.client.returns")}
                </Link>
              </li>
              <li>
                <Link href="/dilleram">{t("footer.client.diller")}</Link>
              </li>
              <li>
                <Link href="/calculator">{t("footer.client.calculator")}</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Оплата */}
        <div className="footer__col footer__col--accordion">
          <button
            className="footer__accordion-header"
            onClick={() => toggleSection("payment")}
            type="button"
          >
            <h4>{t("footer.client.title2")}</h4>
            <IoChevronDownSharp
              className={`footer__accordion-icon ${openSections.payment ? "footer__accordion-icon--open" : ""}`}
            />
          </button>
          <div
            className={`footer__accordion-content ${openSections.payment ? "footer__accordion-content--open" : ""}`}
          >
            <Image src={mbank} alt="MBank" />
            <Image src={optima} alt="Optima" className="ml-[-5px] mb-[3px] " />
            <Image src={finik} alt="Finik" />
          </div>
        </div>

        {/* Карта 2ГИС */}
        <div className="footer__col footer__col--map">
          <div className="footer__map">
            {/* Обманка: картинка карты вместо живого виджета */}
            <Image
              src={mapPreview}
              alt="Байтех на карте 2ГИС"
              fill
              sizes="(max-width: 950px) 100vw, 360px"
              className="footer__map-img"
            />

            {/* Метка на здании */}
            {/* <span className="footer__map-pin" aria-hidden="true">
              <svg viewBox="0 0 24 32" width="34" height="44">
                <path
                  d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 32 12 32s12-11.2 12-20.1C24 5.3 18.6 0 12 0z"
                  fill="#1f8a63"
                />
                <circle cx="12" cy="12" r="5" fill="#fff" />
              </svg>
            </span> */}

            {/* Клик по карте — открыть в 2ГИС */}
            <a
              className="footer__map-link"
              href={DGIS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Открыть Байтех в 2ГИС"
            >
              <span className="footer__map-btn">Открыть в 2ГИС ↗</span>
            </a>
          </div>
        </div>
      </div>

      <div className="footer__bottom flex justify-around items-center gap-5">
        <h3>Baitech © 2021</h3>
      </div>
    </footer>
  );
}

export default Footer;
