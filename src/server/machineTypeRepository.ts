import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { SearchFilter } from "@/server/lineRepository"; // reuse filter engine

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

export function buildMachineTypeFilterCondition(
  filter: SearchFilter,
): Prisma.MachineTypeWhereInput | null {
  const { column, value, type, operator } = filter;
  if (!value) return null;

  switch (column) {
    case "name": {
      const op = buildStringFilter(operator, value);
      return op ? { name: op } : null;
    }

    case "code": {
      const op = buildStringFilter(operator, value);
      return op ? { code: op } : null;
    }

    case "createdAt":
    case "updatedAt": {
      const op = buildDateFilter(operator, value);
      return op ? { [column]: op } : null;
    }

    default:
      console.warn(`Unsupported Machine Type filter column: ${column}`);
      return null;
  }
}


export const machineTypeRepository = {
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

  // 🔥 BASE CONDITION (WAJIB)
  let where: Prisma.MachineTypeWhereInput = {
    status: 1,
  };

  // 🔥 APPLY FILTER ENGINE
  if (searchFilters.length > 0) {
    const filterConditions = searchFilters
      .map(buildMachineTypeFilterCondition)
      .filter(
        (f): f is Prisma.MachineTypeWhereInput => f !== null,
      );

    if (filterConditions.length > 0) {
      where = {
        AND: [{ status: 1 }, ...filterConditions],
      };
    }
  }

  console.log("MachineType filters:", searchFilters);
    console.log("MachineType where:", JSON.stringify(where, null, 2));


  const [machineTypes, total] = await Promise.all([
    db.machineType.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [params?.sortBy ?? "createdAt"]: params?.sortOrder ?? "desc",
      },
    }),
    db.machineType.count({ where }),
  ]);

  return {
    machineTypes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
},

  async create(data: Prisma.MachineTypeCreateInput) {
    return db.machineType.create({ data });
  },

  async update(id: string, data: Prisma.MachineTypeUpdateInput) {
    return db.machineType.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    // ❌ JANGAN delete()
    return db.machineType.update({
      where: { id },
      data: { status: 0 },
    });
  },

  async codeExists(code: string, excludeId?: string) {
    return db.machineType.findFirst({
      where: {
        code,
        status: 1, // 🔥 PENTING
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
  },

  async nameExists(name: string, excludeId?: string) {
    return db.machineType.findFirst({
      where: {
        name,
        status: 1, // 🔥 PENTING
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
  },
};