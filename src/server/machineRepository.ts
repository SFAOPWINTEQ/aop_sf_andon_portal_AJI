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

export function buildMachineFilterCondition(
  filter: SearchFilter,
): Prisma.MachineWhereInput | null {
  const { column, value, type, operator } = filter;
  if (!value) return null;

  switch (column) {
    case "sequence": {
      const op = buildNumberFilter(operator, value);
      return op ? { sequence: op } : null;
    }

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

    case "name": {
      const op = buildStringFilter(operator, value);
      return op
        ? {
            name: op,
          }
        : null;
    }

    case "line": {
      const op = buildStringFilter(operator, value);
      return op
        ? {
            line: {
              name: op,
            },
          }
        : null;
    }

    case "plant": {
      const op = buildStringFilter(operator, value);
      return op
        ? {
            line: {
              plant: {
                name: op,
              },
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
      console.warn(`Unsupported Machine filter column: ${column}`);
      return null;
  }
}


/* -------------------------------------------------------------------------- */
/*                                REPOSITORY                                  */
/* -------------------------------------------------------------------------- */
export const machineRepository = {
  /* ------------------------------- GET ALL -------------------------------- */
  async getAll(params?: {
    page?: number;
    limit?: number;
    searchFilters?: SearchFilter[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    lineId?: string;
    plantId?: string;
    machineTypeId?: string;
  }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = (page - 1) * limit;
    const searchFilters = params?.searchFilters ?? [];

    // BASE CONDITION
    let where: Prisma.MachineWhereInput = {
      deletedAt: null,
    };

    // APPLY FILTER ENGINE
    if (searchFilters.length > 0) {
      const filters = searchFilters
        .map(buildMachineFilterCondition)
        .filter((f): f is Prisma.MachineWhereInput => f !== null);

      if (filters.length > 0) {
        where = {
          AND: [{ deletedAt: null }, ...filters],
        };
      }
    }

     const { lineId, plantId, machineTypeId } = params ?? {};

    /* ---------------------------------------------------------------------- */
    /* FILTER BY LINE                                                          */
    /* ---------------------------------------------------------------------- */
    if (lineId) {
      where.lineId = lineId;
    }

    /* ---------------------------------------------------------------------- */
    /* FILTER BY PLANT (VIA LINE RELATION)                                     */
    /* ---------------------------------------------------------------------- */
    if (plantId) {
      where.line = {
        plantId,
      };
    }

    /* ---------------------------------------------------------------------- */
    /* FILTER BY MACHINE TYPE                                                 */
    /* ---------------------------------------------------------------------- */
    if (machineTypeId) {
      where.machineTypeId = machineTypeId;
    }

    /* ---------------------------------------------------------------------- */
    /* SEARCH FILTER ENGINE                                                    */
    /* ---------------------------------------------------------------------- */
    if (searchFilters.length > 0) {
      const filters = searchFilters
        .map(buildMachineFilterCondition)
        .filter((f): f is Prisma.MachineWhereInput => f !== null);

      if (filters.length > 0) {
        where = {
          AND: [where, ...filters],
        };
      }
    }

    // Default order
    let orderBy: Prisma.MachineOrderByWithRelationInput[] = [
      { sequence: "asc" },
      { line: { plant: { name: "asc" } } },
      { line: { name: "asc" } },
    ];

    // Override jika ada sortBy & sortOrder
    if (params?.sortBy && params?.sortOrder) {
      const sortOrder = params.sortOrder;

      switch (params.sortBy) {
        case "sequence":
          orderBy = [{ sequence: sortOrder }];
          break;

        case "name":
          orderBy = [{ name: sortOrder }];
          break;

        case "plant":
          orderBy = [{ line: {plant: { name : sortOrder}} }];
          break;

        case "line":
          orderBy = [{ line: { name: sortOrder } }];
          break;

        case "createdAt":
        case "updatedAt":
          orderBy = [{ [params.sortBy]: sortOrder }];
          break;

        default:
          // fallback ke default
          break;
      }
    }

    const [machines, total] = await Promise.all([
      db.machine.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          line: {
            include: {
              plant: {
                select: { id: true, name: true },
              },
            },
          },
          machineType: true,
        },
      }),
      db.machine.count({ where }),
    ]);

    return {
      machines,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /* --------------------------- CREATE (AUTO SEQ) --------------------------- */
  async create(data: {
    lineId: string;
    machineTypeId: string;
    name: string;
  }) {
    // AUTO SEQUENCE PER LINE
    const lastMachine = await db.machine.findFirst({
      where: {
        lineId: data.lineId,
        deletedAt: null,
      },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    });

    const nextSequence = lastMachine ? lastMachine.sequence + 1 : 1;

    return db.machine.create({
      data: {
        name: data.name,
        sequence: nextSequence,
        line: {
          connect: { id: data.lineId },
        },
        machineType: {
          connect: { id: data.machineTypeId },
        },
      },
    });
  },

  /* -------------------------------- UPDATE -------------------------------- */
  async update(
    id: string,
    data: {
      lineId?: string;
      machineTypeId?: string;
      name?: string;
    },
  ) {
    return db.machine.update({
      where: { id },
      data: {
        ...(data.lineId && {
          line: { connect: { id: data.lineId } },
        }),
        ...(data.machineTypeId && {
          machineType: { connect: { id: data.machineTypeId } },
        }),
        ...(data.name && {
          name: data.name 
        }),
      },
    });
  },

  /* ------------------------------ SOFT DELETE ------------------------------ */
  async delete(id: string) {
    return db.machine.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  },

  /* ------------------------------ GENERATE SEQUENCE ------------------------------ */
  async getNextSequenceByLine(lineId: string) {
  const lastMachine = await db.machine.findFirst({
    where: {
      lineId,
      deletedAt: null,
    },
    orderBy: {
      sequence: "desc",
    },
    select: {
      sequence: true,
    },
  });

  return (lastMachine?.sequence ?? 0) + 1;
}
};