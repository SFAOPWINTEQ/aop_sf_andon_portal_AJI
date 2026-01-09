"use server";

import { shiftRepository, type SearchFilter } from "@/server/shiftRepository";
import {
  createShiftSchema,
  updateShiftSchema,
  deleteShiftSchema,
  type CreateShiftInput,
  type UpdateShiftInput,
  type ShiftResponse,
  type ShiftsResponse,
} from "@/server/shiftModel";
import { revalidatePath } from "next/cache";

/**
 * Get all shifts with pagination, search, and sorting
 */
export async function getShifts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  plantId?: string;
}): Promise<
  ShiftsResponse & {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
> {
  try {
    const result = await shiftRepository.getAll(params);
    return {
      success: true,
      shifts: result.shifts.map((shift) => ({
        id: shift.id,
        lineId: shift.lineId,
        lineName: shift.line.name,
        number: shift.number,
        workStart: shift.workStart,
        workEnd: shift.workEnd,
        break1Start: shift.break1Start,
        break1End: shift.break1End,
        break2Start: shift.break2Start,
        break2End: shift.break2End,
        break3Start: shift.break3Start,
        break3End: shift.break3End,
        loadingTimeInSec: shift.loadingTimeInSec,
        createdAt: shift.createdAt,
        updatedAt: shift.updatedAt,
        deletedAt: shift.deletedAt,
      })),
      pagination: result.pagination,
    };
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return {
      success: false,
      message: "Failed to fetch shifts",
      shifts: [],
    };
  }
}

/**
 * Get all shifts for export (no pagination)
 */
export async function getAllShiftsForExport(params?: {
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  plantId?: string;
}): Promise<ShiftsResponse> {
  try {
    const result = await shiftRepository.getAllForExport(params);

    return {
      success: true,
      shifts: result.shifts.map((shift) => ({
        id: shift.id,
        lineId: shift.lineId,
        lineName: shift.line.name,
        number: shift.number,
        workStart: shift.workStart,
        workEnd: shift.workEnd,
        break1Start: shift.break1Start,
        break1End: shift.break1End,
        break2Start: shift.break2Start,
        break2End: shift.break2End,
        break3Start: shift.break3Start,
        break3End: shift.break3End,
        loadingTimeInSec: shift.loadingTimeInSec,
        createdAt: shift.createdAt,
        updatedAt: shift.updatedAt,
        deletedAt: shift.deletedAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching all shifts for export:", error);
    return {
      success: false,
      message: "Failed to fetch shifts for export",
      shifts: [],
    };
  }
}

/**
 * Get shift by ID
 */
export async function getShiftById(id: string): Promise<ShiftResponse> {
  try {
    const shift = await shiftRepository.getById(id);

    if (!shift) {
      return {
        success: false,
        message: "Shift not found",
      };
    }

    return {
      success: true,
      message: "Shift retrieved successfully",
      shift: {
        id: shift.id,
        lineId: shift.lineId,
        lineName: shift.line.name,
        number: shift.number,
        workStart: shift.workStart,
        workEnd: shift.workEnd,
        break1Start: shift.break1Start,
        break1End: shift.break1End,
        break2Start: shift.break2Start,
        break2End: shift.break2End,
        break3Start: shift.break3Start,
        break3End: shift.break3End,
        loadingTimeInSec: shift.loadingTimeInSec,
      },
    };
  } catch (error) {
    console.error("Error fetching shift:", error);
    return {
      success: false,
      message: "Failed to fetch shift",
    };
  }
}

/**
 * Create a new shift
 */
export async function createShift(
  data: CreateShiftInput,
): Promise<ShiftResponse> {
  try {
    // Validate input
    const validation = createShiftSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const validatedData = validation.data;

    // Check if shift number already exists in this line
    const numberExists = await shiftRepository.numberExistsInLine(
      validatedData.number,
      validatedData.lineId,
    );
    if (numberExists) {
      return {
        success: false,
        message: "Shift number already exists in this line",
      };
    }

    // Create shift
    const shift = await shiftRepository.create({
      lineId: validatedData.lineId,
      number: validatedData.number,
      workStart: validatedData.workStart,
      workEnd: validatedData.workEnd,
      break1Start: validatedData.break1Start || null,
      break1End: validatedData.break1End || null,
      break2Start: validatedData.break2Start || null,
      break2End: validatedData.break2End || null,
      break3Start: validatedData.break3Start || null,
      break3End: validatedData.break3End || null,
    });

    revalidatePath("/shifts");

    return {
      success: true,
      message: "Shift created successfully",
      shift: {
        id: shift.id,
        lineId: shift.lineId,
        lineName: shift.line.name,
        number: shift.number,
        workStart: shift.workStart,
        workEnd: shift.workEnd,
        break1Start: shift.break1Start,
        break1End: shift.break1End,
        break2Start: shift.break2Start,
        break2End: shift.break2End,
        break3Start: shift.break3Start,
        break3End: shift.break3End,
        loadingTimeInSec: shift.loadingTimeInSec,
      },
    };
  } catch (error) {
    console.error("Error creating shift:", error);
    return {
      success: false,
      message: "Failed to create shift",
    };
  }
}

/**
 * Update a shift
 */
export async function updateShift(
  id: string,
  data: UpdateShiftInput,
): Promise<ShiftResponse> {
  try {
    // Validate input
    const validation = updateShiftSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const validatedData = validation.data;

    // Check if shift exists
    const existingShift = await shiftRepository.getById(id);
    if (!existingShift) {
      return {
        success: false,
        message: "Shift not found",
      };
    }

    // Check if shift number is being changed and if it already exists in the line
    if (validatedData.number !== undefined) {
      const lineId = validatedData.lineId || existingShift.lineId;
      const numberExists = await shiftRepository.numberExistsInLine(
        validatedData.number,
        lineId,
        id,
      );
      if (numberExists) {
        return {
          success: false,
          message: "Shift number already exists in this line",
        };
      }
    }

    // Update shift
    const shift = await shiftRepository.update(id, validatedData);

    revalidatePath("/shifts");

    return {
      success: true,
      message: "Shift updated successfully",
      shift: {
        id: shift.id,
        lineId: shift.lineId,
        lineName: shift.line.name,
        number: shift.number,
        workStart: shift.workStart,
        workEnd: shift.workEnd,
        break1Start: shift.break1Start,
        break1End: shift.break1End,
        break2Start: shift.break2Start,
        break2End: shift.break2End,
        break3Start: shift.break3Start,
        break3End: shift.break3End,
        loadingTimeInSec: shift.loadingTimeInSec,
      },
    };
  } catch (error) {
    console.error("Error updating shift:", error);
    return {
      success: false,
      message: "Failed to update shift",
    };
  }
}

/**
 * Delete a shift (soft delete)
 */
export async function deleteShift(id: string): Promise<ShiftResponse> {
  try {
    // Validate input
    const validation = deleteShiftSchema.safeParse({ id });

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    // Check if shift exists
    const existingShift = await shiftRepository.getById(id);
    if (!existingShift) {
      return {
        success: false,
        message: "Shift not found",
      };
    }

    // Soft delete shift
    await shiftRepository.delete(id);

    revalidatePath("/shifts");

    return {
      success: true,
      message: "Shift deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting shift:", error);
    return {
      success: false,
      message: "Failed to delete shift",
    };
  }
}

/**
 * Get template data for Shift import
 */
export async function getShiftTemplateData(): Promise<{
  success: boolean;
  templateData?: Array<{
    lineName: string;
    number: string;
    workStart: string;
    workEnd: string;
    break1Start: string;
    break1End: string;
    break2Start: string;
    break2End: string;
    break3Start: string;
    break3End: string;
  }>;
  instructions?: string[];
  message?: string;
}> {
  try {
    const templateData = [
      {
        lineName: "Line 1",
        number: "1",
        workStart: "08:00",
        workEnd: "16:00",
        break1Start: "10:00",
        break1End: "10:15",
        break2Start: "12:00",
        break2End: "12:30",
        break3Start: "",
        break3End: "",
      },
      {
        lineName: "Line 1",
        number: "2",
        workStart: "16:00",
        workEnd: "00:00",
        break1Start: "18:00",
        break1End: "18:15",
        break2Start: "20:00",
        break2End: "20:30",
        break3Start: "",
        break3End: "",
      },
    ];

    const instructions = [
      "Fill in the Shift data in the 'Data' sheet",
      "Column 'lineName': Enter the line name (required, must exist in Lines master)",
      "Column 'number': Enter the shift number (required, must be a positive integer)",
      "Column 'workStart': Enter work start time in HH:mm format (required, e.g., '08:00')",
      "Column 'workEnd': Enter work end time in HH:mm format (required, e.g., '16:00')",
      "Column 'break1Start': Enter break 1 start time in HH:mm format (optional)",
      "Column 'break1End': Enter break 1 end time in HH:mm format (optional)",
      "Column 'break2Start': Enter break 2 start time in HH:mm format (optional)",
      "Column 'break2End': Enter break 2 end time in HH:mm format (optional)",
      "Column 'break3Start': Enter break 3 start time in HH:mm format (optional)",
      "Column 'break3End': Enter break 3 end time in HH:mm format (optional)",
      "Note: Combination of line and shift number must be unique",
      "Do not modify the column headers",
      "Delete the sample rows and add your own data",
      "Save the file and upload it using the Import button",
    ];

    return {
      success: true,
      templateData,
      instructions,
    };
  } catch (error) {
    console.error("Error generating template data:", error);
    return {
      success: false,
      message: "Failed to generate template data",
    };
  }
}

/**
 * Parse time string in HH:mm format or Date object to Date object
 */
function parseTime(timeStr: string | Date | null | undefined): Date | null {
  if (!timeStr) return null;

  // If already a Date object, return it
  if (timeStr instanceof Date) {
    return timeStr;
  }

  if (timeStr.trim() === "") return null;

  const timeRegex = /^(\d{1,2}):(\d{2})$/;
  const match = timeStr.trim().match(timeRegex);

  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  // Create a date with arbitrary date but specific time
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Convert Date object to HH:mm string format
 */
function dateToTimeString(date: Date | null | undefined): string | null {
  if (!date) return null;
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Import Shifts from Excel data
 */
export async function importShifts(
  data: Array<{
    lineName: string;
    number: string;
    workStart: string | Date;
    workEnd: string | Date;
    break1Start: string | Date;
    break1End: string | Date;
    break2Start: string | Date;
    break2End: string | Date;
    break3Start: string | Date;
    break3End: string | Date;
  }>,
  lineNameToIdMap: Record<string, string>,
): Promise<{
  success: boolean;
  successCount: number;
  failureCount: number;
  errors: Array<{ row: number; error: string }>;
  message?: string;
}> {
  const errors: Array<{ row: number; error: string }> = [];
  let successCount = 0;
  let failureCount = 0;

  try {
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;

      try {
        // Validate required fields
        if (!row.lineName || row.lineName.trim() === "") {
          errors.push({
            row: rowNumber,
            error: "Line name is required",
          });
          failureCount++;
          continue;
        }

        if (!row.number || row.number.trim() === "") {
          errors.push({
            row: rowNumber,
            error: "Shift number is required",
          });
          failureCount++;
          continue;
        }

        // Parse shift number
        const shiftNumber = parseInt(row.number.trim(), 10);
        if (Number.isNaN(shiftNumber) || shiftNumber <= 0) {
          errors.push({
            row: rowNumber,
            error: "Shift number must be a positive integer",
          });
          failureCount++;
          continue;
        }

        // Get line ID from mapping
        const lineId = lineNameToIdMap[row.lineName.trim()];
        if (!lineId) {
          errors.push({
            row: rowNumber,
            error: `Line '${row.lineName.trim()}' not found`,
          });
          failureCount++;
          continue;
        }

        // Parse work times
        const workStart = parseTime(row.workStart);
        const workEnd = parseTime(row.workEnd);

        if (!workStart) {
          errors.push({
            row: rowNumber,
            error: "Work start time is required and must be in HH:mm format",
          });
          failureCount++;
          continue;
        }

        if (!workEnd) {
          errors.push({
            row: rowNumber,
            error: "Work end time is required and must be in HH:mm format",
          });
          failureCount++;
          continue;
        }

        // Parse break times (optional)
        const break1Start = parseTime(row.break1Start);
        const break1End = parseTime(row.break1End);
        const break2Start = parseTime(row.break2Start);
        const break2End = parseTime(row.break2End);
        const break3Start = parseTime(row.break3Start);
        const break3End = parseTime(row.break3End);

        // Check if shift already exists in this line
        const exists = await shiftRepository.numberExistsInLine(
          shiftNumber,
          lineId,
        );
        if (exists) {
          errors.push({
            row: rowNumber,
            error: `Shift ${shiftNumber} already exists in line '${row.lineName.trim()}'`,
          });
          failureCount++;
          continue;
        }

        // Convert Date objects to time strings for Zod validation
        const workStartStr = dateToTimeString(workStart);
        const workEndStr = dateToTimeString(workEnd);
        const break1StartStr = dateToTimeString(break1Start);
        const break1EndStr = dateToTimeString(break1End);
        const break2StartStr = dateToTimeString(break2Start);
        const break2EndStr = dateToTimeString(break2End);
        const break3StartStr = dateToTimeString(break3Start);
        const break3EndStr = dateToTimeString(break3End);

        // Validate with Zod schema
        const validationResult = createShiftSchema.safeParse({
          lineId,
          number: shiftNumber,
          workStart: workStartStr,
          workEnd: workEndStr,
          break1Start: break1StartStr,
          break1End: break1EndStr,
          break2Start: break2StartStr,
          break2End: break2EndStr,
          break3Start: break3StartStr,
          break3End: break3EndStr,
        });

        if (!validationResult.success) {
          const errorMessages = validationResult.error.issues
            .map((e: { message: string }) => e.message)
            .join(", ");
          errors.push({
            row: rowNumber,
            error: errorMessages,
          });
          failureCount++;
          continue;
        }

        // Create shift
        await shiftRepository.create({
          lineId,
          number: validationResult.data.number,
          workStart: validationResult.data.workStart,
          workEnd: validationResult.data.workEnd,
          break1Start: validationResult.data.break1Start || null,
          break1End: validationResult.data.break1End || null,
          break2Start: validationResult.data.break2Start || null,
          break2End: validationResult.data.break2End || null,
          break3Start: validationResult.data.break3Start || null,
          break3End: validationResult.data.break3End || null,
        });

        successCount++;
      } catch (error) {
        console.error(`Error importing row ${rowNumber}:`, error);
        errors.push({
          row: rowNumber,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
        failureCount++;
      }
    }

    revalidatePath("/shifts");

    return {
      success: successCount > 0,
      successCount,
      failureCount,
      errors,
      message:
        successCount > 0
          ? `Successfully imported ${successCount} shift(s)`
          : "No shifts were imported",
    };
  } catch (error) {
    console.error("Error during import:", error);
    return {
      success: false,
      successCount,
      failureCount,
      errors,
      message: "An error occurred during import",
    };
  }
}
