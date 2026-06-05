import { loadJson } from "/js/util/jsonUtil.js";
import { make } from "/js/util/injectionUtil.js";
import { fastfetchLine } from "/startpage/fastfetch.js";

const fetchImage = document.getElementById("fastfetch-image");
const fetchTextWrapper = document.querySelector(".fetch-text-wrapper");
const tempLine = new fastfetchLine({
    keyConfig: {
        category: "Image",
        emoji: "",
        textContent: "Request",
    },
    valueConfig: {
        textContent: "in progress",
    },
});
try {
    const headerLine = make("span", {
        className: "command-line",
        textContent: "Image",
    });
    fetchTextWrapper.append(headerLine, tempLine.wrapper);

    const konachanReq = await fetch("https://antix1.transaero.space/api/", {
        method: "GET",
        headers: {
            "x-api-key": "my_super_duper_mega_ultra_secure_API_key",
        },
    });
    const { src, id, source } = await konachanReq.json();
    tempLine.remove();

    const sourceLine = new fastfetchLine({
        keyConfig: {
            category: "Image",
            emoji: "",
            textContent: "Source",
        },
        valueConfig: { textContent: source, href: source },
    });
    const konachanLine = new fastfetchLine({
        keyConfig: {
            category: "Image",
            emoji: "",
            textContent: "Konachan",
        },
        valueConfig: {
            textContent: "https://konachan.net/post/show/" + id,
            href: "https://konachan.net/post/show/" + id,
        },
    });
    fetchTextWrapper.append(sourceLine.wrapper, konachanLine.wrapper);
    fetchImage.referrerPolicy = "no-referrer";
    fetchImage.src = src;
} catch (error) {
    tempLine.value.el.textContent = "failed";
    console.error("reverse proxy unreachable:", error);
    fetchImage.src = "/startpage/media/backupImage.jpg";
}

const weatherCodesPromise = loadJson("/startpage/media/weather_codes.json");
function updateFingerprinting(config) {
    const { fetchModules } = config;
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
    {
        const OSicon =
            {
                linux: "󰌽",
                android: "󰀲",
                windows: "󰨡",
                ios: "",
                macos: "",
            }[fingerPrintInfo.os.name.toLowerCase()] ?? "";

        const headerLine = make("span", {
            className: "command-line",
            textContent: "Image",
        });
        const OSline = new fastfetchLine({
            keyConfig: {
                category: "Platform",
                emoji: OSicon,
                textContent: "OS",
            },
            valueConfig: {
                textContent:
                    fingerPrintInfo.platform.type +
                    " " +
                    fingerPrintInfo.os.name.toLowerCase(),
            },
        });

        const localeLine = new fastfetchLine({
            keyConfig: {
                category: "Platform",
                emoji: "",
                textContent: "locale",
            },
            valueConfig: {
                textContent: fingerPrintInfo.language,
            },
        });
        fetchTextWrapper.append(headerLine, OSline.wrapper, localeLine.wrapper);
    }
    {
        const headerLine = make("span", {
            className: "command-line",
            textContent: "Time",
        });
        fetchTextWrapper.append(headerLine);
        const timeConfig = fetchModules.find((module) => module.slug == "time");
        timeConfig.data.timezones.forEach((tz, i) => {
            const local = new Date();
            const utc = new Date(
                local.toLocaleString("en-US", { timeZone: "UTC" }),
            );
            const zoned = new Date(
                local.toLocaleString("en-US", { timeZone: tz.timeZone }),
            );
            const utcOffset = (zoned - utc) / 60000 / 60;
            const utcString = new Intl.NumberFormat("en-US", {
                signDisplay: "always",
            }).format(utcOffset);

            const region = tz.timeZone.split("/")[0];
            const globeIcon =
                {
                    Africa: "",
                    America: "",
                    Asia: "",
                    Europe: "",
                }[region] ?? "󰊷";

            const clockLine = new fastfetchLine({
                keyConfig: {
                    category: "Time",
                    emoji: "󰃶",
                    textContent: tz.airport + " UTC" + utcString,
                },
                valueConfig: {
                    textContent: new Date().toLocaleTimeString("en-US", tz),
                },
            });
            fetchTextWrapper.append(clockLine.wrapper);

            tz.update = () =>
                (clockLine.value.el.textContent = new Date().toLocaleTimeString(
                    "en-US",
                    tz,
                ));
            tz.update();
            tz.interval = setInterval(tz.update, 10 * 1000);
        });
    }
    async function updateLocation() {
        try {
            const response = await fetch("https://ipinfo.io/json");
            const data = await response.json();
            {
                const headerLine = make("span", {
                    className: "command-line",
                    textContent: "Connected from",
                });

                const ipLine = new fastfetchLine({
                    keyConfig: {
                        category: "Connection",
                        emoji: "󰌘",
                        textContent: "IPv4",
                    },
                    valueConfig: { textContent: data.ip },
                });

                const locationLine = new fastfetchLine({
                    keyConfig: {
                        category: "Connection",
                        emoji: "",
                        textContent: "Location",
                    },
                    valueConfig: {
                        textContent:
                            data.city + " " + data.region + " " + data.country,
                    },
                });
                fetchTextWrapper.append(
                    headerLine,
                    ipLine.wrapper,
                    locationLine.wrapper,
                );
            }
            {
                const headerLine = make("span", {
                    className: "command-line",
                    textContent: "Local Weather",
                });
                const tempLine = new fastfetchLine({
                    keyConfig: {
                        category: "Weather",
                        emoji: "󰃶",
                        textContent: "Request",
                    },
                    valueConfig: { textContent: "in progress" },
                });
                fetchTextWrapper.append(headerLine, tempLine.wrapper);
                try {
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
                    const [weatherCodes, weatherData] = await Promise.all([
                        weatherCodesPromise,
                        loadJson(constructedURL),
                    ]);
                    tempLine.remove();
                    const dailyData = weatherData.daily;
                    dailyData.time.forEach((day, i) => {
                        const date = new Date(day);
                        const weatherCode =
                            weatherCodes[dailyData.weather_code[i]];
                        const rainStr =
                            weatherCode +
                            " " +
                            `(${dailyData.precipitation_probability_max[i]}% precip.)`;
                        const tempStr =
                            ` ${dailyData.temperature_2m_max[i]}°C`.padEnd(
                                10,
                            ) + ` ${dailyData.temperature_2m_min[i]}°C`;

                        const line = new fastfetchLine({
                            keyConfig: {
                                category: "Weather",
                                emoji: "󰃶",
                                textContent: date.toLocaleString("en-GB", {
                                    weekday: "short",
                                    month: "2-digit",
                                    day: "2-digit",
                                }),
                            },
                            valueConfig: {
                                textContent: rainStr.padEnd(35) + tempStr,
                            },
                        });

                        fetchTextWrapper.append(line.wrapper);
                    });
                } catch (error) {
                    tempLine.value.el.textContent = "failed";
                    console.error("Error fetching weather:", error);
                }
            }
        } catch (error) {
            console.error("Error fetching IP address:", error);
        }
    }
    updateLocation();
}

const defaultConfig = {
    userName: "user",
    fetchModules: [
        {
            slug: "weather",
            // config unused for now
            data: {
                mode: "ip",
                latitude: null,
                longitude: null,
                label: null,
            },
        },
        {
            slug: "time",
            data: {
                header: "Time",
                timezones: [
                    {
                        airport: "SLC",
                        timeZone: "America/Denver",
                        hour12: false,
                        hour: "2-digit",
                        minute: "2-digit",
                    },
                    {
                        airport: "NYC",
                        timeZone: "America/New_York",
                        hour12: false,
                        hour: "2-digit",
                        minute: "2-digit",
                    },
                    {
                        airport: "BER",
                        timeZone: "Europe/Berlin",
                        hour12: false,
                        hour: "2-digit",
                        minute: "2-digit",
                    },
                ],
            },
        },
    ],
};

updateFingerprinting(defaultConfig);
