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
): Prisma.PlantWhereInput | null {
  const { column, operator, value, type } = filter;

  // Validate column name to prevent injection
  const validColumns = [
    "name",
    "subplant",
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

      case "boolean": {
        condition[column] = value === "true";
        break;
      }

      case "date": {
        const dateValue = new Date(value);
        if (Number.isNaN(dateValue.getTime())) {
          console.warn(`Invalid date value: ${value}`);
          return null;
        }

        switch (operator) {
          case "equals":
          case "after":
          case "before": {
            const startOfDay = new Date(dateValue);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(dateValue);
            endOfDay.setHours(23, 59, 59, 999);

            if (operator === "equals") {
              condition[column] = {
                gte: startOfDay,
                lte: endOfDay,
              };
            } else if (operator === "after") {
              condition[column] = { gte: endOfDay };
            } else {
              condition[column] = { lte: startOfDay };
            }
            break;
          }
          case "gt":
            condition[column] = { gt: dateValue };
            break;
          case "gte":
            condition[column] = { gte: dateValue };
            break;
          case "lt":
            condition[column] = { lt: dateValue };
            break;
          case "lte":
            condition[column] = { lte: dateValue };
            break;
        }
        break;
      }

      default:
        console.warn(`Unsupported type: ${type}`);
        return null;
    }

    return condition as Prisma.PlantWhereInput;
  } catch (error) {
    console.error("Error building filter condition:", error);
    return null;
  }
}

/**
 * Build where clause from search filters
 */
function buildWhereClause(searchFilters?: SearchFilter[]) {
  if (!searchFilters || searchFilters.length === 0) {
    return {};
  }

  const conditions = searchFilters
    .map((filter) => buildFilterCondition(filter))
    .filter((condition) => condition !== null);

  if (conditions.length === 0) {
    return {};
  }

  return { AND: conditions };
}

/**
 * Get paginated plants with search and sorting
 */
export async function getAll(params?: {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const skip = (page - 1) * limit;

  const where = buildWhereClause(params?.searchFilters);

  // Build orderBy
  const orderBy: Prisma.PlantOrderByWithRelationInput = params?.sortBy
    ? { [params.sortBy]: params.sortOrder || "asc" }
    : { createdAt: "desc" };

  const [plants, total] = await Promise.all([
    db.plant.findMany({
      where: {
        ...where,
        deletedAt: null,
      },
      orderBy,
      skip,
      take: limit,
    }),
    db.plant.count({
      where: {
        ...where,
        deletedAt: null,
      },
    }),
  ]);

  return {
    plants,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get all plants for export (no pagination)
 */
export async function getAllForExport(params?: {
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const where = buildWhereClause(params?.searchFilters);

  // Build orderBy
  const orderBy: Prisma.PlantOrderByWithRelationInput = params?.sortBy
    ? { [params.sortBy]: params.sortOrder || "asc" }
    : { createdAt: "desc" };

  const plants = await db.plant.findMany({
    where: {
      ...where,
      deletedAt: null,
    },
    orderBy,
  });

  return { plants };
}

/**
 * Get plant by ID
 */
export async function getById(id: string) {
  return await db.plant.findUnique({
    where: { id },
  });
}

/**
 * Get plant by name
 */
export async function getByName(name: string, excludeId?: string) {
  const where: Prisma.PlantWhereInput = {
    name: {
      equals: name,
    },
    deletedAt: null,
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  return await db.plant.findFirst({ where });
}

/**
 * Create a new plant
 */
export async function create(data: {
  name: string;
  subplant: string;
  isActive?: boolean;
}) {
  return await db.plant.create({
    data: {
      name: data.name,
      subplant: data.subplant,
      isActive: data.isActive ?? true,
    },
  });
}

/**
 * Update a plant
 */
export async function update(id: string, data: Record<string, unknown>) {
  return await db.plant.update({
    where: { id },
    data,
  });
}

/**
 * Delete a plant (soft delete)
 */
export async function remove(id: string) {
  return await db.plant.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
}
