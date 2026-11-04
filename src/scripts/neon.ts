import { $, make } from "../utils/dom";
import { loadJson } from "../utils/json";
import { capitalize } from "../utils/string";

interface WeaponPassive {
  r: number;
  t: number;
}

interface WeaponExport {
  id: string;
  t: number;
  q: number;
  bp: string | number;
  p: WeaponPassive[];
  [key: string]: unknown;
}

interface StaticEntry {
  name: string;
  slug: string;
}

interface Tier {
  min: number;
  letter: string;
  name: string;
}

const TIERS: readonly Tier[] = [
  { min: 0, letter: "c", name: "common" },
  { min: 20, letter: "u", name: "uncommon" },
  { min: 40, letter: "r", name: "rare" },
  { min: 60, letter: "e", name: "epic" },
  { min: 80, letter: "m", name: "mythic" },
  { min: 94, letter: "l", name: "legendary" },
  { min: 100, letter: "f", name: "fabled" },
];

export async function initNeon(): Promise<void> {
  const input = $<HTMLInputElement>("#input");
  const pageInput = $<HTMLInputElement>("#page");
  const pageSizeInput = $<HTMLInputElement>("#pageSize");
  const table = $<HTMLTableElement>("#weaponTable");
  if (!input || !pageInput || !pageSizeInput || !table) return;

  const [weapons, passives] = await Promise.all([
    loadJson<StaticEntry[]>("/neon/media/json/weapons.json"),
    loadJson<StaticEntry[]>("/neon/media/json/passives.json"),
    loadJson<StaticEntry[]>("/neon/media/json/buffs.json"),
  ]);

  const state = {
    data: [] as WeaponExport[],
    filters: {} as Record<string, string | number>,
    sort: { key: null as keyof WeaponExport | null, dir: 1 as 1 | -1 },
  };

  const clampPagination = (totalItems: number) => {
    const ps = Math.max(parseInt(pageSizeInput.value, 10) || 100, 1);
    const p = Math.max(parseInt(pageInput.value, 10) || 1, 1);
    const maxP = Math.max(1, Math.ceil(totalItems / ps));
    const clampedP = Math.min(p, maxP);

    pageSizeInput.value = String(ps);
    pageInput.value = String(clampedP);
    pageInput.max = String(maxP);

    return { p: clampedP, ps };
  };

  const getViewData = () => {
    let result = [...state.data];

    for (const [key, value] of Object.entries(state.filters)) {
      if (value !== "" && value != null) {
        result = result.filter((item) => String(item[key]) === String(value));
      }
    }

    if (state.sort.key) {
      const { key, dir } = state.sort;
      result.sort((a, b) => {
        const va = a[key] as string | number;
        const vb = b[key] as string | number;
        return va < vb ? -dir : va > vb ? dir : 0;
      });
    }

    const { p, ps } = clampPagination(result.length);
    return {
      total: result.length,
      pageData: result.slice((p - 1) * ps, p * ps),
    };
  };

  const renderTable = (items: WeaponExport[]) => {
    table.innerHTML = "";

    const header = table.insertRow();
    ["ID", "Image", "Type", "Quality", "Blueprint"].forEach((text) =>
      header.append(make("th", { textContent: text })),
    );

    items.forEach((w) => {
      const weaponData = weapons[w.t];
      const row = table.insertRow();

      row.insertCell().append(make("code", { className: "neon__id", textContent: w.id }));

      const imageCell = row.insertCell();
      w.p.forEach((p) => {
        const tier = TIERS[p.r];
        const staticData = passives[p.t - 1];
        if (!tier || !staticData) return;

        imageCell.append(
          make("img", {
            className: "neon__emoji",
            src: `/neon/media/battleEmojis/${tier.letter}_${staticData.slug}.png`,
            alt: `${tier.name} ${staticData.name}`,
          }),
        );
      });

      row.insertCell().textContent = `${100 + w.t} - ${capitalize(weaponData?.slug ?? "")}`;
      row.insertCell().textContent = `${w.q}%`;
      row.insertCell().textContent = String(w.bp);
    });
  };

  const render = () => renderTable(getViewData().pageData);

  [pageInput, pageSizeInput].forEach((el) => el.addEventListener("change", render));

  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      state.data = JSON.parse(text.replace(/[\u0000-\u0019]+/g, ""));
      render();
    } catch (err) {
      console.error("Failed to parse Neon export:", err);
    }
  });
}
