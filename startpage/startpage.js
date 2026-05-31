import { loadJson } from "/js/util/jsonUtil.js";
import { make } from "/js/util/injectionUtil.js";

const fetchImage = document.getElementById("fastfetch-image");
try {
    const konachanReq = await fetch("https://antix1.transaero.space/api/", {
        method: "GET",
        headers: {
            "x-api-key": "my_super_duper_mega_ultra_secure_API_key",
        },
    });
    const { src, id, source } = await konachanReq.json();
    const imageLinks = document.querySelector(".image-links");

    const linkObjs = [
        {
            href: source,
            textContent: "Source",
        },
        {
            href: "https://konachan.net/post/show/" + id,
            textContent: "Konachan",
        },
    ];
    linkObjs.forEach((linkObj, i) => {
        const commandLine = make("div", {
            className: "command-line",
        });
        const span = make("span", {
            textContent: i == linkObjs.length - 1 ? "└   " : "├   ",
        });
        const a = make("a", linkObj);
        span.append(a);
        commandLine.append(span);
        imageLinks.append(commandLine);
    });
    fetchImage.referrerPolicy = "no-referrer";
    fetchImage.src = src;
} catch {
    console.error("reverse proxy unreachable.");
    fetchImage.src = "/startpage/media/backupImage.jpg";
}
/*const engineGrid = document.getElementById("engine-grid");
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
});*/

const weatherCodesPromise = loadJson("/startpage/media/weather_codes.json");
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
        userInfo.browser.version.split(".")[0];

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
        languageIcon + "  Locale    ⇀ " + userInfo.language;
    document.querySelector(".os").textContent =
        OSicon +
        "  OS        ⇀ " +
        userInfo.platform.type +
        " " +
        userInfo.os.name.toLowerCase();

    async function updateLocation() {
        try {
            const response = await fetch("https://ipinfo.io/json");
            const data = await response.json();
            document.querySelector(".ip").textContent =
                "󰌘  IPv4      ⇀ " + data.ip;
            document.querySelector(".location").textContent =
                "  Location  ⇀ " +
                data.city +
                " " +
                data.region +
                " " +
                data.country;

            try {
                const weatherCodes = await weatherCodesPromise;
                const weatherContainer =
                    document.querySelector(".weather-container");
                const metroAPI = "https://api.open-meteo.com/v1/forecast?";
                const [latitude, longitude] = data.loc.split(",");
                const options = [
                    "latitude=" + latitude,
                    "longitude=" + longitude,
                    "daily=" +
                        [
                            "temperature_2m_max",
                            "temperature_2m_min",
                            "weather_code",
                            "precipitation_probability_max",
                        ].join(","),
                    "timezone=auto",
                    "forecast_days=3",
                ].join("&");
                const constructedURL = metroAPI + options;
                const weatherData = await loadJson(constructedURL);
                const dailyData = weatherData.daily;
                dailyData.time.forEach((day, i) => {
                    const date = new Date(day);
                    const commandLine = make("div", {
                        className: "command-line",
                    });
                    const span = make("span", {
                        textContent:
                            i == dailyData.time.length - 1 ? "└ 󰃶  " : "├ 󰃶  ",
                    });
                    span.textContent += date.toLocaleString("en-GB", {
                        weekday: "short",
                        month: "2-digit",
                        day: "2-digit",
                    });
                    const weatherCode = weatherCodes[dailyData.weather_code[i]];
                    const rainStr =
                        " ⇀ " +
                        weatherCode.emoji +
                        "  " +
                        weatherCode.description +
                        " " +
                        `(${dailyData.precipitation_probability_max[i]}% precip.)`;
                    span.textContent += rainStr.padEnd(30);

                    const tempStr =
                        ` ${dailyData.temperature_2m_max[i]}°C`.padEnd(10) +
                        ` ${dailyData.temperature_2m_min[i]}°C`;
                    span.textContent += tempStr;
                    commandLine.append(span);
                    weatherContainer.append(commandLine);
                });
                console.log(weatherData);
            } catch {
                console.error("Error fetching weather");
            }
        } catch (error) {
            console.error("Error fetching IP address:", error);
        }
    }
    updateLocation();
}

const clockContainer = document.querySelector(".clockContainer");
const timezones = await loadJson("/startpage/media/timezones.json");
timezones.forEach((tz, i) => {
    const wrapper = make("div", { className: "command-line" }, [
        i == timezones.length - 1 ? "└ " : "├ ",
    ]);
    tz.clock = make("span", { className: "clock" });
    wrapper.append(tz.clock);
    clockContainer.append(wrapper);

    const local = new Date();
    const utc = new Date(local.toLocaleString("en-US", { timeZone: "UTC" }));
    const zoned = new Date(local.toLocaleString("en-US", tz));
    tz.utcOffset = (zoned - utc) / 60000 / 60;
    tz.hour12 = false;
    tz.hour = "2-digit";
    tz.minute = "2-digit";

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
