import { make } from "../js/util/injectionUtil.js";
import { loadJson } from "../js/util/jsonUtil.js"
import { capitalizeFirstLetter } from "../js/util/stringUtil.js"

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

    return {
        total: result.length,
        pageData: result.slice((p-1)*ps, p*ps)
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

        const IDcell = row.insertCell();
        IDcell.append(make("code",{className:"id-code", textContent: w.id}));

        row.insertCell().textContent = 100 + w.t + " - " + capitalizeFirstLetter(weapons[w.t]);
        row.insertCell().textContent = w.q + "%";
        row.insertCell().textContent = w.bp;

        const passiveCell = row.insertCell();
        w.p.forEach(p=>
            passiveCell.append(
            make("img", {
                src:"../neon/media/passives/"+tiers[p.r].letter+"_"+passives[p.t]+".png",
                style:"height:1.2rem"
            })
        ));

        const passiveText = w.p
            .map(p => tiers[p.r].name + " " + capitalizeFirstLetter(passives[p.t]))
            .join(" | ");
    });
}
