import {loadJson} from "../js/util/jsonUtil.js"
import {make} from "../js/util/injectionUtil.js"

const data = await loadJson("../media/json/timezone-list.json");
const wrapper = document.getElementById("timeWrapper");
const searchInput = document.getElementById("timezoneSearch");

// Listen for typing
searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return renderList([]);

    const filtered = data
        .filter(item => item.city.toLowerCase().includes(query))
        .sort((a, b) => {
            const aCity = a.city.toLowerCase();
            const bCity = b.city.toLowerCase();

            const aStarts = aCity.startsWith(query);
            const bStarts = bCity.startsWith(query);

            // If one starts with the query and the other doesn't, prioritize it
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            // Otherwise, fallback to alphabetical
            return aCity.localeCompare(bCity);
        });

    renderList(filtered);
});


function renderList(list) {
    wrapper.innerHTML = "";
    const date = new Date();

    for (var i in list){
        if (i>=4) return; 
        const flexBox = make("div", {className: "result-box"});
        flexBox.append(
            make("div",{
                textContent: date.toLocaleString("en-US", 
                    { 
                        timeZone: list[i].timezone,
                        hour12: false,
                        hour: '2-digit', 
                        minute:'2-digit'
                    }),
                className:"clock"
            }),
            make("div", {
                innerHTML:
                    `<strong>${list[i].city}</strong><br>
                    <small> - ${list[i].timezone}</small>`
            })
        );
        wrapper.appendChild(flexBox);
    }
}

/*
data: 
[
    {
        "city": "Aalborg",
        "timezone": "Europe/Copenhagen"
    },
    {
        "city": "Aba",
        "timezone": "Africa/Lagos"
    }
]
*/

