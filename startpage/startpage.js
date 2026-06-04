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

const fastfetchKeys = [];
class fastfetchKey {
    constructor({ category, emoji, text }) {
        this.category = category;
        this.emoji = emoji;
        this.text = text;
        this.textpadding = text.length;
        this.structure = "├";

        this.el = make("span");
        fastfetchKeys.push(this);
        fastfetchKey.update();
        return this.el;
    }
    update() {
        this.el.textContent =
            `${this.structure} ` +
            `${this.emoji}  ` +
            this.text.padEnd(this.textpadding) +
            ` ${fastfetchKey.separator} `;
    }
    static separator = "⇀";
    static update() {
        const categories = [];
        var maxPadding = 0;
        fastfetchKeys.forEach((key) => {
            !categories.includes(key.category) && categories.push(key.category);
            maxPadding = Math.max(key.textpadding, maxPadding);
        });
        categories.forEach((category) => {
            const keys = fastfetchKeys.filter(
                (key) => key.category == category,
            );
            keys.forEach((key, i) => {
                key.structure = i == keys.length - 1 ? "└" : "├";
            });
        });
        fastfetchKeys.forEach((key) => {
            key.textpadding = maxPadding;
            key.update();
        });
    }
}

const weatherCodesPromise = loadJson("/startpage/media/weather_codes.json");
function updateFingerprinting(config) {
    const fingerPrintInfo = {
        ...bowser.getParser(window.navigator.userAgent).parsedResult,
        language: navigator.language || navigator.userLanguage,
    };

    const hostname =
        config.userName +
        "@" +
        fingerPrintInfo.browser.name.toLowerCase() +
        "-" +
        fingerPrintInfo.browser.version.split(".")[0];

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
        }[fingerPrintInfo.os.name.toLowerCase()] ?? "";

    const OSel = document.querySelector(".os");
    OSel.append(
        new fastfetchKey({ category: "Platform", emoji: OSicon, text: "OS" }),
    );
    OSel.append(
        fingerPrintInfo.platform.type +
            " " +
            fingerPrintInfo.os.name.toLowerCase(),
    );

    const localeEl = document.querySelector(".locale");
    localeEl.append(
        new fastfetchKey({ category: "Platform", emoji: "", text: "locale" }),
    );
    localeEl.append(fingerPrintInfo.language);

    const clockContainer = document.querySelector(".clockContainer");
    config.timezones.forEach((tz, i) => {
        const wrapper = make("div", { className: "command-line" }, [
            i == config.timezones.length - 1 ? "└ " : "├ ",
        ]);
        tz.clock = make("span", { className: "clock" });
        wrapper.append(tz.clock);
        clockContainer.append(wrapper);

        const local = new Date();
        const utc = new Date(
            local.toLocaleString("en-US", { timeZone: "UTC" }),
        );
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
                (beforeUtc ? "-" : "+") + String(absUtcOffset).padStart(2, "0");

            const airportString = (globeIcon + "  " + tz.airport).padEnd(
                9,
                " ",
            );
            const utcString = ("UTC" + utcTimeString).padEnd(9, " ");
            const timeString = new Date().toLocaleTimeString("en-US", tz);

            tz.clock.textContent = airportString + utcString + timeString;
        };
        tz.update();
        tz.interval = setInterval(tz.update, 10 * 1000);
    });

    async function updateLocation() {
        try {
            const response = await fetch("https://ipinfo.io/json");
            const data = await response.json();
            const ipEl = document.querySelector(".ip");
            ipEl.append(
                new fastfetchKey({
                    category: "Connection",
                    emoji: "󰌘",
                    text: "IPv4",
                }),
            );
            ipEl.append(data.ip);

            const locationEl = document.querySelector(".location");
            locationEl.append(
                new fastfetchKey({
                    category: "Connection",
                    emoji: "",
                    text: "Location",
                }),
            );
            locationEl.append(
                data.city + " " + data.region + " " + data.country,
            );

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
                    const span = make("span");
                    span.append(
                        new fastfetchKey({
                            category: "Weather",
                            emoji: "󰃶",
                            text: date.toLocaleString("en-GB", {
                                weekday: "short",
                                month: "2-digit",
                                day: "2-digit",
                            }),
                        }),
                    );
                    const weatherCode = weatherCodes[dailyData.weather_code[i]];
                    const rainStr =
                        weatherCode +
                        " " +
                        `(${dailyData.precipitation_probability_max[i]}% precip.)`;
                    span.append(rainStr.padEnd(35));

                    const tempStr =
                        ` ${dailyData.temperature_2m_max[i]}°C`.padEnd(10) +
                        ` ${dailyData.temperature_2m_min[i]}°C`;
                    span.append(tempStr);
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

const defaultConfig = {
    userName: "user",
    weather: {
        mode: "ip",
        latitude: null,
        longitude: null,
        label: null,
    },
    timezones: [
        { airport: "SLC", timeZone: "America/Denver" },
        { airport: "NYC", timeZone: "America/New_York" },
        { airport: "BER", timeZone: "Europe/Berlin" },
    ],
};

updateFingerprinting(defaultConfig);
