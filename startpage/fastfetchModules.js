import { loadJson } from "/js/util/jsonUtil.js";
import { make } from "/js/util/injectionUtil.js";
import { fastfetchLine } from "/startpage/fastfetch.js";

const weatherCodesPromise = loadJson("/startpage/media/weather_codes.json");

function createModuleElement(context) {
    const el = make("div", { className: "fastfetch-module" });
    context.fetchTextWrapper.append(el);
    return el;
}

function appendHeader(el, textContent) {
    el.append(
        make("span", {
            className: "command-line",
            textContent,
        }),
    );
}

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

function getOSIcon(osName) {
    return (
        {
            linux: "󰌽",
            android: "󰀲",
            windows: "󰨡",
            ios: "",
            macos: "",
        }[osName.toLowerCase()] ?? ""
    );
}

const fastfetchModuleRegistry = {
    hostname: {
        render(context) {
            const el = createModuleElement(context);
            appendHeader(el, context.hostname);
            appendHeader(el, "-".repeat(context.hostname.length));
        },
    },
    image: {
        render(context) {
            const el = createModuleElement(context);
            appendHeader(el, this.data.header ?? "Image");

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
            el.append(tempLine.wrapper);

            fetch("https://antix1.transaero.space/api/", {
                method: "GET",
                headers: {
                    "x-api-key": "my_super_duper_mega_ultra_secure_API_key",
                },
            })
                .then((response) => response.json())
                .then(({ src, id, source }) => {
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
                    el.append(sourceLine.wrapper, konachanLine.wrapper);
                    context.wrapper.prepend(
                        make("img", {
                            referrerPolicy: "no-referrer",
                            src,
                            className: "fastfetch-image",
                        }),
                    );
                })
                .catch((error) => {
                    tempLine.value.el.textContent = "failed";
                    console.error("reverse proxy unreachable:", error);
                    context.wrapper.prepend(
                        make("img", {
                            src: "/startpage/media/backupImage.jpg",
                            className: "fastfetch-image",
                        }),
                    );
                });
        },
    },
    platform: {
        render(context) {
            const fingerPrintInfo = context.fingerPrintInfo;
            const el = createModuleElement(context);
            appendHeader(el, this.data.header ?? "Platform");

            const OSline = new fastfetchLine({
                keyConfig: {
                    category: "Platform",
                    emoji: getOSIcon(fingerPrintInfo.os.name),
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
            el.append(OSline.wrapper, localeLine.wrapper);
        },
    },
    time: {
        render(context) {
            const el = createModuleElement(context);
            appendHeader(el, this.data.header ?? "Time");

            this.data.timezones.forEach((tz) => {
                const utcString = getUtcOffsetString(tz.timeZone);

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
                el.append(clockLine.wrapper);

                const update = () =>
                    (clockLine.value.el.textContent =
                        new Date().toLocaleTimeString("en-US", tz));
                update();
                setInterval(update, 10 * 1000);
            });
        },
    },
    connection: {
        render(context) {
            const el = createModuleElement(context);
            appendHeader(el, this.data.header ?? "Connected from");

            const tempLine = new fastfetchLine({
                keyConfig: {
                    category: "Weather",
                    emoji: "󰃶",
                    textContent: "Request",
                },
                valueConfig: { textContent: "in progress" },
            });
            el.append(tempLine.wrapper);

            getLocation(context)
                .then((data) => {
                    tempLine.remove();
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
                                data.city +
                                " " +
                                data.region +
                                " " +
                                data.country,
                        },
                    });
                    el.append(ipLine.wrapper, locationLine.wrapper);
                })
                .catch((error) => {
                    tempLine.value.el.textContent = "failed";
                    console.error("Error fetching IP address:", error);
                });
        },
    },
    weather: {
        render(context) {
            const el = createModuleElement(context);
            appendHeader(el, this.data.header ?? "Local Weather");

            const tempLine = new fastfetchLine({
                keyConfig: {
                    category: "Weather",
                    emoji: "󰃶",
                    textContent: "Request",
                },
                valueConfig: { textContent: "in progress" },
            });
            el.append(tempLine.wrapper);

            getLocation(context)
                .then((data) => {
                    const [latitude, longitude] = data.loc.split(",");
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

                    return Promise.all([
                        weatherCodesPromise,
                        loadJson(constructedURL),
                    ]);
                })
                .then(([weatherCodes, weatherData]) => {
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

                        el.append(line.wrapper);
                    });
                })
                .catch((error) => {
                    tempLine.value.el.textContent = "failed";
                    console.error("Error fetching weather:", error);
                });
        },
    },
};

export function createFetchModules(moduleConfigs) {
    return moduleConfigs.flatMap((moduleConfig) => {
        const registeredModule = fastfetchModuleRegistry[moduleConfig.slug];
        if (!registeredModule) {
            console.warn("Unknown fastfetch module:", moduleConfig.slug);
            return [];
        }

        return [
            {
                ...registeredModule,
                ...moduleConfig,
                data: {
                    ...(registeredModule.data ?? {}),
                    ...(moduleConfig.data ?? {}),
                },
            },
        ];
    });
}
