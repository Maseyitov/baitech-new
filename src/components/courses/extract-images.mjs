// Достаёт картинки (base64) из HTML-макета и сохраняет их файлами.
// Запуск: node extract-images.mjs путь/к/макету.html путь/к/папке/img
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const [, , htmlPath, outDir = "./img"] = process.argv;
if (!htmlPath) {
  console.error("Укажите путь к HTML: node extract-images.mjs page.html ./img");
  process.exit(1);
}

const html = readFileSync(htmlPath, "utf8");
mkdirSync(outDir, { recursive: true });

const save = (name, b64) => {
  writeFileSync(join(outDir, name), Buffer.from(b64, "base64"));
  console.log("✓", name);
};

// Камеры и регистратор: <image id="im-colorvu" href="data:image/webp;base64,...">
const imageRe = /<image id="im-([\w-]+)" href="data:image\/(\w+);base64,([^"]+)"/g;
for (const [, name, ext, b64] of html.matchAll(imageRe)) save(`${name}.${ext}`, b64);

// Логотипы в шапке
const logoRe = /<img class="(l-light|l-dark)" src="data:image\/png;base64,([^"]+)"/g;
for (const [, cls, b64] of html.matchAll(logoRe)) save(cls === "l-light" ? "logo-light.png" : "logo-dark.png", b64);
