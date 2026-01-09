import * as XLSX from "xlsx";

/**
 * Export data to Excel file
 * @param data - Array of objects to export
 * @param filename - Name of the file (without extension)
 * @param sheetName - Name of the worksheet
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName = "Sheet1",
) {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Format data for export by removing unwanted fields and formatting dates
 * @param data - Array of objects to format
 * @param excludeFields - Array of field names to exclude
 * @param dateFields - Array of field names that contain dates
 */
export function formatDataForExport<T extends Record<string, unknown>>(
  data: T[],
  excludeFields: string[] = [],
  dateFields: string[] = [],
): Record<string, unknown>[] {
  return data.map((item) => {
    const formatted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(item)) {
      // Skip excluded fields
      if (excludeFields.includes(key)) continue;

      // Format dates
      if (dateFields.includes(key) && value) {
        formatted[key] =
          value instanceof Date
            ? value.toLocaleString()
            : new Date(value as string).toLocaleString();
      } else {
        formatted[key] = value;
      }
    }

    return formatted;
  });
}

/**
 * Parse Excel file and return data as array of objects
 * @param file - File object from input
 * @param sheetName - Optional sheet name to read (defaults to "Data" sheet, or first sheet if not found)
 * @returns Promise with parsed data
 */
export async function parseExcelFile<T = Record<string, unknown>>(
  file: File,
  sheetName?: string,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        // Try to find the "Data" sheet, otherwise use specified sheet or first sheet
        let targetSheetName = sheetName;
        if (!targetSheetName) {
          // Look for "Data" sheet first
          targetSheetName = workbook.SheetNames.find(
            (name) => name.toLowerCase() === "data",
          );
          // If not found, use first sheet
          if (!targetSheetName) {
            targetSheetName = workbook.SheetNames[0];
          }
        }

        const worksheet = workbook.Sheets[targetSheetName];

        if (!worksheet) {
          reject(
            new Error(`Sheet "${targetSheetName}" not found in the Excel file`),
          );
          return;
        }

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<T>(worksheet, {
          defval: null,
          raw: false, // Get formatted strings
        });

        resolve(jsonData);
      } catch (error) {
        reject(
          new Error(
            "Failed to parse Excel file: " +
              (error instanceof Error ? error.message : "Unknown error"),
          ),
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Create Excel template with instructions sheet
 * @param templateData - Sample data for template
 * @param instructions - Array of instruction strings
 * @param filename - Name of the template file
 * @param dataSheetName - Name of the data sheet
 * @param instructionsSheetName - Name of the instructions sheet
 */
export function createExcelTemplate(
  templateData: Record<string, unknown>[],
  instructions: string[],
  filename: string,
  dataSheetName = "Data",
  instructionsSheetName = "Instructions",
) {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Create instructions sheet
  const instructionsData = instructions.map((instruction, index) => ({
    Step: index + 1,
    Instruction: instruction,
  }));
  const instructionsWorksheet = XLSX.utils.json_to_sheet(instructionsData);

  // Set column widths for instructions
  instructionsWorksheet["!cols"] = [{ wch: 8 }, { wch: 80 }];

  // Add instructions sheet first
  XLSX.utils.book_append_sheet(
    workbook,
    instructionsWorksheet,
    instructionsSheetName,
  );

  // Create data template sheet
  const dataWorksheet = XLSX.utils.json_to_sheet(templateData);

  // Add data sheet
  XLSX.utils.book_append_sheet(workbook, dataWorksheet, dataSheetName);

  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
