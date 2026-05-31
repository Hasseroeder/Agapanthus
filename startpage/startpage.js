import { loadJson } from "/js/util/jsonUtil.js";
import { make } from "/js/util/injectionUtil.js";

const fetchImage = document.getElementById("fastfetch-image");
const konachanReq = await fetch("https://antix1.transaero.space/api/", {
    method: "GET",
    headers: {
        "x-api-key": "my_super_duper_mega_ultra_secure_API_key",
    },
});
const imageSrc = await konachanReq.json();
fetchImage.referrerPolicy = "no-referrer";
fetchImage.src = imageSrc;
//fetchImage.src = "/startpage/media/temporary.jpg";

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

function updateFingerprinting(extraUserInfo) {
    const userInfo = bowser.getParser(window.navigator.userAgent).parsedResult;
    Object.assign(userInfo, {
        language: navigator.language || navigator.userLanguage,
        ...extraUserInfo,
    });

    const hostname =
        userInfo.userName +
        "@" +
        userInfo.browser.name.toLowerCase() +
        "-" +
        userInfo.browser.version;

    Array.from(document.querySelectorAll(".hostname")).forEach(
        (el) => (el.textContent = hostname),
    );
    Array.from(document.querySelectorAll(".fastfetch-separator")).forEach(
        (el) => (el.textContent = "─".repeat(hostname.length)),
    );

    const OSicon =
        {
            linux: "󰌽",
            android: "󰀲",
            windows: "󰨡",
            ios: "",
            macos: "",
        }[userInfo.os.name.toLowerCase()] ?? "";

    const languageIcon = "";

    document.querySelector(".locale").textContent =
        languageIcon + "  Locale ⇀ " + userInfo.language;
    document.querySelector(".os").textContent =
        OSicon +
        "  OS     ⇀ " +
        userInfo.platform.type +
        " " +
        userInfo.os.name.toLowerCase();
}

const clocks = Array.from(document.querySelectorAll(".clock"));

const timezones = [
    {
        airport: "SLC",
        timeZone: "America/Denver",
    },
    {
        airport: "NYC",
        timeZone: "America/New_York",
    },
    {
        airport: "BER",
        timeZone: "Europe/Berlin",
    },
];

timezones.forEach((tz, i) => {
    const clocks = Array.from(document.querySelectorAll(".clock"));
    const local = new Date();
    const utc = new Date(local.toLocaleString("en-US", { timeZone: "UTC" }));
    const zoned = new Date(local.toLocaleString("en-US", tz));
    tz.utcOffset = (zoned - utc) / 60000 / 60;
    tz.hour12 = false;
    tz.hour = "2-digit";
    tz.minute = "2-digit";
    tz.clock = clocks[i];

    const region = tz.timeZone.split("/")[0];
    const globeIcon =
        {
            Africa: "",
            America: "",
            Asia: "",
            Europe: "",
        }[region] ?? "󰊷";

    tz.update = function () {
        const beforeUtc = tz.utcOffset < 0;
        const absUtcOffset = Math.abs(tz.utcOffset);
        const utcTimeString =
            (beforeUtc ? "+" : "-") + String(absUtcOffset).padStart(2, "0");

        const airportString = (globeIcon + " " + tz.airport).padEnd(7, " ");
        const utcString = ("UTC" + utcTimeString).padEnd(8, " ");
        const timeString = new Date().toLocaleTimeString("en-US", tz);

        tz.clock.textContent = airportString + utcString + timeString;
    };
    tz.update();
});

updateFingerprinting({ userName: "heather" });
