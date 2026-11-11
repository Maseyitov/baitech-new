"use client";
import { conePath } from "../utils";
import { useCourseText } from "../i18n";

export default function FloorPlan() {
  const T = useCourseText();
  return (
    <section className="grey" id="design">
      <div className="wrap plan-wrap">
        <div className="plan-text rv">
          <span className="eyebrow" style={{ margin: 0 }}>{T.plan.eyebrow}</span>
          <h2>{T.plan.title}</h2>
          <p>{T.plan.text}</p>
          <ul className="checks">
            {T.plan.checks.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
        <div className="plan-card rv rv-zoom">
          <svg className="plan" id="plan" viewBox="0 0 640 430" role="img" aria-label={T.plan.aria}>
            <defs>
              <clipPath id="r-sklad"><rect x="20" y="40" width="220" height="200" /></clipPath>
              <clipPath id="r-ofis"><rect x="240" y="40" width="220" height="200" /></clipPath>
              <clipPath id="r-serv"><rect x="460" y="40" width="160" height="120" /></clipPath>
              <clipPath id="r-kor"><rect x="20" y="240" width="600" height="60" /></clipPath>
              <clipPath id="r-res"><rect x="20" y="300" width="300" height="100" /></clipPath>
            </defs>
            <g clipPath="url(#r-sklad)"><g transform="translate(130 140)"><g className="ptz"><path className="cone" d={conePath(0, 70, 140)} style={{ transitionDelay: "0s" }} /></g></g></g>
            <g clipPath="url(#r-ofis)"><g transform="translate(452 48)"><path className="cone" d={conePath(135, 100, 260)} style={{ transitionDelay: ".25s" }} /></g></g>
            <g clipPath="url(#r-serv)"><g transform="translate(612 48)"><path className="cone" d={conePath(140, 90, 180)} style={{ transitionDelay: ".5s" }} /></g></g>
            <g clipPath="url(#r-kor)"><g transform="translate(28 270)"><path className="cone" d={conePath(0, 22, 620)} style={{ transitionDelay: ".75s" }} /></g></g>
            <g clipPath="url(#r-res)"><g transform="translate(312 308)"><path className="cone" d={conePath(145, 100, 300)} style={{ transitionDelay: "1s" }} /></g></g>
            <rect className="wall" x="20" y="40" width="600" height="360" />
            <path className="iwall" d="M240 40 V200 M240 228 V240 M20 240 H90 M120 240 H300 M330 240 H520 M550 240 H620 M460 40 V120 M460 148 V240 M460 160 H620 M20 300 H140 M170 300 H420 M450 300 H620 M320 300 V400" />
            <path d="M120 400 H190" stroke="var(--surface)" strokeWidth="7" />
            <path d="M120 400 A70 70 0 0 1 190 330" fill="none" stroke="var(--muted)" strokeWidth="1" strokeDasharray="3 3" />
            <text className="room" x="40" y="70">{T.plan.rooms.storage}</text>
            <text className="room" x="260" y="70">{T.plan.rooms.office}</text>
            <text className="room" x="474" y="70">{T.plan.rooms.server}</text>
            <text className="room" x="474" y="186">{T.plan.rooms.meeting}</text>
            <text className="room" x="250" y="276">{T.plan.rooms.corridor}</text>
            <text className="room" x="40" y="330">{T.plan.rooms.reception}</text>
            <text className="room" x="340" y="330">{T.plan.rooms.kitchen}</text>
            <text className="room" x="140" y="420">{T.plan.rooms.entrance}</text>
            <path className="dimline" d="M20 22 H620 M20 16 V28 M620 16 V28" />
            <rect x="290" y="12" width="60" height="18" fill="var(--surface)" />
            <text className="dim" x="320" y="25" textAnchor="middle">{T.plan.dims.total}</text>
            <circle className="camdot" cx="130" cy="140" r="8" style={{ fill: "var(--surface)", stroke: "var(--blue)", strokeWidth: 3 }} />
            <circle className="camdot" cx="452" cy="48" r="7" />
            <circle className="camdot" cx="612" cy="48" r="7" />
            <circle className="camdot" cx="28" cy="270" r="7" />
            <circle className="camdot" cx="312" cy="308" r="7" />
            <text className="dim" x="146" y="160">PTZ</text>
            <text className="dim" x="404" y="78">{T.plan.dims.lens1}</text>
            <text className="dim" x="44" y="292">{T.plan.dims.lens2}</text>
          </svg>
          <div className="plan-legend">
            <span><i></i>{T.plan.legend[0]}</span>
            <span><i className="r"></i>{T.plan.legend[1]}</span>
            <span>{T.plan.legend[2]}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
