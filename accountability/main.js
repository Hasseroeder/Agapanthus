const sheetID = "1GMmOfGecDvzkK2NKv8Hc2iFOYlCIAwVM1c_nGfZ5Lvk"
const TAB_NAME = "TODO"
const data = await fetch("https://opensheet.elk.sh/"+sheetID+"/"+TAB_NAME)
  .then(r => r.json());

var currentIndex = 0; 
const today = new Date().toISOString().split("T")[0];
const todayIndex = data.findIndex(row => row.Date === today);
if (todayIndex !== -1) currentIndex = todayIndex;

const els = {
    prev_date:document.getElementById("prev-date"),
    next_date:document.getElementById("next-date"),
    date_label:document.getElementById("current-date-label"),
    morning_plans:document.getElementById("morning-plans"),
    evening_plans:document.getElementById("evening-plans"),
    therapy:document.getElementById("therapy"),
    work: document.getElementById("work")
}

function updateUI() {
    if (!data.length) return;

    const row = data[currentIndex];

    els.date_label.textContent = `${row.Day} — ${row.Date}`;
    els.morning_plans.textContent = row.Morning_Plans || "none";
    els.evening_plans.textContent = row.Evening_Plans || "none";
    els.therapy.textContent = row.Therapy || "none";
    els.work.textContent = row.Work || "none";
}

els.prev_date.addEventListener("click", () => changeIndex(-1));
els.next_date.addEventListener("click", () => changeIndex(1));

function changeIndex(value){
    currentIndex += value;
    currentIndex = Math.max(currentIndex, 0);
    currentIndex = Math.min(currentIndex, data.length-1);
    updateUI();
}

updateUI();
/*
Data Structure:
    [
        {
            "Date": "2025-01-16", "Day": "Friday", "Evening_Plans": "-", "Morning_Plans": "-", "Therapy": "Single 9:00-10:00", "Work": "13:00-21:30"
        },{
            "Date": "2025-01-17", "Day": "Saturday", "Evening_Plans": "-", "Morning_Plans": "-", "Therapy": "-", "Work": "-"
        }
    ]
*/