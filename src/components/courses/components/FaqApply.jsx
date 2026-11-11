"use client";
import { useRef, useState } from "react";
import { WA_PHONE } from "../data";
import { useCourseText } from "../i18n";

export default function FaqApply() {
  const T = useCourseText();
  const A = T.apply;
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const levelRef = useRef(null);
  const [errors, setErrors] = useState({ n: "", p: "" });
  const [waHref, setWaHref] = useState(null);

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

  const onSubmit = (e) => {
    e.preventDefault();
    const { n, p, values } = validate();
    setErrors({ n, p });
    if (n || p) {
      (n ? nameRef : phoneRef).current.focus();
      return;
    }
    const text =
      `${A.wa.intro}\n` +
      `${A.wa.name}: ${values.n}\n${A.wa.phone}: ${values.p}\n${A.wa.level}: ${A.levels[+levelRef.current.value] || A.levels[0]}`;
    const href = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;
    setWaHref(href);
    // Сразу открываем WhatsApp с готовым сообщением; если браузер заблокирует — останется кнопка ниже
    window.open(href, "_blank", "noopener,noreferrer");
  };

  // Убираем ошибку, как только человек начал исправлять поле
  const clearError = (key) => () => errors[key] && setErrors((prev) => ({ ...prev, [key]: "" }));

  return (
    <section className="grey" id="faq">
      <div className="wrap">
        <div className="head-c rv rv-blur"><span className="eyebrow">{T.faq.eyebrow}</span><h2>{T.faq.title}</h2></div>
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
            {!waHref ? (
              <>
                <h3>{A.title}</h3>
                <p>{A.text}</p>
                <form id="f" noValidate onSubmit={onSubmit}>
                  <label htmlFor="n">
                    {A.name}
                    <input id="n" ref={nameRef} autoComplete="name" placeholder={A.namePh} aria-invalid={!!errors.n} onInput={clearError("n")} />
                    {errors.n && <span className="err">{errors.n}</span>}
                  </label>
                  <label htmlFor="ph">
                    {A.phone}
                    <input id="ph" ref={phoneRef} type="tel" inputMode="tel" autoComplete="tel" placeholder="+996 ___ ___ ___" aria-invalid={!!errors.p} onInput={clearError("p")} />
                    {errors.p && <span className="err">{errors.p}</span>}
                  </label>
                  <label htmlFor="lv">
                    {A.level}
                    <select id="lv" ref={levelRef} defaultValue="0">
                      {A.levels.map((l, i) => (
                        <option key={i} value={i}>{l}</option>
                      ))}
                    </select>
                  </label>
                  <button className="btn btn-brand" type="submit">{A.submit}</button>
                  <span className="small">
                    {A.consent[0]}
                    <a href="https://baitech-new-preview.vercel.app/privacy/">{A.consent[1]}</a>
                    {A.consent[2]}
                  </span>
                </form>
              </>
            ) : (
              <div className="done" id="done">
                <span className="done-ic" aria-hidden="true">✓</span>
                <h3>{A.doneTitle}</h3>
                <p>{A.doneText}</p>
                <a className="btn btn-brand" href={waHref} target="_blank" rel="noopener noreferrer">{A.doneBtn}</a>
                <p>{A.call} <a className="tel" href="tel:+996558000222">+996 558 000 222</a></p>
                <button type="button" className="again" onClick={() => setWaHref(null)}>{A.edit}</button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
