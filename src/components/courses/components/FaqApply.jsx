"use client";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { WA_PHONE } from "../data";
import { useCourseText } from "../i18n";
import Watermark from "./Watermark";

// Если в переводе каких-то строк ещё нет — берём эти (русские)
const DEFAULTS = {
  submit: "Отправить заявку",
  sending: "Отправляем…",
  sentTitle: "Заявка отправлена!",
  sentText: "Спасибо! Менеджер свяжется с вами в течение рабочего дня.",
  errSend:
    "Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в WhatsApp.",
  errTooMany:
    "Слишком много заявок. Попробуйте через 10 минут или напишите нам в WhatsApp.",
  waFallback: "Написать в WhatsApp",
  again: "Отправить ещё одну заявку",
};

export default function FaqApply() {
  const T = useCourseText();
  const { i18n } = useTranslation();
  const A = { ...DEFAULTS, ...T.apply };
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const levelRef = useRef(null);
  const trapRef = useRef(null);
  const [errors, setErrors] = useState({ n: "", p: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [sendError, setSendError] = useState("");
  const [waHref, setWaHref] = useState("");

  const validate = () => {
    const n = nameRef.current.value.trim();
    const p = phoneRef.current.value.trim();
    const digits = p.replace(/\D/g, "");
    return {
      n: n ? "" : A.errName,
      p: !p ? A.errPhone : digits.length < 9 ? A.errPhoneShort : "",
      values: { n, p },
    };
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status === "sending") return;
    const { n, p, values } = validate();
    setErrors({ n, p });
    if (n || p) {
      (n ? nameRef : phoneRef).current.focus();
      return;
    }
    const level = A.levels[+levelRef.current.value] || A.levels[0];

    // Запасной вариант — ссылка в WhatsApp с готовым текстом (если автоматическая отправка не сработает)
    const text = `${A.wa.intro}\n${A.wa.name}: ${values.n}\n${A.wa.phone}: ${values.p}\n${A.wa.level}: ${level}`;
    setWaHref(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`);

    setStatus("sending");
    setSendError("");
    try {
      const res = await fetch("/api/course-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.n,
          phone: values.p,
          level,
          lang: (i18n.resolvedLanguage || i18n.language || "ru").split("-")[0],
          company: trapRef.current?.value || "", // ловушка для ботов
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus("sent");
        return;
      }
      setSendError(data.error === "too_many" ? A.errTooMany : A.errSend);
      setStatus("error");
    } catch {
      setSendError(A.errSend);
      setStatus("error");
    }
  };

  // Убираем ошибку, как только человек начал исправлять поле
  const clearError = (key) => () =>
    errors[key] && setErrors((prev) => ({ ...prev, [key]: "" }));

  const again = () => {
    setStatus("idle");
    setSendError("");
  };

  return (
    <section className="wm-host grey" id="faq">
      <Watermark area="faq" />
      <div className="wrap">
        <div className="head-c rv rv-blur">
          <span className="eyebrow">{T.faq.eyebrow}</span>
          <h2>{T.faq.title}</h2>
        </div>
        <div className="ff">
          <div className="faq rv">
            {T.faq.items.map(([q, a], i) => (
              <details key={i} open={i === 0}>
                <summary>
                  <span>{q}</span>
                  <i className="faq-ic" aria-hidden="true" />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>

          <aside className="apply rv" id="apply">
            {status !== "sent" ? (
              <>
                <h3>{A.title}</h3>
                <p>{A.text}</p>
                <form
                  id="f"
                  noValidate
                  onSubmit={onSubmit}
                  aria-busy={status === "sending"}
                >
                  {/* Ловушка для спам-ботов: людям не видна */}
                  <input
                    ref={trapRef}
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: "-9999px",
                      width: 1,
                      height: 1,
                      opacity: 0,
                    }}
                  />
                  <label htmlFor="n">
                    {A.name}
                    <input
                      id="n"
                      ref={nameRef}
                      autoComplete="name"
                      placeholder={A.namePh}
                      aria-invalid={!!errors.n}
                      onInput={clearError("n")}
                    />
                    {errors.n && <span className="err">{errors.n}</span>}
                  </label>
                  <label htmlFor="ph">
                    {A.phone}
                    <input
                      id="ph"
                      ref={phoneRef}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+996 ___ ___ ___"
                      aria-invalid={!!errors.p}
                      onInput={clearError("p")}
                    />
                    {errors.p && <span className="err">{errors.p}</span>}
                  </label>
                  <label htmlFor="lv">
                    {A.level}
                    <select id="lv" ref={levelRef} defaultValue="0">
                      {A.levels.map((l, i) => (
                        <option key={i} value={i}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="btn btn-brand"
                    type="submit"
                    disabled={status === "sending"}
                    style={
                      status === "sending"
                        ? { opacity: 0.75, cursor: "wait" }
                        : undefined
                    }
                  >
                    {status === "sending" ? A.sending : A.submit}
                  </button>
                  {status === "error" && (
                    <div role="alert" style={{ display: "grid", gap: 10 }}>
                      <span className="err" style={{ fontSize: 14 }}>
                        {sendError}
                      </span>
                      <a
                        className="btn btn-ghost"
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#fff" }}
                      >
                        {A.waFallback}
                      </a>
                    </div>
                  )}
                  <span className="small">
                    {A.consent[0]}
                    <a href="https://baitech-new-preview.vercel.app/privacy/">
                      {A.consent[1]}
                    </a>
                    {A.consent[2]}
                  </span>
                </form>
              </>
            ) : (
              <div className="done" id="done" role="status">
                <span className="done-ic" aria-hidden="true">
                  ✓
                </span>
                <h3>{A.sentTitle}</h3>
                <p>{A.sentText}</p>
                <p>
                  {A.call}{" "}
                  <a className="tel" href="tel:+996 505 406 805">
                    +996 505 406 805
                  </a>
                </p>
                <button type="button" className="again" onClick={again}>
                  {A.again}
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
