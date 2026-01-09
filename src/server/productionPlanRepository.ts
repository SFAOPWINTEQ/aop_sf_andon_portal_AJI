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
  | "after"
  | "between";

export interface SearchFilter {
  column: string;
  operator: FilterOperator;
  value: string;
  type: ColumnType;
}

/**
 * Build Prisma filter condition based on operator and type
 */
function buildFilterCondition(
  filter: SearchFilter,
): Prisma.ProductionPlanWhereInput | null {
  const { column, operator, value, type } = filter;

  // Validate column name to prevent injection
  const validColumns = [
    "workOrderNo",
    "planDate",
    "status",
    "sequence",
    "plannedQty",
    "actualQty",
    "ngQty",
    "cycleTimeSec",
    "createdAt",
    "updatedAt",
  ];
  if (!validColumns.includes(column)) {
    console.warn(`Invalid column name: ${column}`);
    return null;
  }

  const condition: Record<string, unknown> = {};

  try {
    switch (type) {
      case "string": {
        switch (operator) {
          case "equals":
            condition[column] = { equals: value };
            break;
          case "contains":
            condition[column] = { contains: value };
            break;
          case "startsWith":
            condition[column] = { startsWith: value };
            break;
          case "endsWith":
            condition[column] = { endsWith: value };
            break;
          default:
            return null;
        }
        break;
      }

      case "number": {
        const numValue = Number.parseFloat(value);
        if (Number.isNaN(numValue)) return null;

        switch (operator) {
          case "equals":
            condition[column] = { equals: numValue };
            break;
          case "gt":
            condition[column] = { gt: numValue };
            break;
          case "gte":
            condition[column] = { gte: numValue };
            break;
          case "lt":
            condition[column] = { lt: numValue };
            break;
          case "lte":
            condition[column] = { lte: numValue };
            break;
          default:
            return null;
        }
        break;
      }

      case "date": {
        const dateValue = new Date(value);
        if (Number.isNaN(dateValue.getTime())) return null;

        switch (operator) {
          case "equals": {
            // For date equality, match the entire day
            const startOfDay = new Date(dateValue);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(dateValue);
            endOfDay.setHours(23, 59, 59, 999);
            condition[column] = { gte: startOfDay, lte: endOfDay };
            break;
          }
          case "before":
          case "lt":
            condition[column] = { lt: dateValue };
            break;
          case "after":
          case "gt":
            condition[column] = { gt: dateValue };
            break;
          case "lte":
            condition[column] = { lte: dateValue };
            break;
          case "gte":
            condition[column] = { gte: dateValue };
            break;
          default:
            return null;
        }
        break;
      }

      case "boolean": {
        const boolValue = value.toLowerCase() === "true";
        condition[column] = { equals: boolValue };
        break;
      }

      default:
        return null;
    }

    return condition as Prisma.ProductionPlanWhereInput;
  } catch (error) {
    console.error("Error building filter condition:", error);
    return null;
  }
}

/**
 * Build where clause from search filters
 */
function buildWhereClause(
  searchFilters?: SearchFilter[],
  plantId?: string,
  lineId?: string,
  shiftId?: string,
  partId?: string,
  status?: string,
  planDate?: Date,
): Prisma.ProductionPlanWhereInput {
  const where: Prisma.ProductionPlanWhereInput = {};

  // Apply search filters
  if (searchFilters && searchFilters.length > 0) {
    const conditions = searchFilters
      .map((filter) => buildFilterCondition(filter))
      .filter((condition): condition is Prisma.ProductionPlanWhereInput =>
        Boolean(condition),
      );

    if (conditions.length > 0) {
      where.AND = conditions;
    }
  }

  // Apply additional filters
  if (lineId) {
    where.lineId = lineId;
  } else if (plantId) {
    // Filter by plant when no specific line is selected
    where.line = { plantId };
  }

  if (shiftId) {
    where.shiftId = shiftId;
  }

  if (partId) {
    where.partId = partId;
  }

  if (status) {
    where.status = status;
  }

  if (planDate) {
    // Match the entire day
    const startOfDay = new Date(planDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(planDate);
    endOfDay.setHours(23, 59, 59, 999);
    where.planDate = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  return where;
}

/**
 * Get all production plans with pagination, search, and sorting
 */
export async function getAll(params?: {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  plantId?: string;
  lineId?: string;
  shiftId?: string;
  partId?: string;
  status?: string;
  planDate?: Date;
}) {
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const skip = (page - 1) * limit;
  const sortBy = params?.sortBy || "planDate";
  const sortOrder = params?.sortOrder || "desc";

  const where = buildWhereClause(
    params?.searchFilters,
    params?.plantId,
    params?.lineId,
    params?.shiftId,
    params?.partId,
    params?.status,
    params?.planDate,
  );

  // Build orderBy clause
  let orderBy: Prisma.ProductionPlanOrderByWithRelationInput = {};

  // Check if sorting by relation field
  if (sortBy === "lineName") {
    orderBy = { line: { name: sortOrder } };
  } else if (sortBy === "shiftNumber") {
    orderBy = { shift: { number: sortOrder } };
  } else if (sortBy === "partNo") {
    orderBy = { part: { partNo: sortOrder } };
  } else if (sortBy === "partName") {
    orderBy = { part: { name: sortOrder } };
  } else {
    orderBy = { [sortBy]: sortOrder };
  }

  const [productionPlans, total] = await Promise.all([
    db.productionPlan.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        line: { select: { name: true, plant: { select: { name: true } } } },
        shift: { select: { number: true } },
        part: { select: { partNo: true, name: true } },
        createdBy: { select: { name: true } },
      },
    }),
    db.productionPlan.count({ where }),
  ]);

  return {
    productionPlans,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get all production plans for export (no pagination)
 */
export async function getAllForExport(params?: {
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  plantId?: string;
  lineId?: string;
  shiftId?: string;
  partId?: string;
  status?: string;
  planDate?: Date;
}) {
  const sortBy = params?.sortBy || "planDate";
  const sortOrder = params?.sortOrder || "desc";

  const where = buildWhereClause(
    params?.searchFilters,
    params?.plantId,
    params?.lineId,
    params?.shiftId,
    params?.partId,
    params?.status,
    params?.planDate,
  );

  // Build orderBy clause
  let orderBy: Prisma.ProductionPlanOrderByWithRelationInput = {};

  if (sortBy === "lineName") {
    orderBy = { line: { name: sortOrder } };
  } else if (sortBy === "shiftNumber") {
    orderBy = { shift: { number: sortOrder } };
  } else if (sortBy === "partNo") {
    orderBy = { part: { partNo: sortOrder } };
  } else if (sortBy === "partName") {
    orderBy = { part: { name: sortOrder } };
  } else {
    orderBy = { [sortBy]: sortOrder };
  }

  const productionPlans = await db.productionPlan.findMany({
    where,
    orderBy,
    include: {
      line: { select: { name: true, plant: { select: { name: true } } } },
      shift: { select: { number: true } },
      part: { select: { partNo: true, name: true } },
      createdBy: { select: { name: true } },
    },
  });

  return { productionPlans };
}

/**
 * Get production plan by ID
 */
export async function getById(id: string) {
  return await db.productionPlan.findUnique({
    where: { id },
    include: {
      line: { select: { name: true } },
      shift: { select: { number: true } },
      part: { select: { partNo: true, name: true } },
      createdBy: { select: { name: true } },
      productDetails: {
        orderBy: {
          sequenceNo: "asc",
        },
      },
    },
  });
}

/**
 * Create a new production plan
 */
export async function create(data: {
  workOrderNo: string;
  planDate: Date;
  lineId: string;
  shiftId: string;
  partId: string;
  cycleTimeSec: number;
  plannedQty: number;
  sequence?: number;
  status?: string;
  createdById?: string | null;
}) {
  return await db.productionPlan.create({
    data: {
      workOrderNo: data.workOrderNo,
      planDate: data.planDate,
      lineId: data.lineId,
      shiftId: data.shiftId,
      partId: data.partId,
      cycleTimeSec: data.cycleTimeSec,
      plannedQty: data.plannedQty,
      sequence: data.sequence || 1,
      status: data.status || "OPEN",
      createdById: data.createdById,
    },
    include: {
      line: { select: { name: true } },
      shift: { select: { number: true } },
      part: { select: { partNo: true, name: true } },
      createdBy: { select: { name: true } },
    },
  });
}

/**
 * Update a production plan
 */
export async function update(id: string, data: Record<string, unknown>) {
  return await db.productionPlan.update({
    where: { id },
    data,
    include: {
      line: { select: { name: true } },
      shift: { select: { number: true } },
      part: { select: { partNo: true, name: true } },
      createdBy: { select: { name: true } },
    },
  });
}

/**
 * Delete a production plan (soft delete)
 */
export async function remove(id: string) {
  // For production plans, we might want to actually delete them
  // or keep them for historical purposes
  return await db.productionPlan.delete({
    where: { id },
  });
}

/**
 * Check if work order number exists (for the same date, line, and shift)
 */
export async function workOrderExists(
  workOrderNo: string,
  planDate: Date,
  lineId: string,
  shiftId: string,
  excludeId?: string,
) {
  const startOfDay = new Date(planDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(planDate);
  endOfDay.setHours(23, 59, 59, 999);

  const where: Prisma.ProductionPlanWhereInput = {
    workOrderNo,
    planDate: {
      gte: startOfDay,
      lte: endOfDay,
    },
    lineId,
    shiftId,
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  const plan = await db.productionPlan.findFirst({ where });
  return !!plan;
}

/**
 * Check if sequence exists for a given date, line, and shift
 */
export async function sequenceExists(
  planDate: Date,
  lineId: string,
  shiftId: string,
  sequence: number,
  excludeId?: string,
) {
  const startOfDay = new Date(planDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(planDate);
  endOfDay.setHours(23, 59, 59, 999);

  const where: Prisma.ProductionPlanWhereInput = {
    planDate: {
      gte: startOfDay,
      lte: endOfDay,
    },
    lineId,
    shiftId,
    sequence,
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  const plan = await db.productionPlan.findFirst({ where });
  return !!plan;
}

/**
 * Get the production plan with the maximum sequence for a given date
 */
export async function getMaxSequenceForDate(startOfDay: Date, endOfDay: Date) {
  return await db.productionPlan.findFirst({
    where: {
      planDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: {
      sequence: "desc",
    },
    select: {
      sequence: true,
    },
  });
}

export async function getMaxSequenceForLineShift(
  startOfDay: Date,
  endOfDay: Date,
  lineId: string,
  shiftId: string,
) {
  return await db.productionPlan.findFirst({
    where: {
      planDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      lineId,
      shiftId,
    },
    orderBy: {
      sequence: "desc",
    },
    select: {
      sequence: true,
    },
  });
}

export async function getWorkOrdersForDate(startOfDay: Date, endOfDay: Date) {
  return await db.productionPlan.findMany({
    where: {
      planDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      workOrderNo: true,
    },
  });
}
