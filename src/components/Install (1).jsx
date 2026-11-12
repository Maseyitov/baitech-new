"use client";
import { useEffect, useState } from "react";
import { useCourseText } from "../i18n";

export default function Header() {
  const T = useCourseText();
  const LINKS = T.nav.links;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // Закрытие меню по Escape и при переходе на широкий экран
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 981px)");
    const onMq = (e) => e.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  // Подсветка пункта меню того раздела, который сейчас на экране
  const [active, setActive] = useState("");
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const sections = LINKS.map(([href]) => document.querySelector(href)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive("#" + e.target.id));
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const close = () => setOpen(false);

  return (
    <header className={`head${scrolled ? " scrolled" : ""}${open ? " menu-open" : ""}`} id="head">
      <div className="wrap">
        <button
          type="button"
          className="burger"
          aria-label={open ? T.nav.close : T.nav.open}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className="menu" aria-label={T.nav.label}>
          {LINKS.map(([href, text]) => (
            <a key={href} href={href} className={active === href ? "active" : undefined}>{text}</a>
          ))}
        </nav>
        <a className="btn btn-brand" href="#apply" onClick={close}>{T.nav.cta}</a>
      </div>

      {/* Выпадающее меню для телефона */}
      <nav id="mobile-menu" className="m-menu" aria-label={T.nav.label} hidden={!open}>
        {LINKS.map(([href, text]) => (
          <a key={href} href={href} onClick={close} className={active === href ? "active" : undefined}>{text}</a>
        ))}
      </nav>
    </header>
  );
}
