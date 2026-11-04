type ElementProps<K extends keyof HTMLElementTagNameMap> = Partial<
  Omit<HTMLElementTagNameMap[K], "style" | "dataset">
> & {
  style?: Partial<CSSStyleDeclaration> | string;
  dataset?: Record<string, string | number>;
};

export function make<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElementProps<K> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  const { style, dataset, ...rest } = props;

  if (style) {
    if (typeof style === "string") el.style.cssText = style;
    else Object.assign(el.style, style);
  }
  if (dataset) Object.assign(el.dataset, dataset);
  Object.assign(el, rest);
  if (children.length) el.append(...children);

  return el;
}

export const $ = <T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T | null => root.querySelector<T>(selector);

export const $$ = <T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T[] => [...root.querySelectorAll<T>(selector)];

export function doTimestamps(): void {
  const now = new Date().toTimeString().slice(0, 5);
  $$(".discord-timestamp").forEach((el) => (el.textContent = now));
}
