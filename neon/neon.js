import { make } from "../js/util/injectionUtil.js";
import { loadJson } from "../js/util/jsonUtil.js"

const input = document.getElementById("input");
const page = document.getElementById("page");
const pageSize = document.getElementById("pageSize");
[page, pageSize].forEach(el => el.addEventListener("change", render))

const {tiers, passives, weapons} = await loadJson("../neon/data.json");

const table = document.getElementById("weaponTable");
const reader = new FileReader();
reader.onload = () => {
    try {
        state.data = JSON.parse(reader.result);
        render();
    } catch (err) {
        console.error(err);
    }
};

const state = {
    data: [],        // full dataset
    filters: {},     // e.g. { type: "sword", quality: 3 }
    sort: { key: null, dir: 1 }, // dir: 1 or -1
};

input.addEventListener("change", () => {
    if (input.files.length !== 1) return;
    reader.readAsText(input.files[0]);
});


function getViewData() {
    let result = [...state.data];

    // 1. FILTERING
    for (const [key, value] of Object.entries(state.filters)) {
        if (value !== "" && value != null) {
            result = result.filter(item => String(item[key]) === String(value));
        }
    }

    // 2. SORTING
    if (state.sort.key) {
        const { key, dir } = state.sort;
        result.sort((a, b) => {
            if (a[key] < b[key]) return -1 * dir;
            if (a[key] > b[key]) return 1 * dir;
            return 0;
        });
    }

    // 3. PAGINATION
    const [p, ps] = [parseInt(page.value), parseInt(pageSize.value)]

    const start = (p - 1) * ps;
    const end = start + ps;

    return {
        total: result.length,
        pageData: result.slice(start, end)
    };
}

function render() {
    const { pageData } = getViewData();
    createTable(pageData);
}

function createTable(array) {
    table.innerHTML = "";

    const header = table.insertRow();
    ["ID", "Type", "Quality", "Blueprint", "Passive"].forEach(
        text => header.appendChild(make("th",{textContent:text}))
    );

    array.forEach(w => {
        const row = table.insertRow();

        row.insertCell().textContent = w.id;
        row.insertCell().textContent = w.t;
        row.insertCell().textContent = w.q;
        row.insertCell().textContent = w.bp;

        const passiveText = w.p
            .map(p => `type ${p.t}, tier ${p.r}`)
            .join(" | ");

        row.insertCell().textContent = passiveText;
    });
}
