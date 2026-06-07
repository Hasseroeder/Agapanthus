import { loadJson } from "/js/util/jsonUtil.js";
import { make } from "/js/util/injectionUtil.js";
import { FastfetchModule, FastfetchLine } from "/startpage/fastfetch.js";

const weatherCodesPromise = loadJson("/startpage/media/weather_codes.json");

function getLocation(context) {
    context.locationPromise ??= fetch("https://ipinfo.io/json").then(
        (response) => response.json(),
    );
    return context.locationPromise;
}

function getUtcOffsetString(timeZone) {
    const local = new Date();
    const utc = new Date(local.toLocaleString("en-US", { timeZone: "UTC" }));
    const zoned = new Date(local.toLocaleString("en-US", { timeZone }));
    const utcOffset = (zoned - utc) / 60000 / 60;

    return new Intl.NumberFormat("en-US", {
        signDisplay: "always",
    }).format(utcOffset);
}

const renderFunctionRegistry = {
    header: async function (context) {
        this.el.append(
            make("span", {
                className: "command-line",
                ...this.data,
            }),
        );
    },
    hostname: async function (context) {
        this.el.append(
            make("span", {
                className: "command-line",
                textContent: context.state.hostname,
            }),
        );
    },
    image: async function (context) {
        this.el.append(this.progressLine.wrapper);

        const fetchImage = make("img", {
            src: "/startpage/media/backupImage.jpg",
            className: "fastfetch-image",
            referrerPolicy: "no-referrer",
        });
        context.wrapper.prepend(fetchImage);
        const antix1Fetch = await fetch("https://antix1.transaero.space/api/", {
            method: "GET",
            headers: {
                "x-api-key": "my_super_duper_mega_ultra_secure_API_key",
            },
        });

        const response = await antix1Fetch.json();
        const { src, id, source } = response;
        const sourceLine = new FastfetchLine({
            keyConfig: {
                ...this.data.keyConfig,
                textContent: "Source",
            },
            valueConfig: { textContent: source, href: source },
        });
        const konachanLine = new FastfetchLine({
            keyConfig: {
                ...this.data.keyConfig,
                textContent: "Konachan",
            },
            valueConfig: {
                textContent: "https://konachan.net/post/show/" + id,
                href: "https://konachan.net/post/show/" + id,
            },
        });
        this.el.append(sourceLine.wrapper, konachanLine.wrapper);
        fetchImage.src = src;
    },
    os: async function (context) {
        const fingerPrintInfo = context.state.fingerPrintInfo;
        const line = new FastfetchLine({
            keyConfig: this.data.keyConfig,
            valueConfig: {
                textContent:
                    fingerPrintInfo.platform.type +
                    " " +
                    fingerPrintInfo.os.name.toLowerCase(),
            },
        });
        const OSicon = {
            linux: "󰌽",
            android: "󰀲",
            windows: "󰨡",
            ios: "",
            macos: "",
        }[fingerPrintInfo.os.name.toLowerCase()];
        if (OSicon) line.key.emoji = OSicon;

        this.el.append(line.wrapper);
    },
    locale: async function (context) {
        const line = new FastfetchLine({
            keyConfig: this.data.keyConfig,
            valueConfig: {
                textContent: context.state.fingerPrintInfo.language,
            },
        });
        this.el.append(line.wrapper);
    },
    time: async function (context) {
        this.el.append(this.progressLine.wrapper);

        this.data.timezones.forEach((tz) => {
            const utcString = getUtcOffsetString(tz.timeZone);
            const region = tz.timeZone.split("/")[0];
            const globeIcon = {
                Africa: "",
                America: "",
                Asia: "",
                Europe: "",
            }[region];

            const clockLine = new FastfetchLine({
                keyConfig: {
                    category: this.data.keyConfig.category,
                    emoji: globeIcon ?? this.data.keyConfig.emoji,
                    textContent: tz.airport + " UTC" + utcString,
                },
                valueConfig: {
                    textContent: new Date().toLocaleTimeString("en-US", tz),
                },
            });
            this.el.append(clockLine.wrapper);

            const update = () =>
                (clockLine.value.el.textContent = new Date().toLocaleTimeString(
                    "en-US",
                    tz,
                ));
            update();
            setInterval(update, 10 * 1000);
        });
    },
    ip: async function (context) {
        this.el.append(this.progressLine.wrapper);
        const locationData = await getLocation(context);
        const line = new FastfetchLine({
            keyConfig: this.data.keyConfig,
            valueConfig: { textContent: locationData.ip },
        });
        this.el.append(line.wrapper);
    },
    location: async function (context) {
        this.el.append(this.progressLine.wrapper);
        const locationData = await getLocation(context);
        const line = new FastfetchLine({
            keyConfig: this.data.keyConfig,
            valueConfig: {
                textContent:
                    locationData.city +
                    " " +
                    locationData.region +
                    " " +
                    locationData.country,
            },
        });
        this.el.append(line.wrapper);
    },
    weather: async function (context) {
        this.el.append(this.progressLine.wrapper);

        const locationData = await getLocation(context);
        const [latitude, longitude] = locationData.loc.split(",");
        const metroAPI = "https://api.open-meteo.com/v1/forecast?";
        const options = [
            "latitude=" + (this.data.latitude ?? latitude),
            "longitude=" + (this.data.longitude ?? longitude),
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
        const dailyData = weatherData.daily;
        dailyData.time.forEach((day, i) => {
            const date = new Date(day);
            const weatherCode = weatherCodes[dailyData.weather_code[i]];
            const rainStr =
                weatherCode +
                " " +
                `(${dailyData.precipitation_probability_max[i]}% prob.)`;
            const tempStr =
                ` ${dailyData.temperature_2m_max[i]}°C`.padEnd(10) +
                ` ${dailyData.temperature_2m_min[i]}°C`;

            const line = new FastfetchLine({
                keyConfig: {
                    ...this.data.keyConfig,
                    textContent: date.toLocaleString(
                        ...this.data.keyConfig.dateFormat,
                    ),
                },
                valueConfig: {
                    textContent: rainStr.padEnd(35) + tempStr,
                },
            });
            this.el.append(line.wrapper);
        });
    },
};

export const createFastfetchModule = (config) => {
    const renderFunction = renderFunctionRegistry[config.slug];
    if (!renderFunction) throw new Error("Unknown module: " + config.slug);
    return new FastfetchModule({
        ...config,
        renderContent: renderFunction,
    });
};
