import { loadJson } from "/js/util/jsonUtil.js";
import { make } from "/js/util/injectionUtil.js";
import { createFastfetchModule } from "/startpage/fastfetchModules.js";

const defaultConfig = await loadJson("/startpage/fastfetchConfig.json");
const lastCommandSpan = document.querySelector("#last-command");

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

    fastfetch({
        config,
        fingerPrintInfo,
        hostname,
    });
}

function fastfetch({ config, fingerPrintInfo, hostname }) {
    const fetchModules = config.fetchModules.map((config) =>
        createFastfetchModule(config),
    );
    const fetchWrapper = document.querySelector(".top-window-output");
    while (fetchWrapper.lastChild) fetchWrapper.lastChild.remove();
    const fetchTextWrapper = make("div", { className: "fetch-text-wrapper" });
    fetchWrapper.append(fetchTextWrapper);

    lastCommandSpan.textContent = "fetch";

    const context = {
        config,
        fingerPrintInfo,
        hostname,
        fetchWrapper,
        fetchTextWrapper,
    };

    //synchonous
    fetchModules.forEach((module) => module.init(context));
    //parallel
    fetchModules.forEach((module) => module.tryRenderContent(context));
}

updateFingerprinting(defaultConfig);
