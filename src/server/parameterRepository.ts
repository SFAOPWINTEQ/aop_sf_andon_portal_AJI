import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { SearchFilter } from "@/server/lineRepository";

/* -------------------------------------------------------------------------- */
/*                               FILTER ENGINE                                */
/* -------------------------------------------------------------------------- */

function buildStringFilter(
  operator: SearchFilter["operator"],
  value: string,
): Prisma.StringFilter | null {
  switch (operator) {
    case "contains":
      return { contains: value};
    case "equals":
      return { equals: value };
    case "startsWith":
      return { startsWith: value };
    case "endsWith":
      return { endsWith: value };
    default:
      return null;
  }
}

function buildNumberFilter(
  operator: SearchFilter["operator"],
  value: string,
): Prisma.IntFilter | null {
  const num = Number(value);
  if (Number.isNaN(num)) return null;

  switch (operator) {
    case "equals":
      return { equals: num };
    case "gt":
      return { gt: num };
    case "gte":
      return { gte: num };
    case "lt":
      return { lt: num };
    case "lte":
      return { lte: num };
    default:
      return null;
  }
}

function buildDateFilter(
  operator: SearchFilter["operator"],
  value: string,
): Prisma.DateTimeFilter | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  switch (operator) {
    case "equals":
      return { equals: date };
    case "before":
      return { lt: date };
    case "after":
      return { gt: date };
    default:
      return null;
  }
}

export function buildParameterFilterCondition(
  filter: SearchFilter,
): Prisma.ParameterWhereInput | null {
  const { column, value, type, operator } = filter;
  if (!value) return null;

  switch (column) {
    case "name": {
      const op = buildStringFilter(operator, value);
      return op ? { name: op } : null;
    }

    case "unit": {
      const op = buildStringFilter(operator, value);
      return op ? { unit: op } : null;
    }

    case "opcTagName": {
      const op = buildStringFilter(operator, value);
      return op ? { opcTagName: op } : null;
    }

    case "createdAt":
    case "updatedAt": {
      const op = buildDateFilter(operator, value);
      return op ? { [column]: op } : null;
    }

    default:
      console.warn(`Unsupported Parameter filter column: ${column}`);
      return null;
  }
}


export const parameterRepository = {
    async getAll(params?: {
    page?: number;
    limit?: number;
    searchFilters?: SearchFilter[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = (page - 1) * limit;
    const searchFilters = params?.searchFilters ?? [];

    let where: Prisma.ParameterWhereInput = {
        status: 1,
    };

    if (searchFilters.length > 0) {
        const filters = searchFilters
        .map(buildParameterFilterCondition)
        .filter(Boolean) as Prisma.ParameterWhereInput[];

        if (filters.length > 0) {
        where = {
            AND: [{ status: 1 }, ...filters],
        };
        }
    }

    const [parameters, total] = await Promise.all([
        db.parameter.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
            [params?.sortBy ?? "createdAt"]: params?.sortOrder ?? "desc",
        },
        }),
        db.parameter.count({ where }),
    ]);

    return {
        parameters,
        pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        },
    };
    },


  async create(data: Prisma.ParameterCreateInput) {
    return db.parameter.create({ data });
  },

  async update(id: string, data: Prisma.ParameterUpdateInput) {
    return db.parameter.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    
    return db.parameter.update({
      where: { id },
      data: { status: 0 },
    });
  },

  async nameExists(name: string, excludeId?: string) {
    const found = await db.parameter.findFirst({
      where: {
        name,
        status: 1,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    });

    return !!found;
  },

  async opcTagExists(opcTagName: string, excludeId?: string) {
    const found = await db.parameter.findFirst({
      where: {
        opcTagName,
        status: 1,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    });

    return !!found;
  },
};