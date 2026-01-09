import { db } from "@/lib/db";
import type { SearchFilter } from "@/components/ui/multi-column-search";
import type { Prisma } from "@prisma/client";

/**
 * Repository for RejectCriteria CRUD operations
 */

interface GetRejectCriteriasParams {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  category?: string;
  plantId?: string;
}

/**
 * Build where clause for multi-column search
 */
function buildWhereClause(
  searchFilters: SearchFilter[] = [],
  lineId?: string,
  category?: string,
  plantId?: string,
): Prisma.RejectCriteriaWhereInput {
  const conditions: Prisma.RejectCriteriaWhereInput[] = [
    { deletedAt: null }, // Only non-deleted records
  ];

  // Filter by lineId if provided
  if (lineId) {
    conditions.push({ lineId });
  } else if (plantId) {
    conditions.push({ line: { plantId } });
  }

  // Filter by category if provided
  if (category) {
    conditions.push({ category });
  }

  // Apply search filters
  if (searchFilters.length > 0) {
    const searchConditions: Prisma.RejectCriteriaWhereInput[] = [];

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
        } else if (column === "category") {
          if (operator === "contains") {
            searchConditions.push({ category: { contains: value } });
          } else if (operator === "equals") {
            searchConditions.push({ category: { equals: value } });
          } else if (operator === "startsWith") {
            searchConditions.push({ category: { startsWith: value } });
          } else if (operator === "endsWith") {
            searchConditions.push({ category: { endsWith: value } });
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
 * Get paginated RejectCriterias with search and sorting
 */
export async function getRejectCriterias(
  params: GetRejectCriteriasParams = {},
) {
  const {
    page = 1,
    limit = 10,
    searchFilters = [],
    sortBy = "category",
    sortOrder = "asc",
    lineId,
    category,
    plantId,
  } = params;

  const skip = (page - 1) * limit;
  const where = buildWhereClause(searchFilters, lineId, category, plantId);

  // Build orderBy
  let orderBy: Prisma.RejectCriteriaOrderByWithRelationInput = {};
  if (sortBy === "lineName") {
    orderBy = { line: { name: sortOrder } };
  } else if (sortBy === "category") {
    orderBy = { category: sortOrder };
  } else if (sortBy === "name") {
    orderBy = { name: sortOrder };
  } else if (sortBy === "createdAt") {
    orderBy = { createdAt: sortOrder };
  } else if (sortBy === "updatedAt") {
    orderBy = { updatedAt: sortOrder };
  } else {
    orderBy = { category: sortOrder };
  }

  const [rejectCriterias, total] = await Promise.all([
    db.rejectCriteria.findMany({
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
    db.rejectCriteria.count({ where }),
  ]);

  return {
    rejectCriterias,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get all RejectCriterias for export (no pagination)
 */
export async function getAllForExport(params?: {
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  category?: string;
  plantId?: string;
}) {
  const {
    searchFilters = [],
    sortBy = "category",
    sortOrder = "asc",
    lineId,
    category,
    plantId,
  } = params || {};

  const where = buildWhereClause(searchFilters, lineId, category, plantId);

  // Build orderBy
  let orderBy: Prisma.RejectCriteriaOrderByWithRelationInput = {};
  if (sortBy === "lineName") {
    orderBy = { line: { name: sortOrder } };
  } else if (sortBy === "category") {
    orderBy = { category: sortOrder };
  } else if (sortBy === "name") {
    orderBy = { name: sortOrder };
  } else if (sortBy === "createdAt") {
    orderBy = { createdAt: sortOrder };
  } else if (sortBy === "updatedAt") {
    orderBy = { updatedAt: sortOrder };
  } else {
    orderBy = { category: sortOrder };
  }

  const rejectCriterias = await db.rejectCriteria.findMany({
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

  return rejectCriterias;
}

/**
 * Get RejectCriteria by ID
 */
export async function getRejectCriteriaById(id: string) {
  return await db.rejectCriteria.findUnique({
    where: { id, deletedAt: null },
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
 * Check if reject criteria exists with same lineId, category, and name
 */
export async function rejectCriteriaExistsInLineAndCategory(
  lineId: string,
  category: string,
  name: string,
  excludeId?: string,
): Promise<boolean> {
  const existing = await db.rejectCriteria.findFirst({
    where: {
      lineId,
      category,
      name,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  return !!existing;
}

/**
 * Create new RejectCriteria
 */
export async function createRejectCriteria(data: {
  lineId: string;
  category: string;
  name: string;
}) {
  return await db.rejectCriteria.create({
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
 * Update RejectCriteria
 */
export async function updateRejectCriteria(
  id: string,
  data: {
    lineId?: string;
    category?: string;
    name?: string;
  },
) {
  return await db.rejectCriteria.update({
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
 * Soft delete RejectCriteria
 */
export async function deleteRejectCriteria(id: string) {
  return await db.rejectCriteria.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
