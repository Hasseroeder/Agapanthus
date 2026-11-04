import { getCookie, toggleCookie } from "../utils/cookie";
import { $, make } from "../utils/dom";

interface Blinkie {
  file: string;
  href?: string;
  cookie?: string;
}

const BLINKIES: Blinkie[] = [
  { file: "blinkiesCafe-7m.gif", href: "https://blinkies.cafe/" },
  { file: "blinkiesCafe-ji.gif", href: "https://blinkies.cafe/" },
  { file: "autism_blinkie2.gif", cookie: "tbh" },
  { file: "obs_blinkie.gif", href: "https://discord.gg/owobot" },
  { file: "anydice_blinkie.gif", href: "https://anydice.com/" },
  { file: "dontasktoask_blinkie.png", href: "https://dontasktoask.com/" },
];

function pickRandom<T>(items: readonly T[], count = 4): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function syncTbhCursor(): void {
  document.body.classList.toggle("tbh", getCookie("tbh") === "true");
}

export function initFooter(): void {
  syncTbhCursor();

  if ("cookieStore" in window && typeof window.cookieStore?.addEventListener === "function") {
    window.cookieStore.addEventListener("change", syncTbhCursor);
  }

  const footer = $<HTMLElement>(".footer");
  if (!footer) return;

  pickRandom(BLINKIES, 4).forEach((blinkie) => {
    const img = make("img", {
      src: `/media/blinkies/${blinkie.file}`,
      alt: blinkie.file,
      className: "footer__blinkie",
      loading: "lazy",
      decoding: "async",
    });

    const link = make("a", { className: "footer__link", target: "_blank" }, [img]);

    if (blinkie.href) link.href = blinkie.href;
    if (blinkie.cookie) {
      const cookieName = blinkie.cookie;
      link.addEventListener("click", () => {
        toggleCookie(cookieName, 30);
        syncTbhCursor();
      });
    }

    footer.append(link);
  });
}
