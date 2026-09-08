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
 * Cleans Excel-exported formula wrappers (e.g. ="...") or single-quote escapes ('...)
 */
export function cleanCsvField(val: string): string {
  let s = (val || '').trim();
  if (s.startsWith('=')) {
    s = s.slice(1).trim();
    if (s.startsWith('"') && s.endsWith('"')) {
      s = s.slice(1, -1).trim();
    }
  }
  if (s.startsWith("'")) {
    s = s.slice(1).trim();
  }
  return s;
}

const SCIENTIFIC_NOTATION_REGEX = /^[+-]?\d+(?:\.\d+)?[eE][+-]?\d+$/i;

/**
 * Checks if a value is in scientific notation (e.g. 9.23001E+11 created by Excel).
 * Detects if Excel truncated digits by checking if exponent adds trailing zeros.
 */
export function parseScientificPhone(val: string): { isScientific: boolean; isTruncated: boolean; value: string } {
  const trimmed = val.trim();
  if (!SCIENTIFIC_NOTATION_REGEX.test(trimmed)) {
    return { isScientific: false, isTruncated: false, value: trimmed };
  }

  const num = Number(trimmed);
  if (isNaN(num) || !isFinite(num)) {
    return { isScientific: true, isTruncated: true, value: trimmed };
  }

  const integerStr = BigInt(Math.round(num)).toString();
  const parts = trimmed.split(/[eE]/i);
  const mantissa = parts[0].replace(/^[+-]/, '');
  const exponent = parseInt(parts[1], 10);
  const decimalDigits = mantissa.includes('.') ? mantissa.split('.')[1].length : 0;
  const zerosAdded = exponent - decimalDigits;

  // If Excel added 3 or more trailing zeros, the original digits were truncated by Excel
  const isTruncated = zerosAdded >= 3;

  return {
    isScientific: true,
    isTruncated,
    value: integerStr,
  };
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

    const rawCells = parseCsvLine(lines[i].text);
    const cells = rawCells.map(cleanCsvField);

    const name = (cells[nameIndex] || '').trim();
    const rawPhone = (cells[phoneIndex] || '').trim();
    const email = emailIndex !== -1 ? (cells[emailIndex] || '').trim() : '';

    // Check for Excel Scientific Notation (e.g. 9.23001E+11)
    const sci = parseScientificPhone(rawPhone);
    let phoneNumber = '';

    if (sci.isScientific) {
      if (sci.isTruncated) {
        errors.push(
          `Row ${rowNumber}: Phone number "${rawPhone}" was converted to scientific notation by Microsoft Excel and lost digits. In Excel: select the phone column > Right Click > Format Cells > choose "Text" (or Number with 0 decimals) before entering numbers.`
        );
      } else {
        phoneNumber = `+${sci.value}`;
      }
    } else {
      let clean = rawPhone.replace(/[\s()-]/g, '');
      if (clean && !clean.startsWith('+')) {
        clean = `+${clean}`;
      }
      phoneNumber = clean;
    }

    // Validate Name
    if (!name) {
      errors.push(`Row ${rowNumber}: Name is required`);
    }

    // Validate Phone (7-15 digits)
    if (!rawPhone) {
      errors.push(`Row ${rowNumber}: Phone number is required`);
    } else if (sci.isScientific && sci.isTruncated) {
      // Error already pushed above with clear Excel guidance
    } else if (!phoneRegex.test(phoneNumber)) {
      errors.push(
        `Row ${rowNumber}: Invalid phone number "${rawPhone}". Must contain 7-15 digits.`
      );
    } else {
      // In-file duplicate check
      const prevRow = seenPhones.get(phoneNumber);
      if (prevRow) {
        errors.push(
          `Row ${rowNumber}: Duplicate phone number "${rawPhone}" in file (already used on row ${prevRow})`
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
 * Normalizes CSV content so that every phone number column value starts with '+'.
 * Also cleans Excel formula wrappers (="...") and expands exact scientific notation.
 */
export function normalizeCsvContentWithPhonePlus(csvContent: string): string {
  let cleanContent = csvContent;
  let hasBom = false;
  if (cleanContent.charCodeAt(0) === 0xfeff) {
    hasBom = true;
    cleanContent = cleanContent.slice(1);
  }

  const lines = cleanContent.split(/\r?\n/);
  if (lines.length <= 1) return csvContent;

  const rawHeaders = parseCsvLine(lines[0]);
  const normalizedHeaders = rawHeaders.map((h) => cleanCsvField(h).toLowerCase());
  const phoneIndex = normalizedHeaders.indexOf('phonenumber');
  if (phoneIndex === -1) return csvContent;

  const newLines: string[] = [lines[0]];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      newLines.push(line);
      continue;
    }

    const cells = parseCsvLine(line).map(cleanCsvField);
    if (cells.length > phoneIndex) {
      const raw = cells[phoneIndex];
      const sci = parseScientificPhone(raw);
      const phone = sci.isScientific && !sci.isTruncated ? sci.value : raw.replace(/[\s()-]/g, '');
      if (phone && !phone.startsWith('+')) {
        cells[phoneIndex] = `+${phone}`;
      } else {
        cells[phoneIndex] = phone;
      }
    }
    const formattedLine = cells
      .map((c) => (c.includes(',') || c.includes('"') || c.includes('\n') ? `"${c.replace(/"/g, '""')}"` : c))
      .join(',');
    newLines.push(formattedLine);
  }

  const result = newLines.join('\n');
  return hasBom ? '\ufeff' + result : result;
}

/**
 * Returns sample CSV text for admins to download as template.
 */
export function generateSampleCsv(): string {
  return `phoneNumber,name,email
+14155552671,Alice Smith,alice@example.com
+447911123456,Bob Jones,bob@example.com
+923001234567,Charlie Brown,`;
}
