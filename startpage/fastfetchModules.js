import { loadJson } from "/js/util/jsonUtil.js";
import { make } from "/js/util/injectionUtil.js";
import { fastfetchLine } from "/startpage/fastfetch.js";

const weatherCodesPromise = loadJson("/startpage/media/weather_codes.json");

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
        renderContent(context) {
            appendHeader(this.el, context.hostname);
            appendHeader(this.el, "-".repeat(context.hostname.length));
        },
    },
    image: {
        async renderContent(context) {
            appendHeader(this.el, this.data.header ?? "Image");
            this.el.append(this.progressLine.wrapper);

            const fetchImage = make("img", {
                src: "/startpage/media/backupImage.jpg",
                className: "fastfetch-image",
                referrerPolicy: "no-referrer",
            });
            context.wrapper.prepend(fetchImage);
            const antix1Fetch = await fetch(
                "https://antix1.transaero.space/api/",
                {
                    method: "GET",
                    headers: {
                        "x-api-key": "my_super_duper_mega_ultra_secure_API_key",
                    },
                },
            );

            const response = await antix1Fetch.json();
            const { src, id, source } = response;
            const sourceLine = new fastfetchLine({
                keyConfig: {
                    category: "Image",
                    emoji: this.data.emoji,
                    textContent: "Source",
                },
                valueConfig: { textContent: source, href: source },
            });
            const konachanLine = new fastfetchLine({
                keyConfig: {
                    category: "Image",
                    emoji: this.data.emoji,
                    textContent: "Konachan",
                },
                valueConfig: {
                    textContent: "https://konachan.net/post/show/" + id,
                    href: "https://konachan.net/post/show/" + id,
                },
            });
            this.progressLine.remove();
            this.el.append(sourceLine.wrapper, konachanLine.wrapper);
            fetchImage.src = src;
        },
    },
    platform: {
        renderContent(context) {
            const fingerPrintInfo = context.fingerPrintInfo;
            appendHeader(this.el, this.data.header ?? "Platform");
            this.el.append(this.progressLine.wrapper);

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
            this.el.append(OSline.wrapper, localeLine.wrapper);
        },
    },
    time: {
        renderContent(context) {
            appendHeader(this.el, this.data.header ?? "Time");
            this.el.append(this.progressLine.wrapper);

            this.data.timezones.forEach((tz) => {
                const utcString = getUtcOffsetString(tz.timeZone);
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
                        emoji: globeIcon,
                        textContent: tz.airport + " UTC" + utcString,
                    },
                    valueConfig: {
                        textContent: new Date().toLocaleTimeString("en-US", tz),
                    },
                });
                this.el.append(clockLine.wrapper);

                const update = () =>
                    (clockLine.value.el.textContent =
                        new Date().toLocaleTimeString("en-US", tz));
                update();
                setInterval(update, 10 * 1000);
            });
        },
    },
    connection: {
        async renderContent(context) {
            appendHeader(this.el, this.data.header ?? "Connected from");
            this.el.append(this.progressLine.wrapper);

            const locationData = await getLocation(context);
            const ipLine = new fastfetchLine({
                keyConfig: {
                    category: "Connection",
                    emoji: "󰌘",
                    textContent: "IPv4",
                },
                valueConfig: { textContent: locationData.ip },
            });

            const locationLine = new fastfetchLine({
                keyConfig: {
                    category: "Connection",
                    emoji: "",
                    textContent: "Location",
                },
                valueConfig: {
                    textContent:
                        locationData.city +
                        " " +
                        locationData.region +
                        " " +
                        locationData.country,
                },
            });
            this.progressLine.remove();
            this.el.append(ipLine.wrapper, locationLine.wrapper);
        },
    },
    weather: {
        async renderContent(context) {
            appendHeader(this.el, this.data.header ?? "Local Weather");
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
                    `(${dailyData.precipitation_probability_max[i]}% precip.)`;
                const tempStr =
                    ` ${dailyData.temperature_2m_max[i]}°C`.padEnd(10) +
                    ` ${dailyData.temperature_2m_min[i]}°C`;

                const line = new fastfetchLine({
                    keyConfig: {
                        category: "Weather",
                        emoji: this.data.emoji,
                        textContent: date.toLocaleString(
                            ...this.data.dateFormat,
                        ),
                    },
                    valueConfig: {
                        textContent: rainStr.padEnd(35) + tempStr,
                    },
                });
                this.progressLine.remove();
                this.el.append(line.wrapper);
            });
        },
    },
};

Object.values(fastfetchModuleRegistry).forEach((module) => {
    module.tryRenderContent = async function (context) {
        try {
            await this.renderContent(context);
            this.progressLine.remove();
        } catch (error) {
            this.progressLine.value.el.textContent = "failed";
            console.error("Error loading module:", error);
        }
    };
    module.init = function (context) {
        this.el = make("div", { className: "fastfetch-module" });
        this.progressLine = new fastfetchLine({
            keyConfig: {
                emoji: this.data.emoji ?? "",
                textContent: this.data.textContent ?? "Module",
            },
            valueConfig: {
                textContent: "in progress",
            },
        });
        context.fetchTextWrapper.append(this.el);
    };
});

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
