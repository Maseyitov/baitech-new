"use client";
import { useTranslation } from "react-i18next";
import ru from "./ru";
import en from "./en";
import ky from "./ky";

const DICT = { ru, en, ky };

/* Тексты страницы курса на текущем языке сайта.
   Язык берётся из того же i18n, что и переключатель RU / EN / KG в шапке сайта. */
export function useCourseText() {
  const { i18n } = useTranslation();
  const code = (i18n.resolvedLanguage || i18n.language || "ru").split("-")[0];
  return DICT[code] || ru;
}
