import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { SearchFilter } from "@/components/ui/multi-column-search";
/* -------------------------------------------------------------------------- */
/*                               FILTER ENGINE                                */
/* -------------------------------------------------------------------------- */

function buildStringFilter(
  operator: SearchFilter["operator"],
  value: string,
): Prisma.StringFilter | null {
  switch (operator) {
    case "contains":
      return { contains: value };
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

export function buildMachineTypeParameterFilterCondition(
  filter: SearchFilter,
): Prisma.MachineTypeParameterWhereInput | null {
  const { column, value, operator } = filter;
  if (!value) return null;

  switch (column) {
    case "machineType": {
      const op = buildStringFilter(operator, value);
      return op
        ? {
            machineType: {
              name: op,
            },
          }
        : null;
    }

    case "parameter": {
      const op = buildStringFilter(operator, value);
      return op
        ? {
            parameter: {
              name: op,
            },
          }
        : null;
    }

    case "createdAt":
    case "updatedAt": {
      const op = buildDateFilter(operator, value);
      return op ? { [column]: op } : null;
    }

    default:
      console.warn(
        `Unsupported MachineTypeParameter filter column: ${column}`,
      );
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                REPOSITORY                                  */
/* -------------------------------------------------------------------------- */
export const machineTypeParameterRepository = {
  /* ------------------------------- GET ALL -------------------------------- */
  async getAll(params?: {
    page?: number;
    limit?: number;
    searchFilters?: SearchFilter[];

    /** SORTING */
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    machineTypeId?: string;
    parameterId?: string;
    })
    {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = (page - 1) * limit;
    const searchFilters = params?.searchFilters ?? [];

    let where: Prisma.MachineTypeParameterWhereInput = {
      deletedAt: null,
      machineType: { status: 1 },
      parameter: { status: 1 },
    };

    if (params?.machineTypeId) {
      where.machineTypeId = params.machineTypeId;
    }

    if (params?.parameterId) {
      where.parameterId = params.parameterId;
    }

    if (searchFilters.length > 0) {
      const filters = searchFilters
        .map(buildMachineTypeParameterFilterCondition)
        .filter(
          (f): f is Prisma.MachineTypeParameterWhereInput => f !== null,
        );

      if (filters.length > 0) {
        where = {
          AND: [where, ...filters],
        };
      }
    }

    const orderBy: Prisma.MachineTypeParameterOrderByWithRelationInput = {};

    if (params?.sortBy && params?.sortOrder) {
      const sortOrder = params.sortOrder;

      switch (params.sortBy) {
        case "machineType":
          orderBy.machineType = { name: sortOrder };
          break;

        case "parameter":
          orderBy.parameter = { name: sortOrder };
          break;

        case "createdAt":
        case "updatedAt":
          orderBy[params.sortBy] = sortOrder;
          break;

        default:
          // fallback ke createdAt
          orderBy.createdAt = "desc";
          break;
      }
    } else {
      orderBy.createdAt = "desc";
    }

    const [machineTypeParameters, total] = await Promise.all([
      db.machineTypeParameter.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          machineType: true,
          parameter: true,
        },
      }),
      db.machineTypeParameter.count({ where }),
    ]);

    return {
      machineTypeParameters,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /* -------------------------------- CREATE -------------------------------- */
  async create(data: {
    machineTypeId: string;
    parameterId: string;
  }) {
    return db.machineTypeParameter.create({
      data,
    });
  },

  /* -------------------------------- UPDATE -------------------------------- */
  async update(
    id: string,
    data: {
      machineTypeId?: string;
      parameterId?: string;
    },
  ) {
    return db.machineTypeParameter.update({
      where: { id },
      data,
    });
  },

  /* ------------------------------ SOFT DELETE ------------------------------ */
  async delete(id: string) {
    return db.machineTypeParameter.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  },
  async dataExist(machineTypeId: string, parameterId: string, excludeId?: string) {
      return db.machineTypeParameter.findFirst({
        where: {
          machineTypeId,
          parameterId,
          deletedAt: null, // 🔥 PENTING
          ...(excludeId && { id: { not: excludeId } }),
        },
      });
    },
};