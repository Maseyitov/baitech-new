"use client";
import { useCourseText } from "../i18n";

export default function PathSection() {
  const T = useCourseText();
  return (
    <section className="grey" id="path">
      <div className="wrap">
        <div className="head-c rv rv-blur"><span className="eyebrow">{T.path.eyebrow}</span><h2>{T.path.title}</h2></div>
        <div className="path-steps rv" id="steps">
          {T.path.steps.map(([h, p], i) => (
            <div className="ps" key={i}><span className="n">{i + 1}</span><h3>{h}</h3><p>{p}</p></div>
          ))}
        </div>
        <div className="fr" id="format" style={{ marginTop: 72 }}>
          <div className="box rv">
            <h3>{T.path.formatTitle}</h3>
            <ul>
              {T.path.format.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </div>
          <div className="box dark rv">
            <h3>{T.path.getTitle}</h3>
            <ul>
              {T.path.get.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
