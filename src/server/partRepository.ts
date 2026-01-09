import { db } from "@/lib/db";
import type { SearchFilter } from "@/components/ui/multi-column-search";
import { Prisma } from "@prisma/client";

/**
 * Repository for Part CRUD operations
 */

interface GetPartsParams {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  plantId?: string;
}

/**
 * Build where clause for multi-column search
 */
function buildWhereClause(
  searchFilters: SearchFilter[] = [],
  lineId?: string,
  plantId?: string,
): Prisma.PartWhereInput {
  const conditions: Prisma.PartWhereInput[] = [
    { deletedAt: null }, // Only non-deleted records
  ];

  // Filter by line
  if (lineId) {
    conditions.push({ lineId });
  }

  // Filter by plant (via line)
  if (plantId) {
    conditions.push({
      line: {
        plantId,
      },
    });
  }

  // Apply search filters
  if (searchFilters.length > 0) {
    const searchConditions: Prisma.PartWhereInput[] = [];

    searchFilters.forEach((filter) => {
      const { column, operator, value, type } = filter;

      if (!value || value === "") return;

      if (type === "string") {
        if (column === "sku") {
          if (operator === "contains") {
            searchConditions.push({ sku: { contains: value } });
          } else if (operator === "equals") {
            searchConditions.push({ sku: { equals: value } });
          } else if (operator === "startsWith") {
            searchConditions.push({ sku: { startsWith: value } });
          } else if (operator === "endsWith") {
            searchConditions.push({ sku: { endsWith: value } });
          }
        } else if (column === "partNo") {
          if (operator === "contains") {
            searchConditions.push({ partNo: { contains: value } });
          } else if (operator === "equals") {
            searchConditions.push({ partNo: { equals: value } });
          } else if (operator === "startsWith") {
            searchConditions.push({ partNo: { startsWith: value } });
          } else if (operator === "endsWith") {
            searchConditions.push({ partNo: { endsWith: value } });
          }
        } else if (column === "name") {
          if (operator === "contains") {
            searchConditions.push({ name: { contains: value } });
          } else if (operator === "equals") {
            searchConditions.push({ name: { equals: value } });
          } else if (operator === "startsWith") {
            searchConditions.push({ name: { startsWith: value } });
          } else if (operator === "endsWith") {
            searchConditions.push({ name: { endsWith: value } });
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
      } else if (type === "number") {
        const numValue = parseFloat(value);
        if (Number.isNaN(numValue)) return;

        if (column === "qtyPerLot") {
          if (operator === "equals") {
            searchConditions.push({ qtyPerLot: numValue });
          } else if (operator === "gt") {
            searchConditions.push({ qtyPerLot: { gt: numValue } });
          } else if (operator === "gte") {
            searchConditions.push({ qtyPerLot: { gte: numValue } });
          } else if (operator === "lt") {
            searchConditions.push({ qtyPerLot: { lt: numValue } });
          } else if (operator === "lte") {
            searchConditions.push({ qtyPerLot: { lte: numValue } });
          }
        } else if (column === "cycleTimeSec") {
          if (operator === "equals") {
            searchConditions.push({ cycleTimeSec: numValue });
          } else if (operator === "gt") {
            searchConditions.push({ cycleTimeSec: { gt: numValue } });
          } else if (operator === "gte") {
            searchConditions.push({ cycleTimeSec: { gte: numValue } });
          } else if (operator === "lt") {
            searchConditions.push({ cycleTimeSec: { lt: numValue } });
          } else if (operator === "lte") {
            searchConditions.push({ cycleTimeSec: { lte: numValue } });
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
 * Get paginated Parts with search and sorting
 */
export async function getParts(params: GetPartsParams = {}) {
  const {
    page = 1,
    limit = 10,
    searchFilters = [],
    sortBy = "partNo",
    sortOrder = "asc",
    lineId,
    plantId,
  } = params;

  const skip = (page - 1) * limit;
  const where = buildWhereClause(searchFilters, lineId, plantId);

  // Build orderBy
  let orderBy: Prisma.PartOrderByWithRelationInput = {};
  if (sortBy === "sku") {
    orderBy = { sku: sortOrder };
  } else if (sortBy === "partNo") {
    orderBy = { partNo: sortOrder };
  } else if (sortBy === "name") {
    orderBy = { name: sortOrder };
  } else if (sortBy === "lineName") {
    orderBy = { line: { name: sortOrder } };
  } else if (sortBy === "qtyPerLot") {
    orderBy = { qtyPerLot: sortOrder };
  } else if (sortBy === "cycleTimeSec") {
    orderBy = { cycleTimeSec: sortOrder };
  } else if (sortBy === "createdAt") {
    orderBy = { createdAt: sortOrder };
  } else if (sortBy === "updatedAt") {
    orderBy = { updatedAt: sortOrder };
  } else {
    orderBy = { partNo: sortOrder };
  }

  const [parts, total] = await Promise.all([
    db.part.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        line: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    db.part.count({ where }),
  ]);

  return {
    parts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get all Parts for export (no pagination)
 */
export async function getAllForExport(params?: {
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  plantId?: string;
}) {
  const {
    searchFilters = [],
    sortBy = "partNo",
    sortOrder = "asc",
    lineId,
    plantId,
  } = params || {};

  const where = buildWhereClause(searchFilters, lineId, plantId);

  // Build orderBy
  let orderBy: Prisma.PartOrderByWithRelationInput = {};
  if (sortBy === "sku") {
    orderBy = { sku: sortOrder };
  } else if (sortBy === "partNo") {
    orderBy = { partNo: sortOrder };
  } else if (sortBy === "name") {
    orderBy = { name: sortOrder };
  } else if (sortBy === "lineName") {
    orderBy = { line: { name: sortOrder } };
  } else if (sortBy === "qtyPerLot") {
    orderBy = { qtyPerLot: sortOrder };
  } else if (sortBy === "cycleTimeSec") {
    orderBy = { cycleTimeSec: sortOrder };
  } else if (sortBy === "createdAt") {
    orderBy = { createdAt: sortOrder };
  } else if (sortBy === "updatedAt") {
    orderBy = { updatedAt: sortOrder };
  } else {
    orderBy = { partNo: sortOrder };
  }

  const parts = await db.part.findMany({
    where,
    orderBy,
    include: {
      line: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return { parts };
}

/**
 * Get Part by ID
 */
export async function getById(id: string) {
  return await db.part.findUnique({
    where: { id },
    include: {
      line: {
        select: {
          id: true,
          name: true,
          plantId: true,
        },
      },
    },
  });
}

/**
 * Check if SKU already exists (for uniqueness validation)
 */
export async function skuExists(sku: string, excludeId?: string) {
  const existing = await db.part.findUnique({
    where: { sku, deletedAt: null },
  });

  if (!existing) return false;
  if (excludeId && existing.id === excludeId) return false;

  return true;
}

/**
 * Check if part number already exists (for uniqueness validation)
 */
export async function partNoExists(partNo: string, excludeId?: string) {
  const existing = await db.part.findUnique({
    where: { partNo, deletedAt: null },
  });

  if (!existing) return false;
  if (excludeId && existing.id === excludeId) return false;

  return true;
}

/**
 * Create a new Part
 */
export async function create(data: {
  sku?: string | null;
  partNo: string;
  name: string;
  lineId: string;
  qtyPerLot?: number | null;
  cycleTimeSec?: number | null;
}) {
  return await db.part.create({
    data,
    include: {
      line: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Update a Part
 */
export async function update(
  id: string,
  data: {
    sku?: string | null;
    partNo?: string;
    name?: string;
    lineId?: string;
    qtyPerLot?: number | null;
    cycleTimeSec?: number | null;
  },
) {
  return await db.part.update({
    where: { id },
    data,
    include: {
      line: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Soft delete a Part
 */
export async function deletePart(id: string) {
  return await db.part.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
