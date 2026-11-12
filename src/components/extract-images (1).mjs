"use client";
import { useState } from "react";
import { useCourseText } from "../i18n";

export default function SystemScheme() {
  const T = useCourseText();
  // ключи и номера — постоянные, тексты — из перевода
  const LEGEND = ["cam", "sw", "nvr", "view"].map((k, i) => ({ k, n: i + 1, ...T.system.legend[i] }));
  const [active, setActive] = useState(null);
  const wires = [
    ["p1", "M160 62 C 250 62, 250 196, 330 196"],
    ["p2", "M160 162 C 240 162, 260 208, 330 208"],
    ["p3", "M160 262 C 240 262, 260 220, 330 220"],
    ["p4", "M160 362 C 250 362, 250 232, 330 232"],
    ["p5", "M480 214 L560 214"],
    ["p6", "M710 200 C 760 200, 760 100, 800 100"],
    ["p7", "M710 228 C 745 228, 745 320, 780 320 L 880 320"],
  ];
  const dots = [
    ["p1", "2.4s", null], ["p2", "2.4s", ".6s"], ["p3", "2.4s", "1.2s"], ["p4", "2.4s", "1.8s"],
    ["p5", "1s", null], ["p6", "1.8s", null], ["p7", "2.2s", ".4s"],
  ];

  return (
    <section id="system">
      <div className="wrap">
        <div className="head-c rv rv-blur">
          <span className="eyebrow">{T.system.eyebrow}</span>
          <h2>{T.system.title}</h2>
          <p>{T.system.sub}</p>
        </div>
        <div className="sys-wrap" style={{ background: "var(--bg-2)", borderRadius: 28, padding: 20 }}>
          <div className="sys-card rv rv-zoom">
            <svg
              className="sys"
              id="sys"
              viewBox="0 0 960 420"
              role="img"
              data-active={active || undefined}
              aria-label={T.system.aria}
            >
              {wires.map(([id, d]) => <path key={id} id={id} className="wire" d={d} />)}
              {wires.map(([id, d]) => <path key={id + "h"} className="wire hot" d={d} />)}
              <g fill="#00A651">
                {dots.map(([id, dur, begin]) => (
                  <circle key={id} r="6">
                    <animateMotion dur={dur} begin={begin || undefined} repeatCount="indefinite">
                      <mpath href={"#" + id} />
                    </animateMotion>
                  </circle>
                ))}
              </g>
              <g className="comp cam">
                <use href="#im-bullet" transform="translate(28 40) scale(.43)" />
                <use href="#im-bullet" transform="translate(28 140) scale(.43)" />
                <use href="#im-dome" transform="translate(58 232) scale(.17)" />
                <use href="#im-bullet" transform="translate(28 340) scale(.43)" />
                <text className="tagm" x="40" y="30">{T.system.cams[0]}</text>
                <text className="tagm" x="40" y="130">{T.system.cams[1]}</text>
                <text className="tagm" x="40" y="228">{T.system.cams[2]}</text>
                <text className="tagm" x="40" y="330">{T.system.cams[3]}</text>
              </g>
              <g className="comp sw">
                <rect x="330" y="182" width="150" height="64" rx="10" fill="#10305E" />
                <g fill="#30D158"><circle cx="352" cy="200" r="4" /><circle cx="370" cy="200" r="4" /><circle cx="388" cy="200" r="4" /><circle cx="406" cy="200" r="4" /></g>
                <g fill="#24478C"><rect x="345" y="212" width="14" height="12" rx="2" /><rect x="363" y="212" width="14" height="12" rx="2" /><rect x="381" y="212" width="14" height="12" rx="2" /><rect x="399" y="212" width="14" height="12" rx="2" /><rect x="440" y="212" width="18" height="12" rx="2" /></g>
                <text x="440" y="204" fontFamily="ui-monospace,Menlo,monospace" fontSize="10" fill="#A9BCE0">PoE</text>
                <text className="lbl" x="405" y="272" textAnchor="middle">{T.system.sw}</text>
                <text className="sub" x="405" y="288" textAnchor="middle">{T.system.swSub}</text>
              </g>
              <g className="comp nvr">
                <use href="#im-nvr" transform="translate(553 197) scale(.285)" />
                <text className="lbl" x="635" y="272" textAnchor="middle">{T.system.nvr}</text>
                <text className="sub" x="635" y="288" textAnchor="middle">{T.system.nvrSub}</text>
              </g>
              <g className="comp view">
                <rect x="800" y="52" width="140" height="92" rx="8" fill="#0A1F44" />
                <g fill="#24478C"><rect x="808" y="60" width="60" height="36" rx="2" /><rect x="872" y="60" width="60" height="36" rx="2" /><rect x="808" y="100" width="60" height="36" rx="2" /><rect x="872" y="100" width="60" height="36" rx="2" /></g>
                <rect x="812" y="64" width="28" height="14" fill="none" stroke="#30D158" strokeWidth="2" />
                <rect x="860" y="144" width="20" height="14" fill="#B8C0CB" /><rect x="838" y="156" width="64" height="6" rx="3" fill="#B8C0CB" />
                <text className="lbl" x="870" y="186" textAnchor="middle">{T.system.monitor}</text>
                <path d="M770 330 a14 14 0 0 1 4-27 a18 18 0 0 1 34-4 a13 13 0 0 1 14 31z" fill="#E8F0FF" stroke="#1463FF" strokeWidth="2" />
                <text x="796" y="350" textAnchor="middle" className="tagm">{T.system.internet}</text>
                <rect x="880" y="280" width="48" height="84" rx="10" fill="#1D1D1F" />
                <rect x="884" y="288" width="40" height="68" rx="4" fill="#1463FF" />
                <rect x="888" y="296" width="32" height="20" rx="2" fill="#0A1F44" />
                <circle className="recdot" cx="914" cy="300" r="2.5" />
                <text className="lbl" x="904" y="386" textAnchor="middle">{T.system.phone}</text>
                <text className="sub" x="904" y="402" textAnchor="middle">{T.system.phoneSub}</text>
              </g>
            </svg>
          </div>
          <div className="legend">
            {LEGEND.map((l) => (
              <button
                key={l.k}
                type="button"
                className={`lg rv${active === l.k ? " on" : ""}`}
                data-k={l.k}
                onMouseEnter={() => setActive(l.k)}
                onFocus={() => setActive(l.k)}
                onMouseLeave={() => setActive(null)}
                onBlur={() => setActive(null)}
                onClick={() => setActive((cur) => (cur === l.k ? null : l.k))}
              >
                <span className="n">{l.n}</span>
                <b>{l.title}</b>
                <span>{l.text}</span>
                <em>{l.mod}</em>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
