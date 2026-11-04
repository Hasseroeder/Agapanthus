export async function loadJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load JSON from ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}
