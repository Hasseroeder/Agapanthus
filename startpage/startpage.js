import { loadJson } from "/js/util/jsonUtil.js";
import { make } from "/js/util/injectionUtil.js";
import { createFetchModules } from "/startpage/fastfetchModules.js";

const fetchImage = document.getElementById("fastfetch-image");
const fetchTextWrapper = document.querySelector(".fetch-text-wrapper");
const defaultConfig = await loadJson("/startpage/fastfetchConfig.json");

function makeFastfetchHeader(hostname) {
    const hostnameLine = make("div", { className: "command-line" }, [
        make("span", { textContent: hostname }),
    ]);
    const separatorLine = make("div", { className: "command-line" }, [
        make("span", { textContent: "─".repeat(hostname.length) }),
    ]);
    return [hostnameLine, separatorLine];
}

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

    fetchTextWrapper.append(...makeFastfetchHeader(hostname));

    const fetchModules = createFetchModules(config.fetchModules);
    const context = {
        config,
        fetchImage,
        fetchTextWrapper,
        fingerPrintInfo,
    };
    fetchModules.forEach((module) => module.render(context));
}
updateFingerprinting(defaultConfig);
