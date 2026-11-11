"use client";
import "./style.scss";
import logo from "../../../assets/svg/Байтех лого 2 1.svg";
import finik from "../../../assets/svg/Logo Purple 1.svg";
import mbank from "../../../assets/svg/Component 19.svg";
import optima from "../../../assets/svg/image-removebg-preview (6) 1.svg";

import { FiPhone, FiClock, FiMapPin, FiGlobe } from "react-icons/fi";
import { FaWhatsapp, FaInstagram, FaYoutube } from "react-icons/fa";
import { IoChevronDownSharp } from "react-icons/io5";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useSiteSettings } from "@/lib/settings/hook";

function Footer() {
  const { t } = useTranslation();
  const { settings, isLoading } = useSiteSettings();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (pathname === "/") {
      // уже на главной: наверх и обновить данные
      window.scrollTo({ top: 0, behavior: "smooth" });
      router.refresh();
    } else {
      // с другой страницы: на главную, наверх
      router.push("/");
      window.scrollTo({ top: 0 });
    }
  };

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

  const getMapEmbedUrl = () => {
    const rawAddress = String(settings?.address || "").trim();

    // Если уже готовый embed URL
    if (/^https?:\/\//i.test(rawAddress)) {
      if (
        rawAddress.includes("yandex") ||
        rawAddress.includes("openstreetmap")
      ) {
        return rawAddress;
      }
      if (
        rawAddress.includes("google.com/maps") &&
        !rawAddress.includes("output=embed")
      ) {
        const separator = rawAddress.includes("?") ? "&" : "?";
        return `${rawAddress}${separator}output=embed`;
      }
      if (rawAddress.includes("google.com/maps/embed")) return rawAddress;
    }

    // По умолчанию Yandex Maps с координатами Baitech
    return `https://yandex.ru/map-widget/v1/?ll=74.636407%2C42.844049&z=16&pt=74.636407,42.844049,pm2rdm&l=map`;
  };

  return (
    <footer className="footer">
      <div className="footer__container">
        {/* Контакты */}
        <div className="footer__col footer__col--contacts">
          <Link
            href="/"
            className="footer__logo-link"
            onClick={handleLogoClick}
          >
            <Image src={logo} alt="Baitex" className="footer__logo" />
          </Link>

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
              className="footer__social"
            >
              <span className="footer__social-icon">
                <FaWhatsapp />
              </span>
              <span className="footer__social-text">WhatsApp</span>
            </a>

            <a
              href={settings?.instagram ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="footer__social"
            >
              <span className="footer__social-icon">
                <FaInstagram />
              </span>
              <span className="footer__social-text">Instagram</span>
            </a>

            <a
              href="https://www.youtube.com/@baitech-1565"
              target="_blank"
              rel="noreferrer"
              className="footer__social"
            >
              <span className="footer__social-icon">
                <FaYoutube />
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
            <Image src={mbank} alt="Finik" />
            <Image src={optima} alt="Finik" className="ml-[-5px] mb-[3px] " />
            <Image src={finik} alt="Finik" />
          </div>
        </div>

        {/* Карта */}
        <div className="footer__col footer__col--map">
          <div className="footer__map">
            <div className="footer__map-title">{t("footer.map")}</div>
            {!isLoading && (
              <iframe
                title="Yandex Map"
                src={getMapEmbedUrl()}
                width="100%"
                height="400"
                loading="lazy"
                allow="fullscreen"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
          </div>
        </div>
      </div>

      <div className="footer__bottom flex justify-around  items-center gap-5">
        <h3>Baitech © 2021</h3>

        <a
          className="border-b-[1px] border-b-[#0e2eff] leading-snug "
          href="https://baitech-it.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Разработано Baitech.it company
        </a>
      </div>
    </footer>
  );
}

export default Footer;
