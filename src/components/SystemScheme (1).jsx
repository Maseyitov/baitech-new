"use client";
import { useCourseText } from "../i18n";

export default function Stats() {
  const T = useCourseText();
  return (
    <div className="wrap nums" id="stats">
      <div className="s rv"><b data-to="4">4</b><span>{T.stats[0]}</span></div>
      <div className="s rv"><b data-to="10">10</b><span>{T.stats[1]}</span></div>
      <div className="s rv"><b data-to="80" data-suf="%">80%</b><span>{T.stats[2]}</span></div>
      <div className="s rv"><b data-to="9" data-suf="/10">9/10</b><span>{T.stats[3]}</span></div>
    </div>
  );
}
