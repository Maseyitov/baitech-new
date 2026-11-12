"use client";
import { Fragment } from "react";
import { useCourseText } from "../i18n";

export default function Hero() {
  const T = useCourseText();
  return (
    <section className="hero">
      <div className="wrap">
        <h1>
          {T.hero.title.map((w, i) => (
            <Fragment key={i}>
              {i > 0 && " "}
              <span className="w"><span className={w.grad ? "grad-text" : undefined}>{w.t}</span></span>
            </Fragment>
          ))}
        </h1>
        <p className="sub">{T.hero.sub}</p>
        <div className="acts">
          <a className="btn btn-brand" href="#apply">{T.hero.cta}</a>
          <a className="btn btn-ghost" href="#catalog">{T.hero.program}</a>
        </div>

        <div className="showcase" aria-hidden="true">
          <div className="glow"></div>
          <svg className="stage-svg" viewBox="0 0 1200 615" preserveAspectRatio="xMidYMid meet">
            <g fill="none" stroke="#4A8BFF" strokeWidth="2" className="flow" opacity=".75">
              <path d="M290 385 C 290 460, 330 482, 362 482" />
              <path d="M600 292 V 440" />
              <path d="M990 300 C 990 460, 880 482, 838 482" />
            </g>
            <g className="float d1"><use className="ph" href="#im-colorvu" transform="translate(70 190) scale(.526)" /></g>
            <g className="float"><use className="ph" href="#im-dome" transform="translate(480 52) scale(.522)" /></g>
            <g className="float d2"><use className="ph" href="#im-panovu" transform="translate(880 62) scale(.5)" /></g>
            <g className="float d3"><use className="ph" href="#im-nvr" transform="translate(362 442) scale(.787)" /></g>
          </svg>
          <div className="chips">
            {T.hero.chips.map((c, i) => (
              <span className="chip" key={i}><i></i>{c}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
