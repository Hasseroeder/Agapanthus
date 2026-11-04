import { loadCsv } from "../utils/csv";
import { $, make } from "../utils/dom";

interface RawArtPiece {
  title: string;
  description: string;
  category: string;
  creationDate: string;
  filenames: string;
}

class ArtPiece {
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly creationDate: number;
  readonly filenames: string[];
  readonly el: HTMLImageElement;
  private _idx = 0;

  constructor(raw: RawArtPiece) {
    this.title = raw.title;
    this.description = raw.description;
    this.category = raw.category;
    this.creationDate = Date.parse(raw.creationDate) || 0;
    this.filenames = raw.filenames.split(",").map((name) => name.trim());
    this.el = make("img", {
      className:
        this.filenames.length > 1
          ? "art-card__image art-card__image--multi"
          : "art-card__image",
    });
    this.idx = 0;
  }

  get idx(): number {
    return this._idx;
  }

  set idx(value: number) {
    const len = this.filenames.length;
    this._idx = ((value % len) + len) % len;
    const file = this.filenames[this._idx];
    this.el.src = `/gallery/images/${file}`;
    this.el.alt = file;
  }
}

export async function initGallery(): Promise<void> {
  const controls = $<HTMLDivElement>(".gallery__controls");
  const wrapper = $<HTMLDivElement>("#artWrapper");
  if (!controls || !wrapper) return;

  const [prevButton, select, nextButton] = [...controls.children] as [
    HTMLButtonElement,
    HTMLSelectElement,
    HTMLButtonElement,
  ];

  const rows = await loadCsv<RawArtPiece>("/gallery/manifest.csv");
  const pieces = rows.map((row) => new ArtPiece(row));
  const categoryList = [...new Set(pieces.map((p) => p.category))];

  let currentIdx = 0;

  const render = () => {
    wrapper.innerHTML = "";
    const currentCategory = categoryList[currentIdx];

    pieces
      .filter((piece) => piece.category === currentCategory)
      .sort((a, b) => a.creationDate - b.creationDate)
      .forEach((piece) => {
        piece.idx = 0;

        const viewerChildren =
          piece.filenames.length === 1
            ? [piece.el]
            : [
                make("button", {
                  className: "art-card__nav",
                  textContent: "<<",
                  onclick: () => piece.idx--,
                }),
                piece.el,
                make("button", {
                  className: "art-card__nav",
                  textContent: ">>",
                  onclick: () => piece.idx++,
                }),
              ];

        const card = make("div", { className: "art-card" }, [
          make("div", { className: "art-card__viewer" }, viewerChildren),
          make("h3", { className: "art-card__title", textContent: piece.title }),
          make("p", { className: "art-card__description", innerHTML: piece.description }),
        ]);

        wrapper.append(card);
      });
  };

  const syncUI = () => {
    const current = categoryList[currentIdx];
    window.location.hash = current;
    select.value = current;
    render();
  };

  const setIdx = (value: number) => {
    const len = categoryList.length;
    currentIdx = ((value % len) + len) % len;
    syncUI();
  };

  const setCategory = (name: string) => {
    const idx = categoryList.indexOf(name);
    if (idx !== -1) currentIdx = idx;
    syncUI();
  };

  categoryList.forEach((category) =>
    select.add(make("option", { text: category, value: category })),
  );

  setCategory(window.location.hash.slice(1));

  select.addEventListener("change", () => setCategory(select.value));
  prevButton.addEventListener("click", () => setIdx(currentIdx - 1));
  nextButton.addEventListener("click", () => setIdx(currentIdx + 1));

  // Idle prefetch
  setTimeout(() => {
    const queue = pieces.map((p) => p.filenames);
    const schedule =
      window.requestIdleCallback ??
      ((cb: IdleRequestCallback) =>
        setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 10 }), 1));

    const idlePrefetch = (deadline: IdleDeadline) => {
      const BATCH = 3;
      while (deadline.timeRemaining() > 0 && queue.length) {
        const files = queue.shift()!;
        files.slice(0, BATCH).forEach((fn) => {
          const img = new Image();
          img.decoding = "async";
          img.src = `/gallery/images/${fn}`;
        });
      }
      if (queue.length) schedule(idlePrefetch);
    };

    schedule(idlePrefetch);
  }, 500);
}
