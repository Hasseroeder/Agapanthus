export function parseCsv(input: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const next = input[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\r" || char === "\n") {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || inQuotes || row.length > 0) row.push(field);
  if (row.length > 0) rows.push(row);

  return rows;
}

export async function loadCsv<T = Record<string, string>>(path: string): Promise<T[]> {
  const raw = await fetch(path).then((res) => res.text());
  const [header = [], ...dataRows] = parseCsv(raw);
  return dataRows.map((row) =>
    Object.fromEntries(header.map((key, i) => [key, row[i] ?? ""])) as T,
  );
}
