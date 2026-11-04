export function clampNumber(min: number, max: number, value: number): number {
  return Math.min(Math.max(value, min), max);
}

export function clampedInput(el: HTMLInputElement, value: number): void {
  if (Number.isNaN(value)) return;
  const min = parseFloat(el.min);
  const max = parseFloat(el.max);
  el.value = String(clampNumber(min, max, value));
}

export function roundToDecimals(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  wait = 200,
  immediate = false,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    const callNow = immediate && !timeoutId;
    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) fn.apply(this, args);
    }, wait);

    if (callNow) fn.apply(this, args);
  };
}
