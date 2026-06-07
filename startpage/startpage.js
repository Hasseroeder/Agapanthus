import { loadJson } from "/js/util/jsonUtil.js";
import { make } from "/js/util/injectionUtil.js";
import { createFastfetchModule } from "/startpage/fastfetchModules.js";

const defaultState = await loadJson("/startpage/defaultState.json");
const state = JSON.parse(JSON.stringify(defaultState));
const topWindow = document.querySelector(".top-window");
const topLastCommandSpan = document.querySelector("#top-last-command");
const topOutput = document.querySelector(".top-output");
const topInput = document.querySelector("#top-input");

const commandRegistry = [
    {
        name: "fetch",
        aliases: ["fetch", "fastfetch", "hyfetch", "neofetch"],
        command: fastfetch,
    },
    {
        name: "clear",
        aliases: ["c", "clear"],
        command: (wrapper) => {
            while (wrapper.lastChild) wrapper.lastChild.remove();
        },
    },
    {
        name: "help",
        aliases: ["h", "help"],
        command: printHelp,
    },
];

function printHelp(wrapper) {
    const innerWrapper = make("div", {
        className: "grid",
        textContent: "not yet implemented",
    });
    wrapper.append(innerWrapper);
}

function updateFingerprinting() {
    state.fingerPrintInfo = {
        ...bowser.getParser(window.navigator.userAgent).parsedResult,
        language: navigator.language || navigator.userLanguage,
    };

    state.hostname =
        state.userName +
        "@" +
        state.fingerPrintInfo.browser.name.toLowerCase() +
        "-" +
        state.fingerPrintInfo.browser.version.split(".")[0];

    Array.from(document.querySelectorAll(".hostname")).forEach(
        (el) => (el.textContent = state.hostname),
    );
}

function fastfetch(wrapper) {
    const fetchModules = state.fetchModules.map((config) =>
        createFastfetchModule(config),
    );
    const textWrapper = make("div", { className: "fetch-text-wrapper" });
    wrapper.append(textWrapper);

    const context = {
        state,
        wrapper,
        textWrapper,
    };

    //synchonous
    fetchModules.forEach((module) => module.init(context));
    //parallel
    fetchModules.forEach((module) => module.tryRenderContent(context));
}

updateFingerprinting();
fastfetch(topOutput);

topWindow.onclick = (e) => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) return;
    const tag = e.target.tagName.toLowerCase();
    if (["a", "button", "input"].includes(tag)) return;
    if (e.target.isContentEditable) return;
    topInput.focus();
};

topInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const input = topInput.value;
    topInput.value = "";
    while (topOutput.lastChild) topOutput.lastChild.remove();
    topLastCommandSpan.textContent = input;

    const commandObj = commandRegistry.find((command) =>
        command.aliases.includes(input),
    );
    if (!commandObj) return;
    console.log(commandObj);
    commandObj.command(topOutput);
});
