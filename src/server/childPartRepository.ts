import { db } from "@/lib/db";
import type { SearchFilter } from "@/components/ui/multi-column-search";
import { Prisma } from "@prisma/client";

/**
 * Params
 */
interface GetChildPartsParams {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  partId?: string;
  lineId?: string;
  plantId?: string;
}

/**
 * Build WHERE clause for ChildPart
 */
function buildWhereClause(
  searchFilters: SearchFilter[] = [],
  partId?: string,
  lineId?: string,
  plantId?: string,
): Prisma.ChildPartWhereInput {
  console.log("searchFilterssearchFilterssearchFilterssearchFilters" + JSON.stringify(searchFilters))
  const conditions: Prisma.ChildPartWhereInput[] = [
    { deletedAt: null },
  ];

  if (partId) {
    conditions.push({ partId });
  }

  if (lineId) {
    conditions.push({
      part: {
        lineId,
      },
    });
  }

  if (plantId) {
    conditions.push({
      part: {
        line: {
          plantId,
        },
      },
    });
  }

  if (searchFilters.length > 0) {
    const searchConditions: Prisma.ChildPartWhereInput[] = [];

    for (const filter of searchFilters) {
      const { column, operator, value, type } = filter;
      if (!value) continue;

      /* STRING */
      if (type === "string") {
        if (column === "childPartNo") {
          searchConditions.push({
            childPartNo: { [operator]: value } as any,
          });
        }

        if (column === "childPartname") {
          searchConditions.push({
            childPartname: { [operator]: value } as any,
          });
        }

        if (column === "partNo") {
          searchConditions.push({
            part: {
              partNo: { [operator]: value } as any,
            },
          });
        }

        if (column === "partName") {
          searchConditions.push({
            part: {
              name: { [operator]: value } as any,
            },
          });
        }

        if (column === "partSku") {
          searchConditions.push({
            part: {
              sku: { [operator]: value } as any,
            },
          });
        }
      }

      /* NUMBER */
      if (type === "number" && column === "qtyLotSupply") {
        const num = Number(value);
        if (!Number.isNaN(num)) {
          searchConditions.push({
            qtyLotSupply: { [operator]: num } as any,
          });
        }
      }

      /* DATE */
      if (type === "date") {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) continue;

        if (column === "createdAt") {
          searchConditions.push({
            createdAt: { [operator]: date } as any,
          });
        }

        if (column === "updatedAt") {
          searchConditions.push({
            updatedAt: { [operator]: date } as any,
          });
        }
      }
    }

    if (searchConditions.length > 0) {
      conditions.push({ AND: searchConditions });
    }
  }

  return conditions.length > 1 ? { AND: conditions } : conditions[0];
}

/**
 * Get paginated ChildParts
 */
export async function getChildParts(params: GetChildPartsParams = {}) {
  const {
    page = 1,
    limit = 10,
    searchFilters = [],
    sortBy = "childPartNo",
    sortOrder = "asc",
    partId,
    lineId,
    plantId,
  } = params;

  const skip = (page - 1) * limit;

  const where = buildWhereClause(
    searchFilters,
    partId,
    lineId,
    plantId,
  );

  let orderBy: Prisma.ChildPartOrderByWithRelationInput = {
    childPartNo: sortOrder,
  };

  if (sortBy === "childPartname") orderBy = { childPartname: sortOrder };
  if (sortBy === "qtyLotSupply") orderBy = { qtyLotSupply: sortOrder };
  if (sortBy === "createdAt") orderBy = { createdAt: sortOrder };
  if (sortBy === "updatedAt") orderBy = { updatedAt: sortOrder };
  if (sortBy === "partNo") {
    orderBy = {
      part: { partNo: sortOrder },
    };
  }

  const [data, total] = await Promise.all([
    db.childPart.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        part: {
          select: {
            id: true,
            partNo: true,
            name: true,
            sku: true,
            lineId: true,
            line: {
              select: {
                plantId: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    db.childPart.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get ChildPart by ID
 */
export async function getChildPartById(id: string) {
  return db.childPart.findUnique({
    where: { id },
    include: {
      part: {
        select: {
          id: true,
          partNo: true,
          name: true,
          sku: true,
          line: {
            select: {
              id: true,
              name: true,
              plantId: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Create ChildPart
 */
export async function createChildPart(data: {
  childPartNo: string;
  childPartname: string;
  qtyLotSupply?: number | null;
  partId: string;
}) {
  return db.childPart.create({ data });
}

/**
 * Update ChildPart
 */
export async function updateChildPart(
  id: string,
  data: Partial<{
    childPartNo: string;
    childPartname: string;
    qtyLotSupply: number | null;
    partId: string;
  }>,
) {
  return db.childPart.update({
    where: { id },
    data,
  });
}

/**
 * Soft delete ChildPart
 */
export async function deleteChildPart(id: string) {
  return db.childPart.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}