import { db } from "@/lib/db";
import type { SearchFilter } from "@/components/ui/multi-column-search";
import type { Prisma } from "@prisma/client";

/**
 * Repository for UpdtCategory CRUD operations
 */

interface GetUpdtCategoriesParams {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  department?: string;
  plantId?: string;
}

/**
 * Build where clause for multi-column search
 */
function buildWhereClause(
  searchFilters: SearchFilter[] = [],
  lineId?: string,
  department?: string,
  plantId?: string,
): Prisma.UpdtCategoryWhereInput {
  const conditions: Prisma.UpdtCategoryWhereInput[] = [
    { deletedAt: null }, // Only non-deleted records
  ];

  // Filter by lineId if provided
  if (lineId) {
    conditions.push({ lineId });
  } else if (plantId) {
    conditions.push({ line: { plantId } });
  }

  // Filter by department if provided
  if (department) {
    conditions.push({ department });
  }

  // Apply search filters
  if (searchFilters.length > 0) {
    const searchConditions: Prisma.UpdtCategoryWhereInput[] = [];

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
        } else if (column === "department") {
          if (operator === "contains") {
            searchConditions.push({ department: { contains: value } });
          } else if (operator === "equals") {
            searchConditions.push({ department: { equals: value } });
          } else if (operator === "startsWith") {
            searchConditions.push({ department: { startsWith: value } });
          } else if (operator === "endsWith") {
            searchConditions.push({ department: { endsWith: value } });
          }
        } else if (column === "lineName") {
          if (operator === "contains") {
            searchConditions.push({ line: { name: { contains: value } } });
          } else if (operator === "equals") {
            searchConditions.push({ line: { name: { equals: value } } });
          } else if (operator === "startsWith") {
            searchConditions.push({ line: { name: { startsWith: value } } });
          } else if (operator === "endsWith") {
            searchConditions.push({ line: { name: { endsWith: value } } });
          }
        }
      } else if (type === "date") {
        const dateValue = new Date(value);
        if (Number.isNaN(dateValue.getTime())) return;

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
 * Get paginated UpdtCategories with search and sorting
 */
export async function getUpdtCategories(params: GetUpdtCategoriesParams = {}) {
  const {
    page = 1,
    limit = 10,
    searchFilters = [],
    sortBy = "department",
    sortOrder = "asc",
    lineId,
    department,
    plantId,
  } = params;

  const skip = (page - 1) * limit;
  const where = buildWhereClause(searchFilters, lineId, department, plantId);

  // Build orderBy
  let orderBy: Prisma.UpdtCategoryOrderByWithRelationInput = {};
  if (sortBy === "lineName") {
    orderBy = { line: { name: sortOrder } };
  } else if (sortBy === "department") {
    orderBy = { department: sortOrder };
  } else if (sortBy === "name") {
    orderBy = { name: sortOrder };
  } else if (sortBy === "createdAt") {
    orderBy = { createdAt: sortOrder };
  } else if (sortBy === "updatedAt") {
    orderBy = { updatedAt: sortOrder };
  } else {
    orderBy = { department: sortOrder };
  }

  const [updtCategories, total] = await Promise.all([
    db.updtCategory.findMany({
      where,
      include: {
        line: {
          select: {
            name: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    db.updtCategory.count({ where }),
  ]);

  return {
    updtCategories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get all UpdtCategories for export (no pagination)
 */
export async function getAllForExport(params?: {
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  department?: string;
  plantId?: string;
}) {
  const {
    searchFilters = [],
    sortBy = "department",
    sortOrder = "asc",
    lineId,
    department,
    plantId,
  } = params || {};

  const where = buildWhereClause(searchFilters, lineId, department, plantId);

  // Build orderBy
  let orderBy: Prisma.UpdtCategoryOrderByWithRelationInput = {};
  if (sortBy === "lineName") {
    orderBy = { line: { name: sortOrder } };
  } else if (sortBy === "department") {
    orderBy = { department: sortOrder };
  } else if (sortBy === "name") {
    orderBy = { name: sortOrder };
  } else if (sortBy === "createdAt") {
    orderBy = { createdAt: sortOrder };
  } else if (sortBy === "updatedAt") {
    orderBy = { updatedAt: sortOrder };
  } else {
    orderBy = { department: sortOrder };
  }

  const updtCategories = await db.updtCategory.findMany({
    where,
    include: {
      line: {
        select: {
          name: true,
        },
      },
    },
    orderBy,
  });

  return { updtCategories };
}

/**
 * Get UpdtCategory by ID
 */
export async function getById(id: string) {
  return await db.updtCategory.findUnique({
    where: { id },
    include: {
      line: {
        select: {
          name: true,
        },
      },
    },
  });
}

/**
 * Check if category exists with same lineId, department, and name
 * (for unique constraint validation)
 */
export async function categoryExists(
  lineId: string,
  department: string,
  name: string,
  excludeId?: string,
) {
  const existing = await db.updtCategory.findFirst({
    where: {
      lineId,
      department,
      name,
      deletedAt: null,
    },
  });

  if (!existing) return false;
  if (excludeId && existing.id === excludeId) return false;

  return true;
}

/**
 * Create a new UpdtCategory
 */
export async function create(data: {
  department: string;
  lineId: string;
  name: string;
}) {
  return await db.updtCategory.create({
    data,
    include: {
      line: {
        select: {
          name: true,
        },
      },
    },
  });
}

/**
 * Update an UpdtCategory
 */
export async function update(
  id: string,
  data: {
    department?: string;
    lineId?: string;
    name?: string;
  },
) {
  return await db.updtCategory.update({
    where: { id },
    data,
    include: {
      line: {
        select: {
          name: true,
        },
      },
    },
  });
}

/**
 * Soft delete an UpdtCategory
 */
export async function deleteUpdtCategory(id: string) {
  return await db.updtCategory.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
