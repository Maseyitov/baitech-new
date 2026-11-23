// src/components/guestOrder/AuthRequiredModal.jsx
// Окно «Вы не авторизованы» с кнопками «Зарегистрироваться» и «Войти».
"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { X, UserRound } from "lucide-react";
import styles from "./GuestOrder.module.scss";

export default function AuthRequiredModal({ open, onClose, text }) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`${styles.modalOverlay} ${styles.modalOverlayTop}`}
      onClick={onClose}
    >
      <div
        className={styles.authModal}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.authModalClose}
          onClick={onClose}
          aria-label={t("checkoutModal.close")}
        >
          <X size={18} />
        </button>

        <div className={styles.authModalIcon}>
          <UserRound size={44} strokeWidth={1.6} />
        </div>

        <h3 className={styles.authModalTitle}>
          {t("auth.modal.title", { defaultValue: "Вы не авторизованы" })}
        </h3>
        <p className={styles.authModalText}>
          {text ||
            t("guestOrder.authRequiredText", {
              defaultValue:
                "Вы ещё не зарегистрированы. Войдите или зарегистрируйтесь, чтобы открыть личный кабинет.",
            })}
        </p>

        <div className={styles.authModalActions}>
          <Link
            href="/register"
            className={styles.authBtnPrimary}
            onClick={onClose}
          >
            {t("auth.modal.register", { defaultValue: "Зарегистрироваться" })}
          </Link>
          <Link
            href="/login"
            className={styles.authBtnSecondary}
            onClick={onClose}
          >
            {t("auth.modal.login", { defaultValue: "Войти" })}
          </Link>
        </div>
      </div>
    </div>
  );
}
