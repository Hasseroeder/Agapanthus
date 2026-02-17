import { make } from "../js/util/injectionUtil.js";
import { loadJson } from "../js/util/jsonUtil.js"
import { capitalizeFirstLetter } from "../js/util/stringUtil.js"

const input = document.getElementById("input");
const page = document.getElementById("page");
const pageSize = document.getElementById("pageSize");
[page, pageSize].forEach(el => el.addEventListener("change", render))

const [weapons, passives, buffs] = await Promise.all([
    loadJson("media/json/weapons.json"),
    loadJson("media/json/passives.json"),
    loadJson("media/json/buffs.json")
]);

const tiers =[
    {"min":0,  "letter":"c", "name":"common"},
    {"min":20, "letter":"u", "name":"uncommon"},
    {"min":40, "letter":"r", "name":"rare"},
    {"min":60, "letter":"e", "name":"epic"},
    {"min":80, "letter":"m", "name":"mythic"},
    {"min":94, "letter":"l", "name":"legendary"},
    {"min":100,"letter":"f", "name":"fabled"}
];

const table = document.getElementById("weaponTable");
const reader = new FileReader();
reader.onload = () => {
    try {
        const text = reader.result;
        const sanitized = text.replace(/[\u0000-\u0019]+/g, "");
        state.data = JSON.parse(sanitized);
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
    const {p,ps} = clampFromData(result);

    return {
        total: result.length,
        pageData: result.slice((p-1)*ps, p*ps)
    };
}

function render() {
    const { pageData } = getViewData();
    createTable(pageData);
}

function clampFromData(data){
    const ps = Math.max(parseInt(pageSize.value) || 100, 1);
    const p = Math.max(parseInt(page.value) || 1, 1);
    const max_p = Math.max(1, Math.ceil(data.length / ps));
    const new_p = Math.min(p, max_p)

    pageSize.value = ps;
    page.value = new_p;
    page.max = max_p;

    return {p:new_p, ps}
}

function createTable(array) {
    table.innerHTML = "";

    const header = table.insertRow();
    ["ID","Image", "Type", "Quality", "Blueprint"/*, "Passive"*/].forEach(
        text => header.appendChild(make("th",{textContent:text}))
    );

    array.forEach(w => {
        const weaponData = weapons[w.t];
        const row = table.insertRow();

        const IDcell = row.insertCell();
        IDcell.append(make("code",{className:"id-code", textContent: w.id}));

        const imageCell = row.insertCell();
        w.p.forEach(p=>{
            const tier = tiers[p.r];
            const staticData = passives[p.t-1];
            imageCell.append(
                make("img", {
                    src:"../neon/media/battleEmojis/"+tier.letter+"_"+staticData.slug+".png",
                    style:"height:1.2rem"
                })
            )
        });

        row.insertCell().textContent = 100 + w.t + " - " + capitalizeFirstLetter(weaponData.slug);
        row.insertCell().textContent = w.q + "%";
        row.insertCell().textContent = w.bp;

        /*
        const passiveCell = row.insertCell();
        const passiveText = w.p
            .map(p => tiers[p.r].name + " " + capitalizeFirstLetter(passives[p.t]))
            .join(" | ");
        */
    });
}
