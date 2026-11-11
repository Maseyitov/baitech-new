import { useEffect, useLayoutEffect } from "react";

export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Разрешена ли анимация (в системе не включено «уменьшить движение»)
export const motionAllowed = () => {
  try {
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {
    return false;
  }
};

// Сектор зоны обзора камеры на плане
export function conePath(aDeg, fDeg, r) {
  const a = (aDeg * Math.PI) / 180;
  const f = (fDeg * Math.PI) / 180;
  const x1 = r * Math.cos(a - f / 2), y1 = r * Math.sin(a - f / 2);
  const x2 = r * Math.cos(a + f / 2), y2 = r * Math.sin(a + f / 2);
  return `M0 0 L${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
}

export function pad(n) {
  return (n < 10 ? "0" : "") + n;
}
