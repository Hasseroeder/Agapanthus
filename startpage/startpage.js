import { loadJson } from "/js/util/jsonUtil.js";
import { make } from "/js/util/injectionUtil.js";
import { createFetchModules } from "/startpage/fastfetchModules.js";

const wrapper = document.querySelector(".fastfetch-wrapper");
const fetchTextWrapper = document.querySelector(".fetch-text-wrapper");
const defaultConfig = await loadJson("/startpage/fastfetchConfig.json");

async function updateFingerprinting(config) {
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

    //synchonous
    fetchModules.forEach((module) => module.init(context));
    //parallel
    fetchModules.forEach((module) => module.tryRenderContent(context));
}
updateFingerprinting(defaultConfig);
