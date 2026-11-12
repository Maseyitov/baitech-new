"use client";
import "./style.scss";
import Image from "next/image";
import logo from "../../../assets/svg/logo.svg";
import {
  FiSearch,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiChevronDown,
} from "react-icons/fi";
import { HiOutlineShoppingCart } from "react-icons/hi";
import { IoCartOutline, IoClose } from "react-icons/io5";
import { IoLanguageOutline } from "react-icons/io5";
import { FaWhatsapp, FaInstagram } from "react-icons/fa";
import Link from "next/link";
import ModalAuth from "../ui/modalauth/ModalAuth";
import SearchBox from "../SearchBox/SearchBox";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useCart } from "@/lib/cart/hooks/hooks";
import { useSiteSettings } from "@/lib/settings/hook";
import { useQueryClient } from "@tanstack/react-query";

const getStoredToken = () =>
  localStorage.getItem("access_token") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("accesToken") ||
  localStorage.getItem("acces_token");

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const modalRef = useRef(null);
  const langMenuRef = useRef(null);
  const contactsRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const mobileToggleRef = useRef(null);
  const { t, i18n } = useTranslation();
  const { data: items = [] } = useCart();
  const { settings, isLoading } = useSiteSettings();
  const queryClient = useQueryClient();

  // При переходе на другую страницу мобильный поиск закрывается
  useEffect(() => {
    setIsMobileSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const checkAuth = () => setIsAuth(!!getStoredToken());

    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("authChange", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("authChange", checkAuth);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setIsLangMenuOpen(false);
      }
      if (contactsRef.current && !contactsRef.current.contains(event.target)) {
        setIsContactsOpen(false);
      }
      // Кнопку-лупу исключаем, иначе панель закроется и сразу откроется снова
      const isInsideMobileSearch = mobileSearchRef.current?.contains(
        event.target,
      );
      const isOnToggle = mobileToggleRef.current?.contains(event.target);
      if (!isInsideMobileSearch && !isOnToggle) {
        setIsMobileSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleUserClick = () => {
    if (isAuth) {
      setIsOpen(!isOpen);
    } else {
      router.push("/login");
    }
  };

  const handleCartClick = (event) => {
    if (!getStoredToken()) {
      event.preventDefault();
      setShowAuthModal(true);
    }
  };

  const currentLangCode = (
    i18n.resolvedLanguage ||
    i18n.language ||
    "ru"
  ).split("-")[0];

  const changeLanguage = async (lng) => {
    if (!lng) return;
    if (currentLangCode === lng) {
      setIsLangMenuOpen(false);
      return;
    }

    localStorage.setItem("language", lng);
    await i18n.changeLanguage(lng);
    queryClient.invalidateQueries();
    setIsLangMenuOpen(false);
  };

  const getCurrentLanguage = () => {
    switch (currentLangCode) {
      case "en":
        return "EN";
      case "ky":
        return "KG";
      default:
        return "RU";
    }
  };

  const languages = [
    { code: "ru", label: "Русский" },
    { code: "en", label: "English" },
    { code: "ky", label: "Кыргызча" },
  ];

  const getCompanyMapUrl = () => {
    const rawMapUrl = String(settings?.address || "").trim();
    if (rawMapUrl.startsWith("http://") || rawMapUrl.startsWith("https://")) {
      return rawMapUrl;
    }

    const addressText = t("footer.address.street");
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;
  };

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__logo">
          <div>
            <a href="/" aria-label="Байтех — на главную">
              <Image src={logo} alt="Байтех" width={150} height={50} priority />
            </a>
          </div>

          <div className="contacts-wrapper" ref={contactsRef}>
            <button
              className={`header__contacts ${isContactsOpen ? "active" : ""}`}
              onClick={() => setIsContactsOpen(!isContactsOpen)}
            >
              <span>{t("header.contact")}</span>
              <FiChevronDown className="arrow-icon" />
            </button>

            {isContactsOpen && (
              <div className="contacts-dropdown">
                <div className="contacts-section">
                  <h3>
                    <FiPhone /> {t("header.phones")}
                  </h3>
                  <div className="contacts-list">
                    {isLoading ? (
                      <span className="footer__skeleton" />
                    ) : (
                      <a
                        href={`tel:${settings?.phone}`}
                        className="contact-item"
                      >
                        <FiPhone />
                        <span>{settings?.phone}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="contacts-section">
                  <h3>
                    <FiMail /> Email
                  </h3>
                  <div className="contacts-list">
                    {isLoading ? (
                      <span className="footer__skeleton" />
                    ) : (
                      <a
                        href={`mailto:${settings?.email}`}
                        className="contact-item"
                      >
                        <FiMail />
                        <span>{settings?.email}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="contacts-section">
                  <h3>
                    <FiMapPin /> {t("header.address")}
                  </h3>
                  <div className="contacts-list">
                    <a
                      href={getCompanyMapUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-item"
                    >
                      <FiMapPin />
                      {isLoading ? (
                        <span className="footer__skeleton" />
                      ) : (
                        <span>{t("footer.address.street")}</span>
                      )}
                    </a>
                  </div>
                </div>

                <div className="contacts-section">
                  <h3>{t("header.socials")}</h3>
                  <div className="contacts-social">
                    {settings?.whatsapp && (
                      <a
                        href={settings.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link whatsapp"
                      >
                        <FaWhatsapp />
                      </a>
                    )}
                    {settings?.instagram && (
                      <a
                        href={settings.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link instagram"
                      >
                        <FaInstagram />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <SearchBox variant="desktop" />

        <div className="header__icons">
          <button
            ref={mobileToggleRef}
            type="button"
            className="mobile-search-toggle"
            aria-label={t("header.search")}
            aria-expanded={isMobileSearchOpen}
            onClick={() => setIsMobileSearchOpen((prev) => !prev)}
          >
            <FiSearch />
          </button>

          <div className="language-selector" ref={langMenuRef}>
            <button
              className="language-button"
              type="button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            >
              <IoLanguageOutline />
              <span className="language-current">{getCurrentLanguage()}</span>
              <FiChevronDown
                className={`arrow-icon ${isLangMenuOpen ? "open" : ""}`}
              />
            </button>

            {isLangMenuOpen && (
              <div className="language-menu">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => changeLanguage(lang.code)}
                    className={currentLangCode === lang.code ? "active" : ""}
                  >
                    <span>{lang.label}</span>
                    {currentLangCode === lang.code && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M13.3332 4L5.99984 11.3333L2.6665 8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {settings?.instagram && (
            <a
              href={settings.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="header__instagram"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
          )}

          <Link href="/korzina" onClick={handleCartClick}>
            <div className="relative">
              <HiOutlineShoppingCart />
              {items.length > 0 && (
                <span className="absolute top-[-10px] right-[-10px] text-[14px] flex h-[17px] w-[17px] items-center justify-center rounded-full bg-[#3AA15B] pr-[0px] pt-[1px] text-white">
                  {items.length}
                </span>
              )}
            </div>
          </Link>

          <div className="relative">
            <FiUser onClick={handleUserClick} />
            {isAuth && isOpen && (
              <ModalAuth onClose={() => setIsOpen(false)} ref={modalRef} />
            )}
          </div>
        </div>
      </div>

      {isMobileSearchOpen && (
        <div className="mobile-search-panel" ref={mobileSearchRef}>
          <SearchBox
            variant="mobile"
            autoFocus
            onDone={() => setIsMobileSearchOpen(false)}
          />
        </div>
      )}

      {showAuthModal && (
        <div
          className="auth-modal__overlay"
          onClick={() => setShowAuthModal(false)}
        >
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="auth-modal__close"
              onClick={() => setShowAuthModal(false)}
              aria-label="Закрыть"
            >
              <IoClose size={20} />
            </button>
            <div className="auth-modal__icon">
              <IoCartOutline size={48} />
            </div>
            <h3 className="auth-modal__title">{t("auth.modal.title")}</h3>
            <p className="auth-modal__text">{t("auth.modal.description")}</p>
            <div className="auth-modal__actions">
              <Link
                href="/register"
                className="auth-modal__btn auth-modal__btn--primary"
                onClick={() => setShowAuthModal(false)}
              >
                {t("auth.modal.register")}
              </Link>
              <Link
                href="/login"
                className="auth-modal__btn auth-modal__btn--secondary"
                onClick={() => setShowAuthModal(false)}
              >
                {t("auth.modal.login")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
