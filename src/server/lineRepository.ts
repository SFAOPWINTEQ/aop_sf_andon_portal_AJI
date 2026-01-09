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
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
  type: ColumnType;
}

/**
 * Build Prisma filter condition based on operator and type
 */
function buildFilterCondition(
  filter: SearchFilter,
): Prisma.LineWhereInput | null {
  const { column, operator, value, type } = filter;

  // Validate column name to prevent injection
  const validColumns = [
    "name",
    "isActive",
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

    return condition as Prisma.LineWhereInput;
  } catch (error) {
    console.error(`Error building filter condition:`, error);
    return null;
  }
}

export const lineRepository = {
  /**
   * Get all lines with pagination, search, and sorting
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    searchFilters?: SearchFilter[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    plantId?: string;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const search = params?.search || "";
    const searchFilters = params?.searchFilters || [];
    const sortBy = params?.sortBy || "createdAt";
    const sortOrder = params?.sortOrder || "desc";
    const plantId = params?.plantId;

    const skip = (page - 1) * limit;

    // Build where clause for search
    let where: Prisma.LineWhereInput = {
      deletedAt: null, // Only show non-deleted lines
      ...(plantId ? { plantId } : {}),
    };

    // If using multi-column search filters
    if (searchFilters.length > 0) {
      const filterConditions: Prisma.LineWhereInput[] = searchFilters
        .map((filter) => buildFilterCondition(filter))
        .filter(
          (condition): condition is Prisma.LineWhereInput => condition !== null,
        );

      // Use AND logic for multiple filters
      if (filterConditions.length > 0) {
        const base: Prisma.LineWhereInput = {
          deletedAt: null,
          ...(plantId ? { plantId } : {}),
        };
        where = { AND: [base, ...filterConditions] };
      }
    }
    // Fallback to simple search if provided and no filters
    else if (search) {
      where = {
        deletedAt: null,
        ...(plantId ? { plantId } : {}),
        name: { contains: search },
      };
    }

    // Build orderBy clause
    const orderBy: Prisma.LineOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [lines, total] = await Promise.all([
      db.line.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          plant: {
            select: {
              name: true,
            },
          },
        },
      }),
      db.line.count({ where }),
    ]);

    return {
      lines,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get all lines for export (no pagination)
   */
  async getAllForExport(params?: {
    searchFilters?: SearchFilter[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    plantId?: string;
  }) {
    const searchFilters = params?.searchFilters || [];
    const sortBy = params?.sortBy || "createdAt";
    const sortOrder = params?.sortOrder || "desc";
    const plantId = params?.plantId;

    // Build where clause for search
    let where: Prisma.LineWhereInput = {
      deletedAt: null, // Only show non-deleted lines
      ...(plantId ? { plantId } : {}),
    };

    // If using multi-column search filters
    if (searchFilters.length > 0) {
      const filterConditions: Prisma.LineWhereInput[] = searchFilters
        .map((filter) => buildFilterCondition(filter))
        .filter(
          (condition): condition is Prisma.LineWhereInput => condition !== null,
        );

      // Use AND logic for multiple filters
      if (filterConditions.length > 0) {
        const base: Prisma.LineWhereInput = {
          deletedAt: null,
          ...(plantId ? { plantId } : {}),
        };
        where = { AND: [base, ...filterConditions] };
      }
    }

    // Build orderBy clause
    const orderBy: Prisma.LineOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const lines = await db.line.findMany({
      where,
      orderBy,
      // No skip/take - fetch all records
      include: {
        plant: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      lines,
      total: lines.length,
    };
  },

  /**
   * Get line by ID
   */
  async getById(id: string) {
    return await db.line.findUnique({
      where: { id },
      include: {
        plant: {
          select: {
            name: true,
          },
        },
      },
    });
  },

  /**
   * Get line by name
   */
  async getByName(name: string) {
    return await db.line.findUnique({
      where: { name },
    });
  },

  /**
   * Create a new line
   */
  async create(data: Prisma.LineCreateInput) {
    return await db.line.create({
      data,
    });
  },

  /**
   * Update a line
   */
  async update(id: string, data: Prisma.LineUpdateInput) {
    return await db.line.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete a line (soft delete)
   */
  async delete(id: string) {
    return await db.line.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  },

  /**
   * Toggle line active status
   */
  async toggleActive(id: string) {
    const line = await db.line.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!line) {
      throw new Error("Line not found");
    }

    return await db.line.update({
      where: { id },
      data: {
        isActive: !line.isActive,
      },
    });
  },

  /**
   * Count total lines (excluding deleted)
   */
  async count() {
    return await db.line.count({
      where: { deletedAt: null },
    });
  },

  /**
   * Check if line name exists
   */
  async nameExists(name: string, excludeId?: string) {
    const line = await db.line.findFirst({
      where: {
        name,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!line) return false;
    if (excludeId && line.id === excludeId) return false;
    return true;
  },
};
