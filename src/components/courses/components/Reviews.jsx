"use client";
import { useCourseText } from "../i18n";

export default function Reviews() {
  const T = useCourseText();
  return (
    <section id="reviews">
      <div className="wrap">
        <div className="head-c rv rv-blur"><span className="eyebrow">{T.reviews.eyebrow}</span><h2>{T.reviews.title}</h2></div>
        <div className="revs">
          {T.reviews.items.map((r, i) => (
            <figure className="rev rv" key={i}>
              <span className="stars">★★★★★</span>
              <blockquote>{r.text}</blockquote>
              <figcaption><span className="ava">{r.a}</span><span><b>{r.name}</b><span>{r.role}</span></span></figcaption>
            </figure>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 32 }}>
          <a className="btn btn-ghost" href="https://www.youtube.com/@baitech-1565" target="_blank" rel="noopener noreferrer">{T.reviews.youtube}</a>
        </p>
      </div>
    </section>
  );
}
