"use client";
import { useEffect, useRef, useState } from "react";
import { useIsoLayoutEffect, motionAllowed, pad } from "../utils";
import { useCourseText } from "../i18n";

export default function Install() {
  const T = useCourseText();
  const secRef = useRef(null);
  const stageRef = useRef(null);
  const cableRef = useRef(null);
  const itemsRef = useRef([]);
  const [active, setActive] = useState(0);
  const [clock, setClock] = useState("02.11.2026 12:00:00");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(
        `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useIsoLayoutEffect(() => {
    const sec = secRef.current;
    const stage = stageRef.current;
    const items = itemsRef.current;
    try {
      stage.style.setProperty("--len", Math.ceil(cableRef.current.getTotalLength()));
    } catch (e) {}
    if (!motionAllowed()) return;

    const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const update = () => {
      const r = sec.getBoundingClientRect();
      const total = sec.offsetHeight - window.innerHeight;
      const p = clamp(-r.top / Math.max(1, total));
      const s = p * 5.6 - 0.15;
      let a = 0;
      for (let i = 1; i <= 5; i++) {
        const v = clamp(s - (i - 1));
        stage.style.setProperty("--p" + i, v.toFixed(3));
        if (items[i - 1]) items[i - 1].style.setProperty("--fill", v.toFixed(3));
        if (s > i - 1) a = i - 1;
      }
      setActive(a);
    };

    let ticking = false;
    let raf = 0;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      cancelAnimationFrame(raf);
    };
  }, []);

  const font = "-apple-system,Inter,sans-serif";

  return (
    <section className="install" id="practice" ref={secRef} style={{ marginTop: 110 }}>
      <div className="install-sticky">
        <div className="wrap install-grid">
          <div>
            <span className="eyebrow">{T.install.eyebrow}</span>
            <h2>{T.install.title}</h2>
            <ol className="steps-l" id="stepsL">
              {T.install.steps.map(([b, s], i) => (
                <li key={i} ref={(el) => (itemsRef.current[i] = el)} className={active === i ? "on" : undefined}>
                  <b>{b}</b>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="stage" id="stage" ref={stageRef}>
            <svg viewBox="0 0 1000 620" role="img" aria-label={T.install.aria}>
              <defs>
                <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1C4FB8" /><stop offset=".6" stopColor="#3C7BE8" /><stop offset="1" stopColor="#9CC2FF" /></linearGradient>
                <linearGradient id="wallG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#D9DEE6" /><stop offset=".85" stopColor="#EEF1F5" /><stop offset="1" stopColor="#C3CAD5" /></linearGradient>
                <linearGradient id="groundG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5E6B7E" /><stop offset="1" stopColor="#3A4556" /></linearGradient>
                <linearGradient id="fov" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#7FE0A8" stopOpacity=".6" /><stop offset="1" stopColor="#7FE0A8" stopOpacity="0" /></linearGradient>
                <linearGradient id="warm" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#FFF1C2" stopOpacity=".7" /><stop offset="1" stopColor="#FFF1C2" stopOpacity="0" /></linearGradient>
                <clipPath id="sceneClip"><rect width="1000" height="620" rx="24" /></clipPath>
              </defs>
              <g clipPath="url(#sceneClip)">
                <rect width="1000" height="620" fill="url(#sky)" />
                <g fill="#fff" opacity=".55">
                  <g className="cloud"><ellipse cx="200" cy="90" rx="70" ry="20" /><ellipse cx="240" cy="78" rx="44" ry="22" /></g>
                  <g className="cloud" style={{ animationDelay: "-18s" }}><ellipse cx="520" cy="140" rx="90" ry="18" /><ellipse cx="560" cy="128" rx="50" ry="20" /></g>
                </g>
                {/* двор и здание (отражены: стена справа, двор слева) */}
                <g transform="translate(1000 0) scale(-1 1)">
                  <g fill="#2E5FC4" opacity=".55"><rect x="560" y="250" width="90" height="230" /><rect x="660" y="200" width="70" height="280" /><rect x="740" y="270" width="110" height="210" /><rect x="860" y="230" width="80" height="250" /></g>
                  <g fill="#BFD6FF" opacity=".35"><rect x="676" y="220" width="12" height="16" /><rect x="700" y="220" width="12" height="16" /><rect x="676" y="250" width="12" height="16" /><rect x="760" y="290" width="14" height="16" /><rect x="790" y="290" width="14" height="16" /><rect x="880" y="250" width="12" height="16" /></g>
                  <path d="M0 470 H1000 V620 H0z" fill="url(#groundG)" />
                  <path d="M440 540 H1000" stroke="#fff" strokeOpacity=".35" strokeWidth="4" strokeDasharray="40 30" />
                  <g stroke="#2A3346" strokeWidth="5"><path d="M470 400 V470 M560 400 V470 M650 400 V470 M470 410 H650 M470 455 H650" /></g>
                  <g><rect x="934" y="380" width="10" height="90" fill="#3A2E25" /><circle cx="940" cy="370" r="38" fill="#00A651" /><circle cx="918" cy="390" r="26" fill="#00913F" /></g>
                  <g className="car"><g transform="translate(600 478)">
                    <path d="M0 40 q0 -18 18 -20 l30 -22 h76 l34 22 q30 2 30 20 v12 h-188z" fill="#F2F4F7" />
                    <path d="M54 4 h66 l24 16 h-104z" fill="#1E2B44" />
                    <circle cx="40" cy="54" r="14" fill="#151A22" /><circle cx="150" cy="54" r="14" fill="#151A22" />
                    <circle cx="40" cy="54" r="5" fill="#9AA3B2" /><circle cx="150" cy="54" r="5" fill="#9AA3B2" />
                    <rect x="176" y="28" width="10" height="6" rx="2" fill="#FFD166" />
                  </g></g>
                  <g className="walker"><g transform="translate(520 400)">
                    <circle cx="14" cy="8" r="8" fill="#F4D3B5" />
                    <rect x="4" y="17" width="20" height="32" rx="8" fill="#00A651" />
                    <g className="legs"><rect x="6" y="46" width="7" height="26" rx="3" fill="#1D2A44" /><rect x="15" y="46" width="7" height="26" rx="3" fill="#1D2A44" /></g>
                  </g></g>
                  <rect x="0" y="0" width="430" height="620" fill="url(#wallG)" />
                  <g stroke="#C9CFD9" strokeWidth="2"><path d="M0 120 H430 M0 260 H430 M0 400 H430 M140 0 V620 M290 0 V620" /></g>
                  <rect x="60" y="300" width="160" height="170" rx="6" fill="#9EB7DB" stroke="#C9CFD9" strokeWidth="8" />
                  <path d="M140 300 V470 M60 385 H220" stroke="#C9CFD9" strokeWidth="6" />
                  <rect x="424" y="0" width="10" height="620" fill="#B3BCC9" />
                </g>

                {/* ШАГ 1: монтажная коробка */}
                <g style={{ opacity: "var(--p1)", transform: "translateX(calc((1 - var(--p1)) * 60px))" }}>
                  <circle cx="650" cy="240" r="66" fill="#F4F6F9" stroke="#AEB7C3" strokeWidth="2" />
                  <circle cx="650" cy="240" r="48" fill="none" stroke="#D3D9E1" strokeWidth="2" />
                  <g fill="#8A94A3"><circle cx="650" cy="186" r="4" /><circle cx="650" cy="294" r="4" /><circle cx="596" cy="240" r="4" /><circle cx="704" cy="240" r="4" /></g>
                </g>
                {/* ШАГ 2 + 4: камера ColorVu */}
                <g
                  style={{
                    transformBox: "view-box",
                    transformOrigin: "650px 240px",
                    transform: "translateY(calc((1 - var(--p2)) * -280px)) rotate(calc((1 - var(--p4)) * -24deg))",
                    opacity: "calc(var(--p2) * 1.5)",
                  }}
                >
                  <path d="M432 237 L0 50 L0 470 Z" fill="url(#fov)" style={{ opacity: "var(--p4)" }} />
                  <path d="M431 279 L0 160 L0 520 Z" fill="url(#warm)" className="ir" style={{ opacity: "calc(var(--p5) * .9)" }} />
                  <use href="#im-colorvu" transform="translate(383 170) scale(.3908)" style={{ filter: "drop-shadow(0 14px 14px rgba(10,31,68,.35))" }} />
                  <circle cx="431" cy="279" r="6" fill="#FFF6D5" className="ir" style={{ opacity: "var(--p5)" }} />
                </g>
                {/* ШАГ 3: кабель к PoE-коммутатору */}
                <path
                  id="cable"
                  ref={cableRef}
                  d="M650 312 V 560 H 880"
                  fill="none"
                  stroke="#1D2A44"
                  strokeWidth="7"
                  strokeLinecap="round"
                  style={{ strokeDasharray: "var(--len,600)", strokeDashoffset: "calc(var(--len,600) * (1 - var(--p3)))" }}
                />
                <path d="M650 312 V 560 H 880" fill="none" stroke="#30D158" strokeWidth="3" className="flow" style={{ opacity: "var(--p5)" }} />
                <g style={{ opacity: "var(--p3)" }}>
                  <rect x="870" y="520" width="110" height="74" rx="10" fill="#0D1118" stroke="#2B3446" />
                  <g fill="#30D158"><circle cx="890" cy="540" r="4" /><circle cx="906" cy="540" r="4" /><circle cx="922" cy="540" r="4" className="blink" /></g>
                  <g fill="#2B3446"><rect x="884" y="554" width="16" height="12" rx="2" /><rect x="904" y="554" width="16" height="12" rx="2" /><rect x="924" y="554" width="16" height="12" rx="2" /><rect x="944" y="554" width="16" height="12" rx="2" /></g>
                  <text x="925" y="586" textAnchor="middle" fontFamily={font} fontSize="11" fontWeight="600" fill="#A9BCE0">{T.install.labels.poe}</text>
                </g>
                {/* подписи шагов */}
                <g fontFamily={font} fontSize="14" fontWeight="600">
                  <g style={{ opacity: "calc(var(--p1) - var(--p2) * .6)" }}><rect x="730" y="150" width="180" height="28" rx="14" fill="#fff" /><text x="820" y="169" textAnchor="middle" fill="#10305E">{T.install.labels.box}</text></g>
                  <g style={{ opacity: "calc(var(--p2) - var(--p3) * .6)" }}><rect x="300" y="100" width="210" height="28" rx="14" fill="#fff" /><text x="405" y="119" textAnchor="middle" fill="#10305E">{T.install.labels.camera}</text></g>
                  <g style={{ opacity: "calc(var(--p3) - var(--p4) * .6)" }}><rect x="670" y="420" width="170" height="28" rx="14" fill="#fff" /><text x="755" y="439" textAnchor="middle" fill="#10305E">{T.install.labels.cable}</text></g>
                  <g style={{ opacity: "calc(var(--p4) - var(--p5) * .6)" }}><rect x="60" y="120" width="190" height="28" rx="14" fill="#00A651" /><text x="155" y="139" textAnchor="middle" fill="#fff">{T.install.labels.fov}</text></g>
                </g>
              </g>
            </svg>

            {/* ШАГ 5: изображение с камеры */}
            <div className="feed" aria-hidden="true">
              <div className="feed-top"><span><i></i>{T.install.feedCam}</span><span style={{ color: "#FF5A5F" }}>● REC</span></div>
              <svg viewBox="0 0 320 180">
                <rect width="320" height="180" fill="#2A3B5E" />
                <g fill="#3E5688"><rect x="20" y="40" width="50" height="90" /><rect x="80" y="20" width="40" height="110" /><rect x="200" y="50" width="70" height="80" /></g>
                <path d="M0 130 H320 V180 H0z" fill="#46526A" />
                <g className="car" style={{ animationDuration: "8s" }}>
                  <g transform="translate(20 116) scale(.45)"><path d="M0 40 q0 -18 18 -20 l30 -22 h76 l34 22 q30 2 30 20 v12 h-188z" fill="#E8ECF2" /><circle cx="40" cy="54" r="14" fill="#151A22" /><circle cx="150" cy="54" r="14" fill="#151A22" /></g>
                  <g transform="translate(14 104)"><rect width="96" height="44" fill="none" stroke="#30D158" strokeWidth="2" /><rect y="-14" width="70" height="14" fill="#30D158" /><text x="4" y="-3" fontFamily={font} fontSize="10" fontWeight="700" fill="#05210F">{T.install.car}</text></g>
                </g>
                <text x="312" y="172" textAnchor="end" fontFamily="ui-monospace,Menlo,monospace" fontSize="10" fill="#fff">{clock}</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
