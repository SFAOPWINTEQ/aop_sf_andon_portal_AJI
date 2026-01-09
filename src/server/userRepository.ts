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
 * Build Prisma filter condition based on operator and type
 */
function buildFilterCondition(
  filter: SearchFilter,
): Prisma.UserWhereInput | null {
  const { column, operator, value, type } = filter;

  // Validate column name to prevent injection
  const validColumns = [
    "name",
    "npk",
    "role",
    "isActive",
    "createdAt",
    "updatedAt",
    "lastLoginAt",
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

    return condition as Prisma.UserWhereInput;
  } catch (error) {
    console.error(`Error building filter condition:`, error);
    return null;
  }
}

export const userRepository = {
  /**
   * Get all users with pagination, search, and sorting
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    searchFilters?: SearchFilter[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const search = params?.search || "";
    const searchFilters = params?.searchFilters || [];
    const sortBy = params?.sortBy || "createdAt";
    const sortOrder = params?.sortOrder || "desc";

    const skip = (page - 1) * limit;

    // Build where clause for search
    let where: Prisma.UserWhereInput = {};

    // If using multi-column search filters
    if (searchFilters.length > 0) {
      const filterConditions: Prisma.UserWhereInput[] = searchFilters
        .map((filter) => buildFilterCondition(filter))
        .filter(
          (condition): condition is Prisma.UserWhereInput => condition !== null,
        );

      // Use AND logic for multiple filters
      if (filterConditions.length > 0) {
        where = { AND: filterConditions };
      }
    }
    // Fallback to simple search if provided and no filters
    else if (search) {
      where = {
        OR: [{ name: { contains: search } }, { npk: { contains: search } }],
      };
    }

    // Build orderBy clause
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get all users for export (no pagination)
   */
  async getAllForExport(params?: {
    searchFilters?: SearchFilter[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const searchFilters = params?.searchFilters || [];
    const sortBy = params?.sortBy || "createdAt";
    const sortOrder = params?.sortOrder || "desc";

    // Build where clause for search
    let where: Prisma.UserWhereInput = {};

    // If using multi-column search filters
    if (searchFilters.length > 0) {
      const filterConditions: Prisma.UserWhereInput[] = searchFilters
        .map((filter) => buildFilterCondition(filter))
        .filter(
          (condition): condition is Prisma.UserWhereInput => condition !== null,
        );

      // Use AND logic for multiple filters
      if (filterConditions.length > 0) {
        where = { AND: filterConditions };
      }
    }

    // Build orderBy clause
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const users = await db.user.findMany({
      where,
      orderBy,
      // No skip/take - fetch all records
    });

    return {
      users,
      total: users.length,
    };
  },

  /**
   * Get user by ID
   */
  async getById(id: string) {
    return await db.user.findUnique({
      where: { id },
    });
  },

  /**
   * Get user by NPK
   */
  async getByNpk(npk: string) {
    return await db.user.findUnique({
      where: { npk },
    });
  },

  /**
   * Create a new user
   */
  async create(data: Prisma.UserCreateInput) {
    return await db.user.create({
      data,
    });
  },

  /**
   * Update a user
   */
  async update(id: string, data: Prisma.UserUpdateInput) {
    return await db.user.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete a user
   */
  async delete(id: string) {
    return await db.user.delete({
      where: { id },
    });
  },

  /**
   * Toggle user active status
   */
  async toggleActive(id: string) {
    const user = await db.user.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return await db.user.update({
      where: { id },
      data: {
        isActive: !user.isActive,
      },
    });
  },

  /**
   * Count total users
   */
  async count() {
    return await db.user.count();
  },

  /**
   * Check if NPK exists
   */
  async npkExists(npk: string, excludeId?: string) {
    const user = await db.user.findUnique({
      where: { npk },
      select: { id: true },
    });

    if (!user) return false;
    if (excludeId && user.id === excludeId) return false;
    return true;
  },
};
