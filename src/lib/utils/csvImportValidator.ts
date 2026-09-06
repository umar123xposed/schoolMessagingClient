export interface CsvStudentRow {
  rowNumber: number; // 1-based row number as seen in Excel (Header is row 1, data starts at row 2)
  name: string;
  phoneNumber: string;
  email?: string;
}

export interface CsvValidationResult {
  isValid: boolean;
  errors: string[];
  rows: CsvStudentRow[];
  totalRows: number;
}

/**
 * Parses a single CSV line into trimmed string fields while correctly handling quotes and escaped quotes.
 */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Validates a student import CSV according to backend rules:
 * - Header must be exactly phoneNumber, name, and optionally email (case-insensitive, any order).
 * - No missing required columns, duplicate headers, or unrecognized columns.
 * - Every row validated for phone number format, required name, valid email if present.
 * - No phone or email duplicates within the file.
 * - 1-based line numbers.
 */
export function validateStudentsCsv(csvContent: string): CsvValidationResult {
  const errors: string[] = [];
  const rows: CsvStudentRow[] = [];

  // Strip BOM if present
  let cleanContent = csvContent;
  if (cleanContent.charCodeAt(0) === 0xfeff) {
    cleanContent = cleanContent.slice(1);
  }

  const rawLines = cleanContent.split(/\r?\n/);
  // Filter out trailing blank lines
  const lines: { text: string; lineIndex: number }[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const trimmed = rawLines[i].trim();
    if (trimmed.length > 0 || i < rawLines.length - 1) {
      lines.push({ text: rawLines[i], lineIndex: i + 1 });
    }
  }

  // Remove empty lines from the end
  while (lines.length > 0 && lines[lines.length - 1].text.trim() === '') {
    lines.pop();
  }

  if (lines.length === 0) {
    return {
      isValid: false,
      errors: ['The CSV file is empty. Please include the header and at least one student row.'],
      rows: [],
      totalRows: 0,
    };
  }

  // Parse header line (Row 1)
  const headerLine = lines[0].text;
  const rawHeaders = parseCsvLine(headerLine);
  const normalizedHeaders = rawHeaders.map((h) => h.toLowerCase());

  // Check for duplicate header columns
  const headerSet = new Set<string>();
  for (const h of normalizedHeaders) {
    if (h.length === 0) continue;
    if (headerSet.has(h)) {
      errors.push(`Header row contains duplicate column: "${h}"`);
    }
    headerSet.add(h);
  }

  // Recognized columns
  const recognizedColumns = ['phonenumber', 'name', 'email'];
  for (const h of normalizedHeaders) {
    if (h.length === 0) continue;
    if (!recognizedColumns.includes(h)) {
      errors.push(
        `Unrecognized column header: "${h}". Allowed headers are only "phoneNumber", "name", and optionally "email".`
      );
    }
  }

  // Required columns
  const phoneIndex = normalizedHeaders.indexOf('phonenumber');
  const nameIndex = normalizedHeaders.indexOf('name');
  const emailIndex = normalizedHeaders.indexOf('email');

  if (phoneIndex === -1) {
    errors.push('Missing required column header: "phoneNumber"');
  }
  if (nameIndex === -1) {
    errors.push('Missing required column header: "name"');
  }

  // If header has errors, stop before checking individual rows
  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      rows: [],
      totalRows: 0,
    };
  }

  if (lines.length <= 1) {
    return {
      isValid: false,
      errors: ['The CSV file only contains a header. At least one student row is required.'],
      rows: [],
      totalRows: 0,
    };
  }

  // Track duplicates within the file
  const seenPhones = new Map<string, number>(); // phone -> first rowNumber
  const seenEmails = new Map<string, number>(); // email -> first rowNumber

  const phoneRegex = /^\+[0-9]{7,15}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = lines[i].lineIndex;
    const rowText = lines[i].text.trim();

    // Skip empty lines
    if (rowText === '') continue;

    const cells = parseCsvLine(lines[i].text);

    const name = (cells[nameIndex] || '').trim();
    const phoneNumber = (cells[phoneIndex] || '').trim();
    const email = emailIndex !== -1 ? (cells[emailIndex] || '').trim() : '';

    // Validate Name
    if (!name) {
      errors.push(`Row ${rowNumber}: Name is required`);
    }

    // Validate Phone (Must include + and country code)
    if (!phoneNumber) {
      errors.push(`Row ${rowNumber}: Phone number is required`);
    } else if (!phoneNumber.startsWith('+')) {
      errors.push(
        `Row ${rowNumber}: Phone number "${phoneNumber}" must start with "+" and country code (e.g. +14155552671)`
      );
    } else if (!phoneRegex.test(phoneNumber)) {
      errors.push(
        `Row ${rowNumber}: Invalid phone number "${phoneNumber}". Must start with "+" and have 7-15 digits (e.g. +14155552671)`
      );
    } else {
      // In-file duplicate check
      const prevRow = seenPhones.get(phoneNumber);
      if (prevRow) {
        errors.push(
          `Row ${rowNumber}: Duplicate phone number "${phoneNumber}" in file (already used on row ${prevRow})`
        );
      } else {
        seenPhones.set(phoneNumber, rowNumber);
      }
    }

    // Validate Email if present
    if (email) {
      if (!emailRegex.test(email)) {
        errors.push(`Row ${rowNumber}: Invalid email format "${email}"`);
      } else {
        const lowerEmail = email.toLowerCase();
        const prevRow = seenEmails.get(lowerEmail);
        if (prevRow) {
          errors.push(
            `Row ${rowNumber}: Duplicate email "${email}" in file (already used on row ${prevRow})`
          );
        } else {
          seenEmails.set(lowerEmail, rowNumber);
        }
      }
    }

    rows.push({
      rowNumber,
      name,
      phoneNumber,
      email: email || undefined,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    rows,
    totalRows: rows.length,
  };
}

/**
 * Returns sample CSV text for admins to download as template.
 */
export function generateSampleCsv(): string {
  return `phoneNumber,name,email
+14155552671,Alice Smith (Must include +CountryCode),alice@example.com
+447911123456,Bob Jones (e.g. +1 for US or +44 for UK),bob@example.com
+923001234567,Charlie Brown (Always start with +),`;
}
