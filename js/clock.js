import {loadJson} from "./util/jsonUtil.js"
import {make} from "./util/injectionUtil.js"
import * as cookieUtil from "./util/cookieUtil.js";

const data = await loadJson("../media/json/timezone-list.json");
var wrapper, searchInput, clock;
const clockFormatting = { hour12: false, hour: "2-digit", minute: "2-digit" }
let selectedIndex = 0; 
let clockInterval = null;
let filteredList = [];

const defaultClockData = { city: "Berlin", timezone: "Europe/Berlin" };
let clockData = {
    ...defaultClockData,
    ...(JSON.parse(cookieUtil.getCookie("clockData") || "{}"))
};

function handleInput(){
    selectedIndex = 0; 
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return exitSelect();

    filteredList = data
        .filter(item => item.city.toLowerCase().includes(query))
        .sort((a, b) => {
            const aCity = a.city.toLowerCase();
            const bCity = b.city.toLowerCase();

            const aStarts = aCity.startsWith(query);
            const bStarts = bCity.startsWith(query);

            // If one starts with the query and the other doesn't, prioritize it
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            // Fallback to alphabetical
            return aCity.localeCompare(bCity);
        })
        .slice(0,4);

    renderList();
}

function exitSelect(){
    searchInput.value = "";
    filteredList = [];
    selectedIndex = -1;
    renderList();
}

function updateSelection() {
    [...wrapper.children].forEach((el, idx) => {
        el.classList.toggle("selected", idx === selectedIndex);
    });
}

function renderList() {
    wrapper.innerHTML = "";
    const date = new Date();

    filteredList.forEach((item, idx) => {
        const dateParams = { timeZone: item.timezone, ...clockFormatting}
        const box = make("div", {
            className: "result-box",
            dataset: { index: idx }
        }, [
            make("div", {
                textContent: date.toLocaleString("en-US",dateParams),
                className: "clock"
            }),
            make("div", {
                innerHTML: `<strong>${item.city}</strong><br><small> - ${item.timezone}</small>`
            })
        ]);

        box.addEventListener("click", () => {
            selectedIndex = idx;
            showClock();
        });

        box.addEventListener("mouseover", () => {
            selectedIndex = idx;
            updateSelection();
        });

        wrapper.append(box);
    });

    updateSelection();
}

function showClock() {
    clearInterval(clockInterval);
    if (filteredList[selectedIndex]) {
        clockData = filteredList[selectedIndex];
    }
    clockInterval = setInterval(setClockText, 1000);
    setClockText();
    exitSelect();
    cookieUtil.setCookie(
        "clockData", 
        JSON.stringify(clockData),
        30
    );
}

function setClockText(){
    const clockParams = { timeZone: clockData.timezone, ...clockFormatting };
    clock.textContent = new Date().toLocaleTimeString("en-US", clockParams) +" "+ clockData.city;
}

function hideClock() { 
    clearInterval(clockInterval); 
    clockInterval = null; 
    clock.textContent = ""; 
}

export async function init(outerWrapper){
    wrapper     = outerWrapper.getElementById("timeWrapper");
    searchInput = outerWrapper.getElementById("timezoneSearch");
    clock       = outerWrapper.getElementById("outputClock");

    searchInput.addEventListener("focus", () => {
        searchInput.value = clockData.city;
        hideClock();
        handleInput();
    });
    searchInput.addEventListener("input", handleInput);
    searchInput.addEventListener("blur", showClock);
    searchInput.addEventListener("keydown", (e) => {
        const list = filteredList;

        if (!list || list.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
            case "ArrowRight":
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, list.length - 1);
                updateSelection();
                break;

            case "ArrowUp":
            case "ArrowLeft":
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                updateSelection();
                break;

            case "PageDown":
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 4, list.length - 1);
                updateSelection();
                break;

            case "PageUp":
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 4, 0);
                updateSelection();
                break;

            case "Enter":
            case "Escape":
                searchInput.blur();
                showClock();
        }
    });

    showClock();
}
