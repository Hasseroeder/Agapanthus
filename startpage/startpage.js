import { loadJson } from "/js/util/jsonUtil.js";
import { make } from "/js/util/injectionUtil.js";

const banner = document.getElementById("banner");

const konachanReq = await fetch("https://antix1.transaero.space/api/", {
    method: "GET",
    headers: {
        "x-api-key": "my_super_duper_mega_ultra_secure_API_key",
    },
});
const bannerSrc = await konachanReq.json();
banner.referrerPolicy = "no-referrer";
banner.src = bannerSrc;

const engineGrid = document.getElementById("engine-grid");
const engines = await loadJson("/startpage/media/engine.json");
engines.forEach((engine) => {
    const wrapper = make("div", { className: "engine-wrapper" });
    const { xmlns, viewBox } = engine.icon.svg;
    const svg = document.createElementNS(xmlns, "svg");
    svg.setAttribute("viewBox", viewBox);
    svg.setAttribute("xmlns", xmlns);
    const { d } = engine.icon.path;
    const path = document.createElementNS(xmlns, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "#808080");
    svg.append(path);
    wrapper.append(svg);
    engineGrid.append(wrapper);
});
