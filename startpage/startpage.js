import { loadJson } from "/js/util/jsonUtil.js";
import { make } from "/js/util/injectionUtil.js";
import { createFastfetchModule } from "/startpage/fastfetchModules.js";
import { Prompt, Line } from "/startpage/lineUtil.js";

const defaultState = await loadJson("/startpage/defaultState.json");
const state = JSON.parse(JSON.stringify(defaultState));
const topWindow = document.querySelector(".body-wrapper");
const history = document.querySelector(".command-history");
const input = make("input", { type: "text" });
topWindow.append(
    new Prompt({ className: "command-line command-input", child: input }).el,
);

const commandRegistry = [
    {
        prettyName: "fetch",
        aliases: ["fetch", "fastfetch", "hyfetch", "neofetch"],
        description:
            "fetches interesting or useful information about current session",
        command: fastfetch,
    },
    {
        prettyName: "clear",
        aliases: ["c", "clear"],
        description: "clears up command history",
        command: (wrapper) => {
            while (wrapper.lastChild) wrapper.lastChild.remove();
        },
    },
    {
        prettyName: "help",
        aliases: ["h", "help"],
        description: "shows a list of commands, descriptions and aliases",
        command: printHelp,
    },
    {
        prettyName: "updateFingerprinting",
        aliases: ["updateFingerprinting"],
        description:
            "debug function used to refresh outdated fingerprinting info",
        command: updateFingerprinting,
    },
];

function printHelp(wrapper) {
    const helpLines = commandRegistry.flatMap((command) => [
        new Line({
            textContent: command.prettyName,
        }),
        new Line({
            textContent: `  ${command.description}`,
        }),
        new Line({
            textContent: `  [ ${command.aliases.join(", ")} ]`,
        }),
    ]);

    wrapper.append(new Line(), ...helpLines, new Line());
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

    Prompt.array.forEach((prompt) => (prompt.hostname = state.hostname));
}

function fastfetch(wrapper) {
    const fetchModules = state.fetchModules.map((config) =>
        createFastfetchModule(config),
    );
    const fetchWrapper = make("div", { className: "fetch-wrapper" });
    const textWrapper = make("div", { className: "fetch-text-wrapper" });
    fetchWrapper.append(textWrapper);
    wrapper.append(
        make("div", { className: "command-line", textContent: " " }),
        fetchWrapper,
        make("div", { className: "command-line", textContent: " " }),
    );

    const context = {
        state,
        fetchWrapper,
        textWrapper,
    };

    //synchonous
    fetchModules.forEach((module) => module.init(context));
    //parallel
    fetchModules.forEach((module) => module.tryRenderContent(context));
}

document.onclick = (e) => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) return;
    const tag = e.target.tagName.toLowerCase();
    if (["a", "button", "input"].includes(tag)) return;
    if (e.target.isContentEditable) return;
    input.focus();
};

input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const inputStr = event.target.value;
    event.target.value = "";
    history.append(
        new Prompt({ hostname: state.hostname, command: inputStr }).el,
    );

    const commandTokens = inputStr.split(" ");
    const commandToken = commandTokens[0];
    const argumentTokens = commandTokens.slice(1);

    const commandObj = commandRegistry.find((command) =>
        command.aliases.includes(commandToken),
    );
    if (!commandObj) return;
    commandObj.command(history);
});

updateFingerprinting();
