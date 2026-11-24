"use client";
import { useCourseText } from "../i18n";
import Watermark from "./Watermark";
import azamat from "../img/Azamat.png";
import eldar from "../img/Eldar.png";
import kairat from "../img/Kairat.png";
import alex from "../img/Alex.png";

// Фото выпускников — в том же порядке, что и отзывы: Азамат, Эльдар, Кайрат, Алекс
const PHOTOS = [azamat, eldar, kairat, alex];

export default function Reviews() {
  const T = useCourseText();
  return (
    <section className="wm-host" id="reviews">
      <Watermark area="reviews" />
      <div className="wrap">
        <div className="head-c rv rv-blur">
          <span className="eyebrow">{T.reviews.eyebrow}</span>
          <h2>{T.reviews.title}</h2>
        </div>
        <div className="revs">
          {T.reviews.items.map((r, i) => {
            const photo = PHOTOS[i];
            return (
              <figure className="rev rv" key={i}>
                <span className="stars">★★★★★</span>
                <blockquote>{r.text}</blockquote>
                <figcaption>
                  <span
                    className="ava"
                    style={
                      photo
                        ? { overflow: "hidden", background: "var(--bg-2)" }
                        : undefined
                    }
                  >
                    {photo ? (
                      <img
                        src={photo.src}
                        alt={r.name}
                        width={44}
                        height={44}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      r.a
                    )}
                  </span>
                  <span>
                    <b>{r.name}</b>
                    <span>{r.role}</span>
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
        <p style={{ textAlign: "center", marginTop: 32 }}>
          <a
            className="btn btn-ghost"
            href="https://www.youtube.com/@baitech-1565"
            target="_blank"
            rel="noopener noreferrer"
          >
            {T.reviews.youtube}
          </a>
        </p>
      </div>
    </section>
  );
}
