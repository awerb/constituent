/**
 * CSV Import Service
 * Handles importing constituents and cases from CSV files
 * Supports common CSV issues: encoding, quoted fields, trailing commas
 */

import { parse } from "csv-parse/sync";

export interface ImportError {
  row: number;
  message: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: ImportError[];
}

export interface ConstituentRecord {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  ward?: string;
}

export interface CaseRecord {
  subject: string;
  description: string;
  constituentEmail: string;
  status?: string;
  department?: string;
  date?: string;
}

export interface PreviewRow {
  rowNumber: number;
  data: Record<string, string>;
}

/**
 * Parse CSV buffer and return records
 */
function parseCSV(buffer: Buffer): Record<string, string>[] {
  try {
    const text = buffer.toString("utf-8");

    // Handle BOM if present
    const cleanedText = text.startsWith("\ufeff") ? text.slice(1) : text;

    const records = parse(cleanedText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
      quote_char: '"',
      escape_char: '"',
      delimiter: [",", "\t"],
    }) as Record<string, string>[];

    return records;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse CSV: ${message}`);
  }
}

/**
 * Validate CSV headers match expected headers (case-insensitive)
 */
export function validateCsvHeaders(
  buffer: Buffer,
  expectedHeaders: string[]
): { valid: boolean; providedHeaders: string[]; message?: string } {
  try {
    const records = parseCSV(buffer);

    if (records.length === 0) {
      return {
        valid: false,
        providedHeaders: [],
        message: "CSV file is empty",
      };
    }

    const providedHeaders = Object.keys(records[0]).map((h) => h.toLowerCase().trim());
    const expectedNormalized = expectedHeaders.map((h) => h.toLowerCase().trim());

    // Check if at least required headers are present
    const hasAllRequired = expectedNormalized.every((expected) =>
      providedHeaders.some((provided) => provided.includes(expected) || expected.includes(provided))
    );

    if (!hasAllRequired) {
      return {
        valid: false,
        providedHeaders: Object.keys(records[0]),
        message: `Missing required columns. Expected: ${expectedHeaders.join(", ")}`,
      };
    }

    return {
      valid: true,
      providedHeaders: Object.keys(records[0]),
    };
  } catch (error) {
    return {
      valid: false,
      providedHeaders: [],
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create header mapping from provided headers to system fields
 */
function createHeaderMapping(
  providedHeaders: string[],
  expectedFields: string[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  const providedLower = providedHeaders.map((h) => h.toLowerCase());

  for (const expected of expectedFields) {
    const expectedLower = expected.toLowerCase();
    const index = providedLower.findIndex(
      (p) => p === expectedLower || p.includes(expectedLower) || expectedLower.includes(p)
    );

    if (index !== -1) {
      mapping[expected] = providedHeaders[index];
    }
  }

  return mapping;
}

/**
 * Preview import - return first 10 rows parsed
 */
export function previewImport(
  buffer: Buffer,
  type: "constituents" | "cases"
): { rows: PreviewRow[]; headers: string[] } {
  const records = parseCSV(buffer);
  const headers = records.length > 0 ? Object.keys(records[0]) : [];

  const preview = records.slice(0, 10).map((data, index) => ({
    rowNumber: index + 2, // +2 because row 1 is headers and we start from 1
    data,
  }));

  return {
    rows: preview,
    headers,
  };
}

/**
 * Validate a constituent record
 */
function validateConstituent(record: ConstituentRecord, rowNumber: number): ImportError | null {
  const errors: string[] = [];

  if (!record.name || record.name.trim().length === 0) {
    errors.push("name is required");
  }

  if (!record.email || record.email.trim().length === 0) {
    errors.push("email is required");
  } else if (!isValidEmail(record.email)) {
    errors.push("email is not valid");
  }

  if (record.phone && !isValidPhone(record.phone)) {
    errors.push("phone format is invalid");
  }

  if (errors.length > 0) {
    return {
      row: rowNumber,
      message: errors.join("; "),
    };
  }

  return null;
}

/**
 * Validate a case record
 */
function validateCase(record: CaseRecord, rowNumber: number): ImportError | null {
  const errors: string[] = [];

  if (!record.subject || record.subject.trim().length === 0) {
    errors.push("subject is required");
  }

  if (!record.description || record.description.trim().length === 0) {
    errors.push("description is required");
  }

  if (!record.constituentEmail || record.constituentEmail.trim().length === 0) {
    errors.push("constituentEmail is required");
  } else if (!isValidEmail(record.constituentEmail)) {
    errors.push("constituentEmail is not valid");
  }

  if (errors.length > 0) {
    return {
      row: rowNumber,
      message: errors.join("; "),
    };
  }

  return null;
}

/**
 * Import constituents from CSV
 */
export async function importConstituents(
  cityId: string,
  csvBuffer: Buffer,
  headerMapping?: Record<string, string>
): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const records = parseCSV(csvBuffer);

    if (records.length === 0) {
      result.errors.push({
        row: 0,
        message: "CSV file contains no data",
      });
      return result;
    }

    // Auto-detect header mapping if not provided
    const mapping =
      headerMapping ||
      createHeaderMapping(Object.keys(records[0]), ["name", "email", "phone", "address", "ward"]);

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 for header row and 1-based indexing

      try {
        // Map CSV columns to constituent fields
        const constituent: ConstituentRecord = {
          name: row[mapping.name] || row.name || "",
          email: row[mapping.email] || row.email || "",
          phone: row[mapping.phone] || row.phone || undefined,
          address: row[mapping.address] || row.address || undefined,
          ward: row[mapping.ward] || row.ward || undefined,
        };

        // Validate record
        const validationError = validateConstituent(constituent, rowNumber);
        if (validationError) {
          result.errors.push(validationError);
          result.skipped++;
          continue;
        }

        // In a real implementation, you would save to database here:
        // await prisma.constituent.create({ data: { ...constituent, cityId } })

        result.imported++;
      } catch (error) {
        result.errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : "Unknown error",
        });
        result.skipped++;
      }
    }

    return result;
  } catch (error) {
    result.errors.push({
      row: 0,
      message: error instanceof Error ? error.message : "Failed to parse CSV",
    });
    return result;
  }
}

/**
 * Import cases from CSV
 */
export async function importCases(
  cityId: string,
  csvBuffer: Buffer,
  headerMapping?: Record<string, string>
): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const records = parseCSV(csvBuffer);

    if (records.length === 0) {
      result.errors.push({
        row: 0,
        message: "CSV file contains no data",
      });
      return result;
    }

    // Auto-detect header mapping if not provided
    const mapping =
      headerMapping ||
      createHeaderMapping(Object.keys(records[0]), [
        "subject",
        "description",
        "constituentEmail",
        "status",
        "department",
        "date",
      ]);

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 for header row and 1-based indexing

      try {
        // Map CSV columns to case fields
        const caseRecord: CaseRecord = {
          subject: row[mapping.subject] || row.subject || "",
          description: row[mapping.description] || row.description || "",
          constituentEmail: row[mapping.constituentEmail] || row.constituentEmail || "",
          status: row[mapping.status] || row.status || "NEW",
          department: row[mapping.department] || row.department || "General",
          date: row[mapping.date] || row.date || new Date().toISOString(),
        };

        // Validate record
        const validationError = validateCase(caseRecord, rowNumber);
        if (validationError) {
          result.errors.push(validationError);
          result.skipped++;
          continue;
        }

        // In a real implementation, you would save to database here:
        // await prisma.case.create({ data: { ...caseRecord, cityId } })

        result.imported++;
      } catch (error) {
        result.errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : "Unknown error",
        });
        result.skipped++;
      }
    }

    return result;
  } catch (error) {
    result.errors.push({
      row: 0,
      message: error instanceof Error ? error.message : "Failed to parse CSV",
    });
    return result;
  }
}

/**
 * Helper: Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper: Validate phone format (very permissive)
 */
function isValidPhone(phone: string): boolean {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-().+]/g, "");
  // At least 10 digits
  return /^\d{10,}$/.test(cleaned);
}
