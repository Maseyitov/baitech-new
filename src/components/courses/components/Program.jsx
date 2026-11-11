"use client";
import { useState } from "react";
import { useCourseText } from "../i18n";

export default function Program() {
  const T = useCourseText();
  const MODULES = T.program.modules;
  const [open, setOpen] = useState(() => MODULES.map((_, i) => i === 0));
  const toggle = (i) => setOpen((prev) => prev.map((v, k) => (k === i ? !v : v)));

  return (
    <section id="catalog">
      <div className="wrap">
        <div className="head-c rv rv-blur">
          <span className="eyebrow">{T.program.eyebrow}</span>
          <h2>{T.program.title}</h2>
          <p>{T.program.sub}</p>
        </div>
        <ol className="mods" id="mods">
          {MODULES.map((m, i) => (
            <li key={i} className={`mod rv${open[i] ? " open" : ""}`}>
              <button className="mod-h" type="button" id={`mh${i + 1}`} aria-expanded={open[i]} aria-controls={`mp${i + 1}`} onClick={() => toggle(i)}>
                <span className="mod-n">{m.n}</span>
                <span className="mod-t"><b>{m.title}</b><small>{m.meta}</small></span>
                <span className="mod-ic" aria-hidden="true"></span>
              </button>
              <div className="mod-p" id={`mp${i + 1}`} role="region" aria-labelledby={`mh${i + 1}`}>
                <div className="mod-in">
                  <div className="mod-body">
                    <p>{m.desc}</p>
                    <ol className="lessons">
                      {m.lessons.map((l, k) => (
                        <li key={k}><span>{T.program.lesson(k + 1)}</span>{l}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <div className="mods-cta rv">
          <p><b>{T.program.ctaTitle}</b> {T.program.ctaText}</p>
          <a className="btn btn-brand" href="#apply">{T.program.cta}</a>
        </div>
      </div>
    </section>
  );
}
