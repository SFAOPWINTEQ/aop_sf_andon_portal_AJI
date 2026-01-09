import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type ColumnType = "string" | "number" | "date" | "boolean";
export type FilterOperator =
  | "equals"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "before"
  | "after"
  | "between";

export interface SearchFilter {
  column: string;
  operator: FilterOperator;
  value: string;
  type: ColumnType;
}

/**
 * Convert time string (HH:mm) to Date object for SQL Server TIME
 */
function timeStringToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Convert Date object to time string (HH:mm)
 */
function dateToTimeString(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Calculate loading time in seconds based on work time and breaks
 * Formula: Loading time = (workEnd - workStart) - (break1 + break2 + break3)
 */
export function calculateLoadingTimeInSec(
  workStart: string,
  workEnd: string,
  break1Start: string | null | undefined,
  break1End: string | null | undefined,
  break2Start: string | null | undefined,
  break2End: string | null | undefined,
  break3Start: string | null | undefined,
  break3End: string | null | undefined,
): number {
  // Helper to convert time string (HH:mm) to minutes
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Calculate work duration
  const workStartMin = timeToMinutes(workStart);
  let workEndMin = timeToMinutes(workEnd);

  // Handle overnight shifts (e.g., 22:00 to 06:00)
  if (workEndMin < workStartMin) {
    workEndMin += 24 * 60; // Add 24 hours
  }

  const workDurationMin = workEndMin - workStartMin;

  // Calculate break durations
  let totalBreakMin = 0;

  if (break1Start && break1End) {
    const break1StartMin = timeToMinutes(break1Start);
    const break1EndMin = timeToMinutes(break1End);
    totalBreakMin += break1EndMin - break1StartMin;
  }

  if (break2Start && break2End) {
    const break2StartMin = timeToMinutes(break2Start);
    const break2EndMin = timeToMinutes(break2End);
    totalBreakMin += break2EndMin - break2StartMin;
  }

  if (break3Start && break3End) {
    const break3StartMin = timeToMinutes(break3Start);
    const break3EndMin = timeToMinutes(break3End);
    totalBreakMin += break3EndMin - break3StartMin;
  }

  // Calculate loading time
  const loadingTimeMin = workDurationMin - totalBreakMin;

  // Convert to seconds
  return Math.max(0, loadingTimeMin * 60);
}

/**
 * Build Prisma filter condition based on operator and type
 */
function buildFilterCondition(
  filter: SearchFilter,
): Prisma.ShiftWhereInput | null {
  const { column, operator, value, type } = filter;

  // Validate column name to prevent injection
  const validColumns = [
    "number",
    "lineId",
    "createdAt",
    "updatedAt",
    "deletedAt",
  ];
  if (!validColumns.includes(column)) {
    console.warn(`Invalid column name: ${column}`);
    return null;
  }

  const condition: Record<string, unknown> = {};

  try {
    switch (type) {
      case "string": {
        switch (operator) {
          case "equals":
            condition[column] = { equals: value };
            break;
          case "contains":
            condition[column] = { contains: value };
            break;
          case "startsWith":
            condition[column] = { startsWith: value };
            break;
          case "endsWith":
            condition[column] = { endsWith: value };
            break;
          default:
            condition[column] = { contains: value };
        }
        break;
      }

      case "number": {
        const numValue = Number(value);
        if (Number.isNaN(numValue)) {
          console.warn(`Invalid number value: ${value}`);
          return null;
        }
        switch (operator) {
          case "equals":
            condition[column] = { equals: numValue };
            break;
          case "gt":
            condition[column] = { gt: numValue };
            break;
          case "gte":
            condition[column] = { gte: numValue };
            break;
          case "lt":
            condition[column] = { lt: numValue };
            break;
          case "lte":
            condition[column] = { lte: numValue };
            break;
          default:
            condition[column] = { equals: numValue };
        }
        break;
      }

      case "date": {
        const dateValue = new Date(value);
        if (Number.isNaN(dateValue.getTime())) {
          console.warn(`Invalid date value: ${value}`);
          return null;
        }
        switch (operator) {
          case "equals": {
            // For date equality, check same day
            const startOfDay = new Date(dateValue);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(dateValue);
            endOfDay.setHours(23, 59, 59, 999);
            condition[column] = {
              gte: startOfDay,
              lte: endOfDay,
            };
            break;
          }
          case "before":
            condition[column] = { lt: dateValue };
            break;
          case "after":
            condition[column] = { gt: dateValue };
            break;
          default:
            condition[column] = { equals: dateValue };
        }
        break;
      }

      case "boolean": {
        const boolValue = value.toLowerCase() === "true";
        condition[column] = { equals: boolValue };
        break;
      }

      default:
        // Default to string contains
        condition[column] = { contains: value };
    }

    return condition as Prisma.ShiftWhereInput;
  } catch (error) {
    console.error(`Error building filter condition:`, error);
    return null;
  }
}

export const shiftRepository = {
  /**
   * Get all shifts with pagination, search, and sorting
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    searchFilters?: SearchFilter[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    lineId?: string; // Filter by specific line
    plantId?: string; // Filter by plant
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const search = params?.search || "";
    const searchFilters = params?.searchFilters || [];
    const sortBy = params?.sortBy || "number";
    const sortOrder = params?.sortOrder || "asc";
    const lineId = params?.lineId;
    const plantId = params?.plantId;

    const skip = (page - 1) * limit;

    // Build where clause for search
    let where: Prisma.ShiftWhereInput = {
      deletedAt: null, // Only show non-deleted shifts
    };

    // Add line filter if provided
    if (lineId) {
      where.lineId = lineId;
    } else if (plantId) {
      where.line = { plantId };
    }

    // If using multi-column search filters
    if (searchFilters.length > 0) {
      const filterConditions: Prisma.ShiftWhereInput[] = searchFilters
        .map((filter) => buildFilterCondition(filter))
        .filter(
          (condition): condition is Prisma.ShiftWhereInput =>
            condition !== null,
        );

      // Use AND logic for multiple filters
      if (filterConditions.length > 0) {
        const baseConditions: Prisma.ShiftWhereInput[] = [{ deletedAt: null }];
        if (lineId) {
          baseConditions.push({ lineId });
        } else if (plantId) {
          baseConditions.push({ line: { plantId } });
        }
        where = { AND: [...baseConditions, ...filterConditions] };
      }
    }
    // Fallback to simple search if provided and no filters
    else if (search) {
      const searchNumber = Number(search);
      where = {
        deletedAt: null,
        ...(lineId ? { lineId } : plantId ? { line: { plantId } } : {}),
        ...(Number.isNaN(searchNumber)
          ? {}
          : { number: { equals: searchNumber } }),
      };
    }

    // Build orderBy clause
    const orderBy: Prisma.ShiftOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [shifts, total] = await Promise.all([
      db.shift.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          line: {
            select: {
              name: true,
            },
          },
        },
      }),
      db.shift.count({ where }),
    ]);

    // Convert time fields to string format
    const formattedShifts = shifts.map((shift) => ({
      ...shift,
      workStart: dateToTimeString(shift.workStart),
      workEnd: dateToTimeString(shift.workEnd),
      break1Start: shift.break1Start
        ? dateToTimeString(shift.break1Start)
        : null,
      break1End: shift.break1End ? dateToTimeString(shift.break1End) : null,
      break2Start: shift.break2Start
        ? dateToTimeString(shift.break2Start)
        : null,
      break2End: shift.break2End ? dateToTimeString(shift.break2End) : null,
      break3Start: shift.break3Start
        ? dateToTimeString(shift.break3Start)
        : null,
      break3End: shift.break3End ? dateToTimeString(shift.break3End) : null,
    }));

    return {
      shifts: formattedShifts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get all shifts for export (no pagination)
   */
  async getAllForExport(params?: {
    searchFilters?: SearchFilter[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    lineId?: string;
    plantId?: string;
  }) {
    const searchFilters = params?.searchFilters || [];
    const sortBy = params?.sortBy || "number";
    const sortOrder = params?.sortOrder || "asc";
    const lineId = params?.lineId;
    const plantId = params?.plantId;

    // Build where clause for search
    let where: Prisma.ShiftWhereInput = {
      deletedAt: null, // Only show non-deleted shifts
    };

    // Add line filter if provided
    if (lineId) {
      where.lineId = lineId;
    } else if (plantId) {
      where.line = { plantId };
    }

    // If using multi-column search filters
    if (searchFilters.length > 0) {
      const filterConditions: Prisma.ShiftWhereInput[] = searchFilters
        .map((filter) => buildFilterCondition(filter))
        .filter(
          (condition): condition is Prisma.ShiftWhereInput =>
            condition !== null,
        );

      // Use AND logic for multiple filters
      if (filterConditions.length > 0) {
        const baseConditions: Prisma.ShiftWhereInput[] = [{ deletedAt: null }];
        if (lineId) {
          baseConditions.push({ lineId });
        } else if (plantId) {
          baseConditions.push({ line: { plantId } });
        }
        where = { AND: [...baseConditions, ...filterConditions] };
      }
    }

    // Build orderBy clause
    const orderBy: Prisma.ShiftOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const shifts = await db.shift.findMany({
      where,
      orderBy,
      include: {
        line: {
          select: {
            name: true,
          },
        },
      },
      // No skip/take - fetch all records
    });

    // Convert time fields to string format
    const formattedShifts = shifts.map((shift) => ({
      ...shift,
      workStart: dateToTimeString(shift.workStart),
      workEnd: dateToTimeString(shift.workEnd),
      break1Start: shift.break1Start
        ? dateToTimeString(shift.break1Start)
        : null,
      break1End: shift.break1End ? dateToTimeString(shift.break1End) : null,
      break2Start: shift.break2Start
        ? dateToTimeString(shift.break2Start)
        : null,
      break2End: shift.break2End ? dateToTimeString(shift.break2End) : null,
      break3Start: shift.break3Start
        ? dateToTimeString(shift.break3Start)
        : null,
      break3End: shift.break3End ? dateToTimeString(shift.break3End) : null,
    }));

    return {
      shifts: formattedShifts,
      total: shifts.length,
    };
  },

  /**
   * Get shift by ID
   */
  async getById(id: string) {
    const shift = await db.shift.findUnique({
      where: { id },
      include: {
        line: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!shift) return null;

    // Convert time fields to string format
    return {
      ...shift,
      workStart: dateToTimeString(shift.workStart),
      workEnd: dateToTimeString(shift.workEnd),
      break1Start: shift.break1Start
        ? dateToTimeString(shift.break1Start)
        : null,
      break1End: shift.break1End ? dateToTimeString(shift.break1End) : null,
      break2Start: shift.break2Start
        ? dateToTimeString(shift.break2Start)
        : null,
      break2End: shift.break2End ? dateToTimeString(shift.break2End) : null,
      break3Start: shift.break3Start
        ? dateToTimeString(shift.break3Start)
        : null,
      break3End: shift.break3End ? dateToTimeString(shift.break3End) : null,
    };
  },

  /**
   * Create a new shift
   */
  async create(
    data: Omit<Prisma.ShiftCreateInput, "line"> & { lineId: string },
  ) {
    // Calculate loading time
    const loadingTimeInSec = calculateLoadingTimeInSec(
      data.workStart as string,
      data.workEnd as string,
      data.break1Start as string | null,
      data.break1End as string | null,
      data.break2Start as string | null,
      data.break2End as string | null,
      data.break3Start as string | null,
      data.break3End as string | null,
    );

    const shift = await db.shift.create({
      data: {
        number: data.number,
        workStart: timeStringToDate(data.workStart as string),
        workEnd: timeStringToDate(data.workEnd as string),
        break1Start: data.break1Start
          ? timeStringToDate(data.break1Start as string)
          : null,
        break1End: data.break1End
          ? timeStringToDate(data.break1End as string)
          : null,
        break2Start: data.break2Start
          ? timeStringToDate(data.break2Start as string)
          : null,
        break2End: data.break2End
          ? timeStringToDate(data.break2End as string)
          : null,
        break3Start: data.break3Start
          ? timeStringToDate(data.break3Start as string)
          : null,
        break3End: data.break3End
          ? timeStringToDate(data.break3End as string)
          : null,
        loadingTimeInSec,
        line: {
          connect: { id: data.lineId },
        },
      },
      include: {
        line: {
          select: {
            name: true,
          },
        },
      },
    });

    // Convert time fields to string format
    return {
      ...shift,
      workStart: dateToTimeString(shift.workStart),
      workEnd: dateToTimeString(shift.workEnd),
      break1Start: shift.break1Start
        ? dateToTimeString(shift.break1Start)
        : null,
      break1End: shift.break1End ? dateToTimeString(shift.break1End) : null,
      break2Start: shift.break2Start
        ? dateToTimeString(shift.break2Start)
        : null,
      break2End: shift.break2End ? dateToTimeString(shift.break2End) : null,
      break3Start: shift.break3Start
        ? dateToTimeString(shift.break3Start)
        : null,
      break3End: shift.break3End ? dateToTimeString(shift.break3End) : null,
    };
  },

  /**
   * Update a shift
   */
  async update(
    id: string,
    data: Partial<Omit<Prisma.ShiftUpdateInput, "line"> & { lineId?: string }>,
  ) {
    const updateData: Prisma.ShiftUpdateInput = {};

    if (data.number !== undefined) updateData.number = data.number;
    if (data.workStart !== undefined)
      updateData.workStart = timeStringToDate(data.workStart as string);
    if (data.workEnd !== undefined)
      updateData.workEnd = timeStringToDate(data.workEnd as string);
    if (data.break1Start !== undefined)
      updateData.break1Start = data.break1Start
        ? timeStringToDate(data.break1Start as string)
        : null;
    if (data.break1End !== undefined)
      updateData.break1End = data.break1End
        ? timeStringToDate(data.break1End as string)
        : null;
    if (data.break2Start !== undefined)
      updateData.break2Start = data.break2Start
        ? timeStringToDate(data.break2Start as string)
        : null;
    if (data.break2End !== undefined)
      updateData.break2End = data.break2End
        ? timeStringToDate(data.break2End as string)
        : null;
    if (data.break3Start !== undefined)
      updateData.break3Start = data.break3Start
        ? timeStringToDate(data.break3Start as string)
        : null;
    if (data.break3End !== undefined)
      updateData.break3End = data.break3End
        ? timeStringToDate(data.break3End as string)
        : null;
    if (data.lineId) {
      updateData.line = {
        connect: { id: data.lineId },
      };
    }

    // If any time fields are being updated, recalculate loadingTimeInSec
    const timeFieldsUpdated =
      data.workStart !== undefined ||
      data.workEnd !== undefined ||
      data.break1Start !== undefined ||
      data.break1End !== undefined ||
      data.break2Start !== undefined ||
      data.break2End !== undefined ||
      data.break3Start !== undefined ||
      data.break3End !== undefined;

    if (timeFieldsUpdated) {
      // Get current shift data to merge with updates
      const currentShift = await db.shift.findUnique({
        where: { id },
        select: {
          workStart: true,
          workEnd: true,
          break1Start: true,
          break1End: true,
          break2Start: true,
          break2End: true,
          break3Start: true,
          break3End: true,
        },
      });

      if (currentShift) {
        // Use updated values if provided, otherwise use current values
        const workStart =
          data.workStart !== undefined
            ? (data.workStart as string)
            : dateToTimeString(currentShift.workStart);
        const workEnd =
          data.workEnd !== undefined
            ? (data.workEnd as string)
            : dateToTimeString(currentShift.workEnd);
        const break1Start =
          data.break1Start !== undefined
            ? (data.break1Start as string | null)
            : currentShift.break1Start
              ? dateToTimeString(currentShift.break1Start)
              : null;
        const break1End =
          data.break1End !== undefined
            ? (data.break1End as string | null)
            : currentShift.break1End
              ? dateToTimeString(currentShift.break1End)
              : null;
        const break2Start =
          data.break2Start !== undefined
            ? (data.break2Start as string | null)
            : currentShift.break2Start
              ? dateToTimeString(currentShift.break2Start)
              : null;
        const break2End =
          data.break2End !== undefined
            ? (data.break2End as string | null)
            : currentShift.break2End
              ? dateToTimeString(currentShift.break2End)
              : null;
        const break3Start =
          data.break3Start !== undefined
            ? (data.break3Start as string | null)
            : currentShift.break3Start
              ? dateToTimeString(currentShift.break3Start)
              : null;
        const break3End =
          data.break3End !== undefined
            ? (data.break3End as string | null)
            : currentShift.break3End
              ? dateToTimeString(currentShift.break3End)
              : null;

        // Calculate new loading time
        updateData.loadingTimeInSec = calculateLoadingTimeInSec(
          workStart,
          workEnd,
          break1Start,
          break1End,
          break2Start,
          break2End,
          break3Start,
          break3End,
        );
      }
    }

    const shift = await db.shift.update({
      where: { id },
      data: updateData,
      include: {
        line: {
          select: {
            name: true,
          },
        },
      },
    });

    // Convert time fields to string format
    return {
      ...shift,
      workStart: dateToTimeString(shift.workStart),
      workEnd: dateToTimeString(shift.workEnd),
      break1Start: shift.break1Start
        ? dateToTimeString(shift.break1Start)
        : null,
      break1End: shift.break1End ? dateToTimeString(shift.break1End) : null,
      break2Start: shift.break2Start
        ? dateToTimeString(shift.break2Start)
        : null,
      break2End: shift.break2End ? dateToTimeString(shift.break2End) : null,
      break3Start: shift.break3Start
        ? dateToTimeString(shift.break3Start)
        : null,
      break3End: shift.break3End ? dateToTimeString(shift.break3End) : null,
    };
  },

  /**
   * Delete a shift (soft delete)
   */
  async delete(id: string) {
    return await db.shift.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  },

  /**
   * Count total shifts (excluding deleted)
   */
  async count(lineId?: string) {
    return await db.shift.count({
      where: {
        deletedAt: null,
        ...(lineId ? { lineId } : {}),
      },
    });
  },

  /**
   * Check if shift number exists in a specific line
   */
  async numberExistsInLine(number: number, lineId: string, excludeId?: string) {
    const shift = await db.shift.findFirst({
      where: {
        number,
        lineId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!shift) return false;
    if (excludeId && shift.id === excludeId) return false;
    return true;
  },
};
