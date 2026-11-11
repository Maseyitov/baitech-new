/* Картинки страницы курса. */
import bullet from "./img/cilindricheskaya-kamera-hikvision.png"; // камера слева и в сцене монтажа
import colorvu from "./img/kamera-hikvision-colorvu.png"; // купольная HiWatch по центру
import dome from "./img/kupolnaya-kamera-hiwatch.png"; // панорамная камера справа (файл назван неточно, но картинка верная)
import panovu from "./img/panoramnaya-kamera-hikvision-ptz.png"; // камеры CAM 1, 2, 4 на схеме
import nvr from "./img/videoregistrator-hikvision-nvr.png"; // регистратор из прототипа, прозрачный фон

// Названия ключей менять нельзя: компоненты обращаются именно к ним
export const IMG = { colorvu, dome, panovu, nvr, bullet };