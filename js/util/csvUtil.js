function parseCSV(input, delimiter = ',') {
    const rows = [];
    let row = [];
    let field = '';

    let inQuotes = false;
    let i = 0;

    while (i < input.length) {
        const char = input[i];

        if (inQuotes) {
            if (char === '"') {
                const nextChar = input[i + 1];
                if (nextChar === '"') {
                    // Escaped quote
                    field += '"';
                    i += 2;
                    continue;
                } else {
                    // End of quoted field
                    inQuotes = false;
                    i++;
                    continue;
                }
            } else {
                // Any character inside quotes (including newlines, delimiters)
                field += char;
                i++;
                continue;
            }
        } else {
            if (char === '"') {
                // Start of quoted field
                inQuotes = true;
                i++;
                continue;
            } else if (char === delimiter) {
                // End of field
                row.push(field);
                field = '';
                i++;
                continue;
            } else if (char === '\r') {
                // Handle CR (possibly CRLF)
                const nextChar = input[i + 1];
                if (nextChar === '\n') i++;
                row.push(field);
                field = '';
                rows.push(row);
                row = [];
                i++;
                continue;
            } else if (char === '\n') {
                // LF line break
                row.push(field);
                field = '';
                rows.push(row);
                row = [];
                i++;
                continue;
            } else {
                field += char;
                i++;
                continue;
            }
        }
    }

    // Push last field/row if anything left
    if (field.length > 0 || inQuotes || row.length > 0) {
        row.push(field);
    }
    if (row.length > 0) {
        rows.push(row);
    }

    return rows;
}

export async function load(path){
    const raw = await fetch(path).then(res=>res.text());
    const [header, ...dataRows] = parseCSV(raw);
    return dataRows.map(row =>
        Object.fromEntries(header.map((h, i) => [h, row[i]]))
    );
}