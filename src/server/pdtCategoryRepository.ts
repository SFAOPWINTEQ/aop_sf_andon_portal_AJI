import { db } from "@/lib/db";
import type { SearchFilter } from "@/components/ui/multi-column-search";
import type { Prisma } from "@prisma/client";

/**
 * Repository for PdtCategory CRUD operations
 */

interface GetPdtCategoriesParams {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Build where clause for multi-column search
 */
function buildWhereClause(
  searchFilters: SearchFilter[] = [],
): Prisma.PdtCategoryWhereInput {
  const conditions: Prisma.PdtCategoryWhereInput[] = [
    { deletedAt: null }, // Only non-deleted records
  ];

  // Apply search filters
  if (searchFilters.length > 0) {
    const searchConditions: Prisma.PdtCategoryWhereInput[] = [];

    searchFilters.forEach((filter) => {
      const { column, operator, value, type } = filter;

      if (!value || value === "") return;

      if (type === "string") {
        if (column === "name") {
          if (operator === "contains") {
            searchConditions.push({ name: { contains: value } });
          } else if (operator === "equals") {
            searchConditions.push({ name: { equals: value } });
          } else if (operator === "startsWith") {
            searchConditions.push({ name: { startsWith: value } });
          } else if (operator === "endsWith") {
            searchConditions.push({ name: { endsWith: value } });
          }
        }
      } else if (type === "number") {
        const numValue = parseFloat(value);
        if (Number.isNaN(numValue)) return;

        if (column === "defaultDurationMin") {
          if (operator === "equals") {
            searchConditions.push({ defaultDurationMin: numValue });
          } else if (operator === "gt") {
            searchConditions.push({ defaultDurationMin: { gt: numValue } });
          } else if (operator === "gte") {
            searchConditions.push({ defaultDurationMin: { gte: numValue } });
          } else if (operator === "lt") {
            searchConditions.push({ defaultDurationMin: { lt: numValue } });
          } else if (operator === "lte") {
            searchConditions.push({ defaultDurationMin: { lte: numValue } });
          }
        }
      } else if (type === "date") {
        const dateValue = new Date(value);
        const timeValue = dateValue.getTime();
        if (Number.isNaN(timeValue)) return;

        if (column === "createdAt") {
          if (operator === "equals") {
            searchConditions.push({
              createdAt: {
                gte: new Date(dateValue.setHours(0, 0, 0, 0)),
                lt: new Date(dateValue.setHours(23, 59, 59, 999)),
              },
            });
          } else if (operator === "gt") {
            searchConditions.push({ createdAt: { gt: dateValue } });
          } else if (operator === "gte") {
            searchConditions.push({ createdAt: { gte: dateValue } });
          } else if (operator === "lt") {
            searchConditions.push({ createdAt: { lt: dateValue } });
          } else if (operator === "lte") {
            searchConditions.push({ createdAt: { lte: dateValue } });
          }
        } else if (column === "updatedAt") {
          if (operator === "equals") {
            searchConditions.push({
              updatedAt: {
                gte: new Date(dateValue.setHours(0, 0, 0, 0)),
                lt: new Date(dateValue.setHours(23, 59, 59, 999)),
              },
            });
          } else if (operator === "gt") {
            searchConditions.push({ updatedAt: { gt: dateValue } });
          } else if (operator === "gte") {
            searchConditions.push({ updatedAt: { gte: dateValue } });
          } else if (operator === "lt") {
            searchConditions.push({ updatedAt: { lt: dateValue } });
          } else if (operator === "lte") {
            searchConditions.push({ updatedAt: { lte: dateValue } });
          }
        }
      }
    });

    if (searchConditions.length > 0) {
      conditions.push({ AND: searchConditions });
    }
  }

  return conditions.length > 1 ? { AND: conditions } : conditions[0];
}

/**
 * Get paginated PdtCategories with search and sorting
 */
export async function getPdtCategories(params: GetPdtCategoriesParams = {}) {
  const {
    page = 1,
    limit = 10,
    searchFilters = [],
    sortBy = "name",
    sortOrder = "asc",
  } = params;

  const skip = (page - 1) * limit;
  const where = buildWhereClause(searchFilters);

  // Build orderBy
  let orderBy: Prisma.PdtCategoryOrderByWithRelationInput = {};
  if (sortBy === "name") {
    orderBy = { name: sortOrder };
  } else if (sortBy === "defaultDurationMin") {
    orderBy = { defaultDurationMin: sortOrder };
  } else if (sortBy === "createdAt") {
    orderBy = { createdAt: sortOrder };
  } else if (sortBy === "updatedAt") {
    orderBy = { updatedAt: sortOrder };
  } else {
    orderBy = { name: sortOrder };
  }

  const [pdtCategories, total] = await Promise.all([
    db.pdtCategory.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    db.pdtCategory.count({ where }),
  ]);

  return {
    pdtCategories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get all PdtCategories for export (no pagination)
 */
export async function getAllForExport(params?: {
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const {
    searchFilters = [],
    sortBy = "name",
    sortOrder = "asc",
  } = params || {};

  const where = buildWhereClause(searchFilters);

  // Build orderBy
  let orderBy: Prisma.PdtCategoryOrderByWithRelationInput = {};
  if (sortBy === "name") {
    orderBy = { name: sortOrder };
  } else if (sortBy === "defaultDurationMin") {
    orderBy = { defaultDurationMin: sortOrder };
  } else if (sortBy === "createdAt") {
    orderBy = { createdAt: sortOrder };
  } else if (sortBy === "updatedAt") {
    orderBy = { updatedAt: sortOrder };
  } else {
    orderBy = { name: sortOrder };
  }

  const pdtCategories = await db.pdtCategory.findMany({
    where,
    orderBy,
  });

  return { pdtCategories };
}

/**
 * Get PdtCategory by ID
 */
export async function getById(id: string) {
  return await db.pdtCategory.findUnique({
    where: { id },
  });
}

/**
 * Check if category name already exists (for uniqueness validation)
 */
export async function nameExists(name: string, excludeId?: string) {
  const existing = await db.pdtCategory.findUnique({
    where: { name, deletedAt: null },
  });

  if (!existing) return false;
  if (excludeId && existing.id === excludeId) return false;

  return true;
}

/**
 * Create a new PdtCategory
 */
export async function create(data: {
  name: string;
  defaultDurationMin: number;
}) {
  return await db.pdtCategory.create({
    data,
  });
}

/**
 * Update a PdtCategory
 */
export async function update(
  id: string,
  data: {
    name?: string;
    defaultDurationMin?: number;
  },
) {
  return await db.pdtCategory.update({
    where: { id },
    data,
  });
}

/**
 * Soft delete a PdtCategory
 */
export async function deletePdtCategory(id: string) {
  return await db.pdtCategory.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
