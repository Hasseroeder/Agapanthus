export function setCookie(name: string, value: unknown, daysToLive = 30): void {
  const expires = new Date(Date.now() + daysToLive * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(String(value))}; expires=${expires}; path=/`;
}

export function getCookie(name: string): string | null {
  const match = decodeURIComponent(document.cookie)
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}

export function deleteCookie(name: string): void {
  setCookie(name, "", -1);
}

export function toggleCookie(name: string, daysToLive = 30): boolean {
  const next = getCookie(name) !== "true";
  setCookie(name, next, daysToLive);
  return next;
}
