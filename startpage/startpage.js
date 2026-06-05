import { loadJson } from "/js/util/jsonUtil.js";
import { make } from "/js/util/injectionUtil.js";
import { fastfetchLine } from "/startpage/fastfetchObj.js";

const fetchImage = document.getElementById("fastfetch-image");
const imageLinks = document.querySelector(".image-links");
const tempLine = new fastfetchLine({
    keyConfig: {
        category: "Image",
        emoji: "",
        textContent: "Request",
    },
    valueConfig: { textContent: "in progress" },
});
imageLinks.append(tempLine.wrapper);
try {
    const konachanReq = await fetch("https://antix1.transaero.space/api/", {
        method: "GET",
        headers: {
            "x-api-key": "my_super_duper_mega_ultra_secure_API_key",
        },
    });
    const { src, id, source } = await konachanReq.json();
    tempLine.remove();

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
} catch (error) {
    tempLine.valueObj.el.textContent = "failed";
    console.error("reverse proxy unreachable:", error);
    fetchImage.src = "/startpage/media/backupImage.jpg";
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
    document.querySelector(".os").append(OSline.wrapper);

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
    document.querySelector(".locale").append(localeLine.wrapper);

    const clockContainer = document.querySelector(".clock-container");
    config.timezones.forEach((tz, i) => {
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
        clockContainer.append(clockLine.wrapper);

        tz.update = () =>
            (clockLine.valueObj.el.textContent = new Date().toLocaleTimeString(
                "en-US",
                tz,
            ));
        tz.update();
        tz.interval = setInterval(tz.update, 10 * 1000);
    });

    async function updateLocation() {
        try {
            const response = await fetch("https://ipinfo.io/json");
            const data = await response.json();
            const ipLine = new fastfetchLine({
                keyConfig: {
                    category: "Connection",
                    emoji: "󰌘",
                    textContent: "IPv4",
                },
                valueConfig: { textContent: data.ip },
            });
            document.querySelector(".ip").append(ipLine.wrapper);

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
            document.querySelector(".location").append(locationLine.wrapper);

            const weatherContainer =
                document.querySelector(".weather-container");
            const tempLine = new fastfetchLine({
                keyConfig: {
                    category: "Weather",
                    emoji: "󰃶",
                    textContent: "Request",
                },
                valueConfig: { textContent: "in progress" },
            });
            weatherContainer.append(tempLine.wrapper);
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
                    const weatherCode = weatherCodes[dailyData.weather_code[i]];
                    const rainStr =
                        weatherCode +
                        " " +
                        `(${dailyData.precipitation_probability_max[i]}% precip.)`;
                    const tempStr =
                        ` ${dailyData.temperature_2m_max[i]}°C`.padEnd(10) +
                        ` ${dailyData.temperature_2m_min[i]}°C`;

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

                    weatherContainer.append(line.wrapper);
                });
                console.log(weatherData);
            } catch (error) {
                tempLine.valueObj.el.textContent = "failed";
                console.error("Error fetching weather:", error);
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
};

updateFingerprinting(defaultConfig);
