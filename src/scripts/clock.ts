import { getCookie, setCookie } from "../utils/cookie";
import { $, make } from "../utils/dom";
import { loadJson } from "../utils/json";

interface TimezoneEntry {
  city: string;
  timezone: string;
}

const CLOCK_FORMAT: Intl.DateTimeFormatOptions = {
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
};

const DEFAULT_CLOCK: TimezoneEntry = {
  city: "Berlin",
  timezone: "Europe/Berlin",
};

function loadSavedClock(): TimezoneEntry {
  try {
    const raw = getCookie("clockData");
    return raw ? { ...DEFAULT_CLOCK, ...JSON.parse(raw) } : { ...DEFAULT_CLOCK };
  } catch {
    return { ...DEFAULT_CLOCK };
  }
}

export async function initClock(): Promise<void> {
  const wrapper = $<HTMLDivElement>("#timeWrapper");
  const searchInput = $<HTMLInputElement>("#timezoneSearch");
  const clockEl = $<HTMLDivElement>("#outputClock");
  if (!wrapper || !searchInput || !clockEl) return;

  const data = await loadJson<TimezoneEntry[]>("/media/json/timezone-list.json");

  let clockData = loadSavedClock();
  let selectedIndex = 0;
  let clockInterval: ReturnType<typeof setInterval> | null = null;
  let filteredList: TimezoneEntry[] = [];

  const setClockText = () => {
    const time = new Date().toLocaleTimeString("en-US", {
      timeZone: clockData.timezone,
      ...CLOCK_FORMAT,
    });
    clockEl.textContent = `${time} ${clockData.city}`;
  };

  const updateSelection = () => {
    [...wrapper.children].forEach((el, idx) => {
      el.classList.toggle("clock-picker__item--selected", idx === selectedIndex);
    });
  };

  const renderList = () => {
    wrapper.innerHTML = "";
    const now = new Date();

    filteredList.forEach((item, idx) => {
      const timeStr = now.toLocaleString("en-US", {
        timeZone: item.timezone,
        ...CLOCK_FORMAT,
      });

      const box = make(
        "div",
        { className: "clock-picker__item", dataset: { index: idx } },
        [
          make("div", { className: "clock-picker__time", textContent: timeStr }),
          make("div", {
            className: "clock-picker__location",
            innerHTML: `<strong>${item.city}</strong><br><small> - ${item.timezone}</small>`,
          }),
        ],
      );

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
  };

  const exitSelect = () => {
    searchInput.value = "";
    filteredList = [];
    selectedIndex = -1;
    renderList();
  };

  const showClock = () => {
    if (clockInterval) clearInterval(clockInterval);
    if (filteredList[selectedIndex]) {
      clockData = filteredList[selectedIndex];
    }
    clockInterval = setInterval(setClockText, 1000);
    setClockText();
    exitSelect();
    setCookie("clockData", JSON.stringify(clockData), 30);
  };

  const hideClock = () => {
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = null;
    clockEl.textContent = "";
  };

  const handleInput = () => {
    selectedIndex = 0;
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return exitSelect();

    filteredList = data
      .filter((item) => item.city.toLowerCase().includes(query))
      .sort((a, b) => {
        const aCity = a.city.toLowerCase();
        const bCity = b.city.toLowerCase();
        const aStarts = aCity.startsWith(query);
        const bStarts = bCity.startsWith(query);

        if (aStarts !== bStarts) return aStarts ? -1 : 1;
        return aCity.localeCompare(bCity);
      })
      .slice(0, 4);

    renderList();
  };

  searchInput.addEventListener("focus", () => {
    searchInput.value = clockData.city;
    hideClock();
    handleInput();
  });

  searchInput.addEventListener("input", handleInput);
  searchInput.addEventListener("blur", showClock);

  searchInput.addEventListener("keydown", (e) => {
    if (!filteredList.length) return;
    const max = filteredList.length - 1;

    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, max);
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
        selectedIndex = Math.min(selectedIndex + 4, max);
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
        break;
    }
  });

  showClock();
}
