"use client";
import { useEffect, useRef } from "react";
import { Inter } from "next/font/google";
import "./styles/index.scss";

import { motionAllowed } from "./utils";
import SvgDefs from "./components/SvgDefs";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import Install from "./components/Install";
import SystemScheme from "./components/SystemScheme";
import FloorPlan from "./components/FloorPlan";
import Program from "./components/Program";
import PathSection from "./components/PathSection";
import Reviews from "./components/Reviews";
import FaqApply from "./components/FaqApply";

// Шрифт Inter, как в прототипе. Подключается через Next.js — надёжнее, чем ссылка на Google Fonts в CSS
const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

export default function CoursesPage() {
  const rootRef = useRef(null);

  // Появление при прокрутке, счётчики, запуск плана и траектории
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (!motionAllowed()) {
      root.querySelectorAll("svg").forEach((s) => {
        try { s.pauseAnimations(); } catch (e) {}
      });
      return;
    }
    if (!("IntersectionObserver" in window)) return;

    const countUp = (el) => {
      const to = +el.dataset.to;
      const suf = el.dataset.suf || "";
      const dur = 1500;
      let t0 = null;
      const step = (t) => {
        if (!t0) t0 = t;
        let k = Math.min(1, (t - t0) / dur);
        k = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(to * k) + suf;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const vh = window.innerHeight;
    root.querySelectorAll(".rv").forEach((el) => {
      if (el.getBoundingClientRect().top > vh * 0.92) {
        el.classList.add("rv-pre");
        const idx = Array.prototype.indexOf.call(el.parentElement.children, el);
        el.style.transitionDelay = Math.min(idx, 6) * 0.09 + "s";
      }
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          io.unobserve(el);
          el.classList.remove("rv-pre");
          if (el.id === "plan" || el.id === "steps") el.classList.add("rv-go");
          if (el.id === "stats") el.querySelectorAll("[data-to]").forEach(countUp);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
    );
    root.querySelectorAll(".rv,#plan,#steps,#stats").forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      root.querySelectorAll(".rv-pre").forEach((el) => el.classList.remove("rv-pre"));
    };
  }, []);

  return (
    <div className="bt-course" ref={rootRef} style={{ "--font-inter": inter.style.fontFamily }}>
      <SvgDefs />
      <Header />
      <main id="top">
        <Hero />
        <Stats />
        <Install />
        <SystemScheme />
        <FloorPlan />
        <Program />
        <PathSection />
        <Reviews />
        <FaqApply />
      </main>
    </div>
  );
}
