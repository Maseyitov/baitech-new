import { IMG } from "../images";

export default function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <linearGradient id="coneGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1463FF" stopOpacity=".38" />
          <stop offset="1" stopColor="#1463FF" stopOpacity=".08" />
        </linearGradient>
        <image id="im-colorvu" href={IMG.colorvu.src} width="760" height="359" />
        <image id="im-dome" href={IMG.dome.src} width="460" height="450" />
        <image id="im-panovu" href={IMG.panovu.src} width="440" height="465" />
        <image id="im-nvr" href={IMG.nvr.src} width="607" height="103" />
        <image id="im-bullet" href={IMG.bullet.src} width="300" height="191" />
      </defs>
    </svg>
  );
}
