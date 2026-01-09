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
  | "after";

export interface SearchFilter {
  column: string;
  operator: FilterOperator;
  value: string;
  type: ColumnType;
}

function buildStringFilter(
  relation: "user" | "line" | null,
  field: string | null,
  operator: FilterOperator,
  value: string
) {
  const condition =
    operator === "equals" ? { equals: value } :
    operator === "startsWith" ? { startsWith: value } :
    operator === "endsWith" ? { endsWith: value } :
    { contains: value };

  if (!relation) {
    return { [field!]: condition };
  }

  return {
    [relation]: {
      [field!]: condition
    }
  };
}

function buildDateFilter(
  field: string,
  operator: FilterOperator,
  value: string
) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;

  if (operator === "before") return { [field]: { lt: date } };
  if (operator === "after") return { [field]: { gt: date } };
  return { [field]: { equals: date } };
}

function buildDateRelationFilter(
  relation: "user" | "line",
  field: string,
  operator: FilterOperator,
  value: string
) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;

  const condition =
    operator === "before" ? { lt: date } :
    operator === "after" ? { gt: date } :
    { equals: date };

  return {
    [relation]: {
      [field]: condition
    }
  };
}


/**
 * Build Prisma where input for UserPerLine
 */
function buildFilterCondition(
  filter: SearchFilter
): Prisma.UserPerLineWhereInput | null {
  const { column, operator, value } = filter;

  switch (column) {
    // =====================
    // ROOT FIELDS
    // =====================
    case "isActive":
      return { isActive: { equals: value === "true" } };

    case "createdAt":
      return buildDateFilter("createdAt", operator, value);

    case "lastLoginAt":
      return buildDateFilter("lastLoginAt", operator, value);

    // =====================
    // USER RELATION
    // =====================
    case "userName":
      return buildStringFilter("user", "name", operator, value);

    case "userNpk":
      return buildStringFilter("user", "npk", operator, value);

    case "userUid":
      return buildStringFilter(null, null, operator, value);

    case "lastLoginAt":
      return buildDateRelationFilter("user", "lastLoginAt", operator, value);

    // =====================
    // LINE RELATION
    // =====================
    case "lineName":
      return buildStringFilter("line", "name", operator, value);

    default:
      console.warn(`Unsupported filter column: ${column}`);
      return null;
  }
}

export const userPerLineRepository = {
  /**
   * Get all UserPerLine with pagination, searchFilters, lineId/plantId filter, and sorting
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    searchFilters?: SearchFilter[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    plantId?: string;
    lineId?: string;
  }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = (page - 1) * limit;

    const searchFilters = params?.searchFilters ?? [];
    const sortBy = params?.sortBy ?? "createdAt";
    const sortOrder = params?.sortOrder ?? "desc";

    let where: Prisma.UserPerLineWhereInput = {};

    // Apply lineId filter
    if (params?.lineId) {
      where.lineId = params.lineId;
    }

    // Apply plantId filter
    if (params?.plantId) {
        where.line = {
            ...(where.line as Prisma.LineWhereInput || {}), // pastikan tipe Prisma.LineWhereInput
            plant: {
            is: {
                id: params.plantId
            }
            }
        };
    }

    // Apply search filters
    if (searchFilters.length > 0) {
      const conditions = searchFilters
        .map(buildFilterCondition)
        .filter((c): c is Prisma.UserPerLineWhereInput => c !== null);

      if (conditions.length > 0) {
        where = { AND: [where, ...conditions] };
      }
    }

    // Build orderBy
    let orderBy: Prisma.UserPerLineOrderByWithRelationInput[] = [
      { createdAt: "desc" }, // default
    ];

    if (params?.sortBy && params?.sortOrder) {
      switch (params.sortBy) {
        case "createdAt":
        case "updatedAt":
          orderBy = [{ [params.sortBy]: params.sortOrder }];
          break;

        case "userNpk":
          orderBy = [{user: {npk : params.sortOrder} }];
          break;

        case "isActive":
          orderBy = [{ [params.sortBy]: params.sortOrder }];
          break;

        case "userName":
          orderBy = [{ user: { name: params.sortOrder } }];
          break;

        case "lineName":
          orderBy = [{ line: { name: params.sortOrder } }];
          break;

        case "lastLoginAt":
          orderBy = [{ user: { lastLoginAt: params.sortOrder } }];
          break;

        default:
          // fallback default order
          break;
      }
    }

    const [data, total] = await Promise.all([
      db.userPerLine.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { user: true, line: true },
      }),
      db.userPerLine.count({ where }),
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
  },

  async getById(id: string) {
    return db.userPerLine.findUnique({
      where: { id },
      include: { user: true, line: true },
    });
  },

  async create(input: { userId: string; userUid: string; lineId: string; isActive: boolean }) {
    return db.userPerLine.create({
      data: {
        uid: input.userUid,
        isActive: input.isActive,
        user: { connect: { id: input.userId } },
        line: { connect: { id: input.lineId } },
      },
      include: { user: true, line: true },
    });
  },

  async update(
    id: string,
    input: { userId: string; userUid: string; lineId: string; isActive: boolean }
  ) {
    return db.userPerLine.update({
      where: { id },
      data: {
        uid: input.userUid,
        isActive: input.isActive,
        user: { connect: { id: input.userId } },
        line: { connect: { id: input.lineId } },
      },
      include: { user: true, line: true },
    });
  },

  async delete(id: string) {
    return db.userPerLine.delete({
      where: { id },
    });
  },

  async toggleActive(id: string) {
    const record = await db.userPerLine.findUnique({
      where: { id },
      select: { isActive: true },
    });
    if (!record) throw new Error("Record not found");

    return db.userPerLine.update({
      where: { id },
      data: { isActive: !record.isActive },
      include: { user: true, line: true },
    });
  },

  async userExist(userId: string, excludeId?: string) {
    return db.userPerLine.findFirst({
      where: {
        userId,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
  },
};
