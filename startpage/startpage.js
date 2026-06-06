import { loadJson } from "/js/util/jsonUtil.js";
import { make } from "/js/util/injectionUtil.js";
import { createFetchModules } from "/startpage/fastfetchModules.js";
import { fastfetchLine } from "/startpage/fastfetch.js";

const wrapper = document.querySelector(".fastfetch-wrapper");
const fetchTextWrapper = document.querySelector(".fetch-text-wrapper");
const defaultConfig = await loadJson("/startpage/fastfetchConfig.json");

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

    const fetchModules = createFetchModules(config.fetchModules);
    const context = {
        config,
        wrapper,
        fetchTextWrapper,
        fingerPrintInfo,
        hostname,
    };

    fetchModules.forEach(async (module) => {
        module.el = make("div", { className: "fastfetch-module" });
        module.progressLine = new fastfetchLine({
            keyConfig: {
                emoji: module.data.emoji ?? "",
                textContent: module.data.textContent ?? "Module",
            },
            valueConfig: {
                textContent: "in progress",
            },
        });

        fetchTextWrapper.append(module.el);

        try {
            await module.render(context);
            module.progressLine.remove();
        } catch (error) {
            module.progressLine.value.el.textContent = "failed";
            console.error("Error loading module:", error);
        }
    });
}
updateFingerprinting(defaultConfig);
