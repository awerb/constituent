"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileIcon,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";

type ImportType = "constituents" | "cases" | null;
type ImportStep = "select" | "upload" | "mapping" | "preview" | "importing" | "results";

interface ColumnMapping {
  csvColumn: string;
  systemField: string;
}

interface PreviewRow {
  rowNumber: number;
  [key: string]: unknown;
}

interface ImportResults {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

const CONSTITUENT_FIELDS = ["name", "email", "phone", "address", "ward"];
const CASE_FIELDS = ["subject", "description", "constituentEmail", "status", "department", "date"];

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>("select");
  const [importType, setImportType] = useState<ImportType>(null);
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ImportResults | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const getExpectedFields = (): string[] => {
    return importType === "constituents" ? CONSTITUENT_FIELDS : CASE_FIELDS;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = async (selectedFile: File) => {
    if (!importType) return;

    setFile(selectedFile);
    setIsLoading(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const decoder = new TextDecoder();
      const csv = decoder.decode(buffer);

      // Parse headers
      const lines = csv.split("\n");
      if (lines.length === 0) {
        alert("CSV file is empty");
        return;
      }

      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/^"/, "").replace(/"$/, ""));
      setCsvHeaders(headers);

      // Auto-create mappings
      const expectedFields = getExpectedFields();
      const mappings = headers.map((csvCol) => {
        const match = expectedFields.find(
          (field) =>
            csvCol.toLowerCase().includes(field.toLowerCase()) ||
            field.toLowerCase().includes(csvCol.toLowerCase())
        );
        return {
          csvColumn: csvCol,
          systemField: match || "",
        };
      });
      setColumnMappings(mappings);

      // Parse preview rows (first 10 data rows)
      const dataLines = lines.slice(1, 11);
      const preview = dataLines.map((line, idx) => {
        const values = parseCSVLine(line);
        const row: PreviewRow = { rowNumber: idx + 2 };
        headers.forEach((header, i) => {
          row[header] = values[i] || "";
        });
        return row;
      });
      setPreviewRows(preview);

      setStep("mapping");
    } catch (error) {
      alert(`Error reading file: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleMappingChange = (index: number, systemField: string) => {
    const updated = [...columnMappings];
    updated[index].systemField = systemField;
    setColumnMappings(updated);
  };

  const handlePreview = () => {
    // Validate that required fields are mapped
    const expectedFields = getExpectedFields();
    const requiredFields = ["name", "email", "subject", "description", "constituentEmail"];
    const mapped = columnMappings.map((m) => m.systemField).filter(Boolean);

    const missingRequired = requiredFields.filter(
      (field) => !mapped.includes(field) && expectedFields.includes(field)
    );

    if (missingRequired.length > 0) {
      alert(
        `Please map all required fields: ${missingRequired.map((f) => `"${f}"`).join(", ")}`
      );
      return;
    }

    setStep("preview");
  };

  const handleImport = async () => {
    if (!file) return;

    setIsLoading(true);
    setStep("importing");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", importType || "");
      formData.append("mappings", JSON.stringify(columnMappings));

      const response = await fetch("/api/admin/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Import failed");
      }

      const data = await response.json();
      setResults(data);
      setStep("results");
    } catch (error) {
      alert(`Import error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setStep("preview");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSampleCSV = (type: "constituents" | "cases") => {
    if (type === "constituents") {
      const csv =
        "name,email,phone,address,ward\n" +
        "John Smith,john.smith@example.com,(555) 123-4567,123 Main St,Ward 1\n" +
        "Jane Doe,jane.doe@example.com,(555) 234-5678,456 Oak Ave,Ward 2\n" +
        "Bob Johnson,bob.j@example.com,(555) 345-6789,789 Elm St,Ward 3\n" +
        "Alice Williams,alice.w@example.com,(555) 456-7890,321 Pine Rd,Ward 1\n" +
        "Charlie Brown,charlie.b@example.com,(555) 567-8901,654 Maple Ln,Ward 2";

      downloadFile(csv, "constituents-import-sample.csv");
    } else {
      const csv =
        "subject,description,constituentEmail,status,department,date\n" +
        "Pothole on Main St,Large pothole causing traffic issues,john.smith@example.com,NEW,Public Works,2024-03-15\n" +
        "Street Light Out,Street light at corner of Main and Oak is broken,jane.doe@example.com,IN_PROGRESS,Public Works,2024-03-10\n" +
        "Park Cleanup Needed,Central park needs maintenance and cleanup,bob.j@example.com,NEW,Parks,2024-03-14\n" +
        "Zoning Question,Question about commercial zoning on property,alice.w@example.com,RESOLVED,Planning,2024-03-05\n" +
        "Library Hours,Request to extend library hours on weekends,charlie.b@example.com,NEW,Libraries,2024-03-13";

      downloadFile(csv, "cases-import-sample.csv");
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const downloadResultsPDF = () => {
    if (!results) return;

    let content = `Import Results
================

Type: ${importType === "constituents" ? "Constituents" : "Cases"}
Imported: ${results.imported}
Skipped: ${results.skipped}
Errors: ${results.errors.length}

`;

    if (results.errors.length > 0) {
      content += "Errors:\n";
      results.errors.forEach((error) => {
        content += `Row ${error.row}: ${error.message}\n`;
      });
    }

    downloadFile(content, "import-results.txt");
  };

  // STEP 1: Select Import Type
  if (step === "select") {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Import Data</h1>
          <p className="text-gray-600">
            Migrate constituents and cases from spreadsheets or other systems
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => setImportType("constituents")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileIcon className="w-5 h-5" />
                Import Constituents
              </CardTitle>
              <CardDescription>
                Import resident and constituent contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Required fields: Name, Email</p>
                <p>Optional: Phone, Address, Ward</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => setImportType("cases")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileIcon className="w-5 h-5" />
                Import Cases
              </CardTitle>
              <CardDescription>Import constituent requests and issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Required fields: Subject, Description, Email</p>
                <p>Optional: Status, Department, Date</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Exporting from Excel?</p>
              <p>Save your spreadsheet as CSV (UTF-8) first. Use the download links below to get sample templates.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: Upload CSV
  if (step === "upload") {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload CSV File</h1>
          <p className="text-gray-600">
            {importType === "constituents" ? "Import constituents" : "Import cases"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Drag and Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {!file ? (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <div>
                    <p className="font-semibold mb-1">Drag and drop your CSV file here</p>
                    <p className="text-sm text-gray-500">or click to select a file</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" />
                  <p className="font-semibold">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                className="hidden"
                id="fileInput"
              />
            </div>

            {/* File Input Trigger */}
            <label htmlFor="fileInput">
              <Button type="button" variant="outline" className="cursor-pointer">
                Browse Files
              </Button>
            </label>

            {/* Download Sample Templates */}
            <div className="border-t pt-6">
              <p className="text-sm font-semibold mb-3">Need a template?</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadSampleCSV("constituents")}
                  className="flex gap-2"
                >
                  <Download className="w-4 h-4" />
                  Constituents Sample
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadSampleCSV("cases")}
                  className="flex gap-2"
                >
                  <Download className="w-4 h-4" />
                  Cases Sample
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-6 border-t">
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button
                onClick={() => setStep("upload")}
                disabled={!file || isLoading}
                className="flex gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STEP 3: Column Mapping
  if (step === "mapping") {
    return (
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Map Columns</h1>
          <p className="text-gray-600">Match your CSV columns to system fields</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Column Mapping</CardTitle>
            <CardDescription>
              {csvHeaders.length} columns found in your CSV file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {columnMappings.map((mapping, index) => (
                <div key={index} className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label className="text-sm mb-2 block">CSV Column</Label>
                    <Input
                      value={mapping.csvColumn}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm mb-2 block">Map to Field</Label>
                    <Select
                      value={mapping.systemField}
                      onValueChange={(value) => handleMappingChange(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- Skip --</SelectItem>
                        {getExpectedFields().map((field) => (
                          <SelectItem key={field} value={field}>
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end border-t pt-6">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handlePreview} className="flex gap-2">
                Preview Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STEP 4: Preview
  if (step === "preview") {
    return (
      <div className="max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Preview Data</h1>
          <p className="text-gray-600">Review the first 10 rows before importing</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Step 4: Preview</CardTitle>
            <CardDescription>
              Showing {previewRows.length} of {previewRows.length} preview rows
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 bg-gray-50">Row</th>
                    {columnMappings
                      .filter((m) => m.systemField)
                      .map((mapping) => (
                        <th
                          key={mapping.csvColumn}
                          className="text-left py-2 px-3 bg-gray-50 whitespace-nowrap"
                        >
                          {mapping.systemField}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row.rowNumber} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-500">{row.rowNumber}</td>
                      {columnMappings
                        .filter((m) => m.systemField)
                        .map((mapping) => (
                          <td
                            key={`${row.rowNumber}-${mapping.csvColumn}`}
                            className="py-2 px-3 text-gray-700 max-w-xs truncate"
                          >
                            {String(row[mapping.csvColumn] || "")}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 justify-end border-t pt-6">
              <Button variant="outline" onClick={() => setStep("mapping")}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={isLoading}
                className="flex gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Import {file?.name}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STEP 5: Importing
  if (step === "importing") {
    return (
      <div className="max-w-2xl flex items-center justify-center min-h-[400px]">
        <Card className="w-full">
          <CardContent className="pt-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin" />
            <h2 className="text-2xl font-bold">Importing Data</h2>
            <p className="text-gray-600">Please wait while your data is being imported...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STEP 6: Results
  if (step === "results" && results) {
    const hasErrors = results.errors.length > 0;
    const success = results.imported > 0 && !hasErrors;

    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Import Complete</h1>
          <p className="text-gray-600">Summary of the import operation</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {success ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <span>Import Successful</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                  <span>Import Complete with Warnings</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">{results.imported}</div>
                <div className="text-sm text-green-600">Imported</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-700">{results.skipped}</div>
                <div className="text-sm text-yellow-600">Skipped</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-700">{results.errors.length}</div>
                <div className="text-sm text-red-600">Errors</div>
              </div>
            </div>

            {/* Error Details */}
            {hasErrors && (
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Issues Found
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.errors.slice(0, 20).map((error, index) => (
                    <div key={index} className="text-sm p-3 bg-red-50 rounded border border-red-200">
                      <span className="font-semibold text-red-700">Row {error.row}:</span>{" "}
                      <span className="text-red-600">{error.message}</span>
                    </div>
                  ))}
                  {results.errors.length > 20 && (
                    <p className="text-sm text-gray-500 py-2">
                      ... and {results.errors.length - 20} more errors (see results file)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end border-t pt-6">
              <Button variant="outline" onClick={downloadResultsPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download Results
              </Button>
              <Button
                onClick={() => {
                  setStep("select");
                  setFile(null);
                  setResults(null);
                  setImportType(null);
                }}
              >
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: Show upload step after type is selected
  if (importType && step === "select") {
    setStep("upload");
  }

  return null;
}
