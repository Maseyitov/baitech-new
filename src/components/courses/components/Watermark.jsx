"use client";
import { useEffect, useMemo, useRef } from "react";
import { WATERMARK as W } from "../watermark.config";

/* =====================================================================
   ЛОГОТИПЫ В НЕВЕСОМОСТИ.
   Логотипы летают по блоку, сталкиваются, отскакивают от текста и стенок.
   Мышкой: поймать (остановить), перетащить, бросить; рядом с курсором — разбегаются.
   Двойной клик по пустому месту — все слетаются к курсору, ещё раз — разлетаются.
   Все настройки — в watermark.config.js.
   ===================================================================== */

const CSS = `
.bt-wm-logo { position: absolute; left: 0; top: 0; pointer-events: auto; touch-action: none; cursor: grab;
  will-change: transform; opacity: 0; transition: opacity .35s ease, filter .2s ease; user-select: none; -webkit-user-select: none; }
.bt-wm-logo img { display: block; width: 100%; height: auto; max-width: none; pointer-events: none; -webkit-user-drag: none; }
.bt-wm-logo.is-live { opacity: 1; }
.bt-wm-logo.is-live.is-clone { opacity: var(--wm-clone-opacity, .5); }
.bt-wm-logo.is-drag { cursor: grabbing; filter: drop-shadow(0 14px 18px rgba(10, 31, 68, .28)); }
`;

const TEXTY = "h1, h2, h3, h4, p, .eyebrow, blockquote";

const srcOf = (logo) => (logo && typeof logo === "object" ? logo.src : logo);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const hashStr = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
// Предсказуемый «случайный» генератор — чтобы сервер и браузер нарисовали одно и то же
const seeded = (seed) => {
  let s = seed || 1;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
};

export default function Watermark({ area }) {
  const layerRef = useRef(null);
  const nodesRef = useRef([]);

  const logos = (W.logos || []).map(srcOf).filter(Boolean);
  const on =
    W.enabled &&
    logos.length > 0 &&
    !(area && W.showOn && W.showOn[area] === false);

  const items = useMemo(() => {
    if (!on) return [];
    const rnd = seeded(hashStr(area || "wm"));
    const min = W.sizeMin ?? 34;
    const max = Math.max(min, W.sizeMax ?? 64);
    const total = logos.length * (W.perLogo ?? 6);
    return Array.from({ length: total }, (_, i) => ({
      src: logos[i % logos.length],
      size: Math.round(min + rnd() * (max - min)),
      depth: 0,
    })).map((it) => ({
      ...it,
      depth: max === min ? 1 : (it.size - min) / (max - min),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, area]);

  useEffect(() => {
    if (!on || !layerRef.current) return;
    return startSpace(layerRef.current, nodesRef.current, items, logos.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, items]);

  if (!on) return null;

  return (
    <div
      ref={layerRef}
      className="bt-space"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 3,
        overflow: "hidden",
        pointerEvents: "none",
        "--wm-clone-opacity": W.cloneOpacity ?? 0.5,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {items.map((it, i) => (
        <div
          key={i}
          ref={(el) => (nodesRef.current[i] = el)}
          className="bt-wm-logo"
          style={{ width: it.size, zIndex: it.size }}
        >
          <img src={it.src} alt="" draggable={false} />
        </div>
      ))}
    </div>
  );
}

/* ----------------------------- ФИЗИКА ----------------------------- */
function startSpace(layer, nodes, specs, logoCount) {
  const host = layer.parentElement;
  if (getComputedStyle(host).position === "static")
    host.style.position = "relative";
  host.style.isolation = "isolate";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.matchMedia("(max-width: 720px)").matches;
  const activeCount = mobile
    ? Math.min(specs.length, logoCount * (W.perLogoMobile ?? 4))
    : specs.length;
  const sizeK = mobile ? 0.85 : 1;

  const SPEED = reduce ? 0 : (W.speed ?? 35);
  const SPIN = reduce ? 0 : (W.spin ?? 25);
  const FR = Math.max(0.2, W.friction ?? 1.6);
  const E = clamp(W.bounce ?? 0.85, 0, 1);
  const THROW = W.throwPower ?? 1.1;
  const MAXV = 2800;
  const rand = Math.random;

  let width = 0;
  let height = 0;
  let obstacles = [];
  let gathered = false;
  let gx = 0;
  let gy = 0;
  const ptr = { cx: 0, cy: 0, has: false };

  /* --- тела --- */
  const bodies = [];
  const cleanups = [];
  const cloneNodes = [];
  const CLONE_ON = W.cloneOnGrab !== false;
  const CLONE_MAX = Math.max(0, W.cloneMax ?? 3);

  const makeBody = (el, w, depth, isClone) => {
    const b = {
      el,
      w,
      h: w,
      r: w / 2,
      clone: isClone,
      clones: 0,
      x: -999,
      y: -999,
      vx: 0,
      vy: 0,
      a: rand() * 40 - 20,
      spin0: (rand() < 0.5 ? -1 : 1) * SPIN * (0.4 + rand() * 0.6),
      va: 0,
      cruise: SPEED * (0.55 + 0.7 * depth) * (0.8 + rand() * 0.4),
      depth,
      m: w * w,
      drag: false,
      live: false,
      entering: false,
      liveAt: 0,
      enterUntil: 0,
      sc: 1,
      rx: 0,
      ry: 0,
      dvx: 0,
      dvy: 0,
    };
    b.va = b.spin0;
    el.style.width = w + "px";
    const img = el.querySelector("img");
    const setAspect = () => {
      if (!img || !img.naturalWidth) return;
      b.h = (b.w * img.naturalHeight) / img.naturalWidth;
      b.r = (Math.max(b.w, b.h) / 2) * 0.92;
    };
    if (img && img.complete) setAspect();
    else if (img) img.addEventListener("load", setAspect, { once: true });

    /* --- поймать / тащить / бросить --- */
    const down = (e) => {
      if (e.button > 0) return;
      e.preventDefault();
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
      const hr = host.getBoundingClientRect();
      b.drag = true;
      b.ox = e.clientX - hr.left - b.x;
      b.oy = e.clientY - hr.top - b.y;
      b.px = e.clientX;
      b.py = e.clientY;
      b.lt = performance.now();
      b.dvx = b.dvy = 0;
      b.vx = b.vy = 0;
      b.va *= 0.2;
      gathered = false;
      el.classList.add("is-drag");
      if (!b.live) {
        b.live = true;
        el.classList.add("is-live");
      }
      b.entering = false;
      // поймал оригинал — от него «отлетает» копия
      if (CLONE_ON && !b.clone && b.clones < CLONE_MAX) {
        b.clones++;
        spawnClone(b);
      }
    };
    const move = (e) => {
      if (!b.drag) return;
      const now = performance.now();
      const dt = Math.max(1, now - b.lt) / 1000;
      const k = clamp(dt * 14, 0.15, 1);
      b.dvx = b.dvx * (1 - k) + ((e.clientX - b.px) / dt) * k;
      b.dvy = b.dvy * (1 - k) + ((e.clientY - b.py) / dt) * k;
      b.px = e.clientX;
      b.py = e.clientY;
      b.lt = now;
    };
    const up = () => {
      if (!b.drag) return;
      b.drag = false;
      el.classList.remove("is-drag");
      const still = performance.now() - b.lt > 90; // держал на месте — значит остановил
      b.vx = still ? 0 : clamp(b.dvx * THROW, -MAXV, MAXV);
      b.vy = still ? 0 : clamp(b.dvy * THROW, -MAXV, MAXV);
      b.va = b.spin0 + clamp(b.vx * 0.12, -720, 720);
      if (still) b.calm = performance.now() + 900; // немного «повисит» после остановки
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("lostpointercapture", up);
    cleanups.push(() => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("lostpointercapture", up);
    });
    bodies.push(b);
    return b;
  };

  // Копия логотипа: появляется на месте пойманного и отлетает в случайную сторону
  const spawnClone = (src) => {
    const el = src.el.cloneNode(true);
    el.classList.remove("is-drag", "is-live");
    el.classList.add("is-clone");
    el.style.zIndex = String(Math.round(src.w) - 1);
    layer.appendChild(el);
    cloneNodes.push(el);
    const c = makeBody(el, src.w, src.depth, true);
    c.h = src.h;
    c.r = src.r;
    c.x = src.x;
    c.y = src.y;
    c.a = src.a;
    const ang = rand() * Math.PI * 2;
    const sp = 700 + rand() * 600;
    c.vx = Math.cos(ang) * sp;
    c.vy = Math.sin(ang) * sp;
    c.va = (rand() < 0.5 ? -1 : 1) * (400 + rand() * 400);
    c.sc = 0.3; // «выпрыгивает» из оригинала
    c.live = true;
    c.noHitUntil = performance.now() + 120; // не сталкивается с оригиналом в момент появления
    c.parent = src;
    requestAnimationFrame(() => el.classList.add("is-live"));
  };

  specs.forEach((s, i) => {
    const el = nodes[i];
    if (!el) return;
    el.classList.remove("is-live", "is-drag"); // сброс (React в режиме разработки запускает эффект дважды)
    el.style.display = "";
    if (i >= activeCount) {
      el.style.display = "none";
      return;
    }
    makeBody(el, s.size * sizeK, s.depth, false);
  });

  /* --- «твёрдые» места: текст, кнопки, карточки --- */
  const measure = () => {
    const hr = host.getBoundingClientRect();
    width = hr.width;
    height = hr.height;
    const list = [];
    if (W.avoidText !== false && W.avoid) {
      host.querySelectorAll(W.avoid).forEach((el) => {
        if (layer.contains(el)) return;
        let r;
        if (el.matches(TEXTY)) {
          const range = document.createRange();
          range.selectNodeContents(el);
          r = range.getBoundingClientRect();
        } else r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        const p = 6;
        list.push({
          l: r.left - hr.left - p,
          t: r.top - hr.top - p,
          r: r.right - hr.left + p,
          b: r.bottom - hr.top + p,
        });
      });
    }
    obstacles = list;
  };

  const overlapsRect = (x, y, r, o) => {
    const cx = clamp(x, o.l, o.r);
    const cy = clamp(y, o.t, o.b);
    return (x - cx) ** 2 + (y - cy) ** 2 < r * r;
  };

  // Случайное свободное место (не на тексте и не на другом логотипе)
  const placeRandom = (b, placed) => {
    for (let k = 0; k < 400; k++) {
      const x = b.r + rand() * Math.max(1, width - 2 * b.r);
      const y = b.r + rand() * Math.max(1, height - 2 * b.r);
      if (obstacles.some((o) => overlapsRect(x, y, b.r + 10, o))) continue;
      if (placed.some((q) => Math.hypot(q.x - x, q.y - y) < q.r + b.r + 18))
        continue;
      return { x, y };
    }
    return {
      x: b.r + rand() * Math.max(1, width - 2 * b.r),
      y: b.r + rand() * Math.max(1, height - 2 * b.r),
    };
  };

  /* --- появление: вылетают из-за краёв блока --- */
  const launch = () => {
    measure();
    const placed = [];
    const now = performance.now();
    bodies.forEach((b, i) => {
      const t = placeRandom(b, placed);
      placed.push({ x: t.x, y: t.y, r: b.r });
      if (reduce) {
        b.x = t.x;
        b.y = t.y;
        b.live = true;
        b.el.classList.add("is-live");
        return;
      }
      // старт за ближайшим краем
      const dl = t.x,
        dr = width - t.x,
        dtp = t.y,
        db = height - t.y;
      const m = Math.min(dl, dr, dtp, db);
      let sx = t.x,
        sy = t.y;
      const out = b.r + 30;
      if (m === dl) sx = -out;
      else if (m === dr) sx = width + out;
      else if (m === dtp) sy = -out;
      else sy = height + out;
      sx += (rand() - 0.5) * 160;
      sy += (rand() - 0.5) * 160;
      const dx = t.x - sx,
        dy = t.y - sy;
      const dist = Math.hypot(dx, dy) || 1;
      const sp = dist * FR + b.cruise;
      b.x = sx;
      b.y = sy;
      b.vx = (dx / dist) * sp;
      b.vy = (dy / dist) * sp;
      b.va = b.spin0 + (rand() - 0.5) * 360;
      b.entering = true;
      b.liveAt = now + i * 70;
      b.enterUntil = b.liveAt + 2500;
    });
  };

  /* --- столкновения --- */
  const hitObstacle = (b, o) => {
    const cx = clamp(b.x, o.l, o.r);
    const cy = clamp(b.y, o.t, o.b);
    let dx = b.x - cx,
      dy = b.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 >= b.r * b.r) return;
    let nx, ny, pen;
    if (d2 === 0) {
      const dl = b.x - o.l,
        dr = o.r - b.x,
        dt = b.y - o.t,
        db = o.b - b.y;
      const m = Math.min(dl, dr, dt, db);
      if (m === dl) {
        nx = -1;
        ny = 0;
        pen = dl + b.r;
      } else if (m === dr) {
        nx = 1;
        ny = 0;
        pen = dr + b.r;
      } else if (m === dt) {
        nx = 0;
        ny = -1;
        pen = dt + b.r;
      } else {
        nx = 0;
        ny = 1;
        pen = db + b.r;
      }
    } else {
      const d = Math.sqrt(d2);
      nx = dx / d;
      ny = dy / d;
      pen = b.r - d;
    }
    b.x += nx * pen;
    b.y += ny * pen;
    if (b.drag) return;
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) {
      b.vx -= (1 + E) * vn * nx;
      b.vy -= (1 + E) * vn * ny;
      b.va += (b.vx * ny - b.vy * nx) * 0.05;
    }
  };

  const hitWalls = (b) => {
    if (b.x < b.r) {
      b.x = b.r;
      if (b.vx < 0) b.vx = -b.vx * E;
    } else if (b.x > width - b.r) {
      b.x = width - b.r;
      if (b.vx > 0) b.vx = -b.vx * E;
    }
    if (b.y < b.r) {
      b.y = b.r;
      if (b.vy < 0) b.vy = -b.vy * E;
    } else if (b.y > height - b.r) {
      b.y = height - b.r;
      if (b.vy > 0) b.vy = -b.vy * E;
    }
  };

  const collidePair = (p, q) => {
    const dx = q.x - p.x,
      dy = q.y - p.y;
    const min = p.r + q.r;
    const d2 = dx * dx + dy * dy;
    if (d2 >= min * min || d2 === 0) return;
    const t = performance.now();
    if (
      (p.parent === q && t < p.noHitUntil) ||
      (q.parent === p && t < q.noHitUntil)
    )
      return;
    const d = Math.sqrt(d2);
    const nx = dx / d,
      ny = dy / d;
    const ip = p.drag ? 0 : 1 / p.m;
    const iq = q.drag ? 0 : 1 / q.m;
    const sum = ip + iq;
    if (sum === 0) return;
    const pen = min - d;
    p.x -= nx * pen * (ip / sum);
    p.y -= ny * pen * (ip / sum);
    q.x += nx * pen * (iq / sum);
    q.y += ny * pen * (iq / sum);
    const rv = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
    if (rv >= 0) return;
    const j = (-(1 + E) * rv) / sum;
    p.vx -= j * ip * nx;
    p.vy -= j * ip * ny;
    q.vx += j * iq * nx;
    q.vy += j * iq * ny;
    p.va -= rv * 0.08;
    q.va += rv * 0.08;
  };

  /* --- один кадр --- */
  const step = (dt, now) => {
    const hr = host.getBoundingClientRect();
    width = hr.width;
    height = hr.height;
    const px = ptr.cx - hr.left;
    const py = ptr.cy - hr.top;
    const inside = ptr.has && px >= 0 && py >= 0 && px <= width && py <= height;
    if (gathered && inside) {
      gx = px;
      gy = py;
    }
    const anyDrag = bodies.some((b) => b.drag);
    const RR = W.repelRadius ?? 110;
    const RF = (W.repelForce ?? 1) * 2600;

    for (const b of bodies) {
      if (!b.live) {
        if (b.liveAt && now >= b.liveAt) {
          b.live = true;
          b.el.classList.add("is-live");
        } else continue;
      }
      if (b.drag) {
        b.x = b.px - hr.left - b.ox;
        b.y = b.py - hr.top - b.oy;
        b.vx = b.dvx;
        b.vy = b.dvy;
        continue;
      }
      if (gathered) {
        // все летят к курсору как рой
        b.vx += ((gx - b.x) * 7 - b.vx * 2.6) * dt;
        b.vy += ((gy - b.y) * 7 - b.vy * 2.6) * dt;
      } else {
        // спокойный полёт: после броска плавно тормозит до «космической» скорости
        let s = Math.hypot(b.vx, b.vy);
        const c = b.calm && now < b.calm ? 0 : b.cruise;
        if (s > c) {
          const ns = c + (s - c) * Math.exp(-FR * dt);
          b.vx *= ns / s;
          b.vy *= ns / s;
        } else if (c > 0) {
          if (s < 0.5) {
            const ang = rand() * Math.PI * 2;
            b.vx = Math.cos(ang) * 0.5;
            b.vy = Math.sin(ang) * 0.5;
            s = 0.5;
          }
          const ns = s + (c - s) * Math.min(1, dt * 0.9);
          b.vx *= ns / s;
          b.vy *= ns / s;
        }
        // разбегаются от курсора
        if (W.mouseRepel !== false && inside && !anyDrag && !b.entering) {
          const dx = b.x - px,
            dy = b.y - py;
          const d = Math.hypot(dx, dy);
          const R = RR + b.r;
          if (d < R && d > 0.01) {
            const f = 1 - d / R;
            b.vx += (dx / d) * RF * f * f * dt;
            b.vy += (dy / d) * RF * f * f * dt;
          }
        }
      }
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > MAXV) {
        b.vx *= MAXV / sp;
        b.vy *= MAXV / sp;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.va = b.spin0 + (b.va - b.spin0) * Math.exp(-1.2 * dt);
      b.a += b.va * dt;

      if (b.entering) {
        const inBox =
          b.x > b.r && b.x < width - b.r && b.y > b.r && b.y < height - b.r;
        if (inBox || now > b.enterUntil) b.entering = false;
      }
    }

    // столкновения друг с другом
    if (W.collide !== false) {
      for (let i = 0; i < bodies.length; i++) {
        const p = bodies[i];
        if (!p.live || p.entering) continue;
        for (let j = i + 1; j < bodies.length; j++) {
          const q = bodies[j];
          if (q.live && !q.entering) collidePair(p, q);
        }
      }
    }
    // стенки и текст
    for (const b of bodies) {
      if (!b.live || b.entering) continue;
      if (!gathered) for (const o of obstacles) hitObstacle(b, o); // рой летит за курсором прямо над текстом
      hitWalls(b);
    }

    // отрисовка: поворот к курсору в 3D, увеличение при наведении
    for (const b of bodies) {
      if (!b.live && !b.entering) continue;
      let ts = 1,
        trx = 0,
        tryy = 0;
      if (b.drag) ts = 1.25;
      else if (inside) {
        const dx = px - b.x,
          dy = py - b.y;
        const d = Math.hypot(dx, dy);
        const R = 170;
        if (d < R) {
          const k = 1 - d / R;
          tryy = (dx / R) * 40 * k;
          trx = (-dy / R) * 40 * k;
          ts = 1 + 0.18 * k * k;
        }
      }
      const l = Math.min(1, dt * 10);
      b.sc += (ts - b.sc) * l;
      b.rx += (trx - b.rx) * l;
      b.ry += (tryy - b.ry) * l;
      b.el.style.transform =
        `translate3d(${(b.x - b.w / 2).toFixed(1)}px, ${(b.y - b.h / 2).toFixed(1)}px, 0) ` +
        `perspective(500px) rotateX(${b.rx.toFixed(1)}deg) rotateY(${b.ry.toFixed(1)}deg) ` +
        `rotate(${b.a.toFixed(1)}deg) scale(${b.sc.toFixed(3)})`;
    }
  };

  /* --- курсор и двойной клик --- */
  const onPointer = (e) => {
    ptr.cx = e.clientX;
    ptr.cy = e.clientY;
    ptr.has = true;
  };
  const onPointerEnd = (e) => {
    if (e.pointerType !== "mouse") ptr.has = false;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("pointerdown", onPointer, { passive: true });
  window.addEventListener("pointerup", onPointerEnd, { passive: true });

  const onDbl = (e) => {
    if (W.gatherOnDoubleClick === false) return;
    const t = e.target;
    if (!(t instanceof Element) || layer.contains(t)) return;
    if (t.closest("a, button, input, select, textarea, label, summary")) return;
    if ([...t.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
      return; // двойной клик по тексту — не трогаем
    const hr = host.getBoundingClientRect();
    const x = e.clientX - hr.left,
      y = e.clientY - hr.top;
    window.getSelection()?.removeAllRanges();
    if (gathered) {
      gathered = false;
      for (const b of bodies) {
        const dx = b.x - x,
          dy = b.y - y;
        const d = Math.hypot(dx, dy) || 1;
        const sp = 900 + rand() * 900;
        b.vx = (dx / d) * sp;
        b.vy = (dy / d) * sp;
        b.va = b.spin0 + (rand() - 0.5) * 900;
      }
    } else {
      gathered = true;
      gx = x;
      gy = y;
    }
  };
  host.addEventListener("dblclick", onDbl);

  /* --- запуск только когда блок виден --- */
  let raf = 0,
    last = 0,
    visible = false,
    launched = false;
  const loop = (t) => {
    const dt = Math.min(0.033, Math.max(0.001, (t - last) / 1000));
    last = t;
    step(dt, performance.now());
    raf = requestAnimationFrame(loop);
  };
  const start = () => {
    if (raf || document.hidden || !visible || !launched) return;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const runIO = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    visible ? start() : stop();
  });
  runIO.observe(host);
  // «вылет» начинается, когда блок дошёл до середины экрана
  const launchIO = new IntersectionObserver(
    ([en]) => {
      if (!en.isIntersecting || launched) return;
      launched = true;
      launch();
      start();
      launchIO.disconnect();
    },
    { rootMargin: "-20% 0px -20% 0px" },
  );
  launchIO.observe(host);

  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVis);
  const timer = setInterval(() => visible && measure(), 600); // текст мог сдвинуться (раскрыли модуль и т.п.)
  const ro = new ResizeObserver(() => measure());
  ro.observe(host);

  return () => {
    stop();
    runIO.disconnect();
    launchIO.disconnect();
    ro.disconnect();
    clearInterval(timer);
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("pointerdown", onPointer);
    window.removeEventListener("pointerup", onPointerEnd);
    host.removeEventListener("dblclick", onDbl);
    cleanups.forEach((f) => f());
    cloneNodes.forEach((n) => n.remove());
  };
}
