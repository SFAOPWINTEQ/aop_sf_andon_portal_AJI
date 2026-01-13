"use server";

import { db } from "@/lib/db";

/**
 * Get unit tracking row data by unitId
 */
export async function getTrackingReport(params: {
  unitId?: string;
}) {
  try {
    const { unitId } = params;

    if (!unitId) {
      return {
        success: false,
        error: "unitId is required",
        data: [],
      };
    }

    const dataUnitTracking = await db.unitTracking.findMany({
      where: {
        unitId,
      },
      include: {
        part: {
          select: {
            partNo: true,
            name: true,
            line: {
              select: {
                name: true,
                plant: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        moveInTime: "asc",
      },
    });

    const dataUnitHistory = await db.unitHistory.findMany({
      where: {
        unitId,
      },
      include: {
        part: {
          select: {
            partNo: true,
            name: true,
            line: {
              select: {
                name: true,
                plant: {
                  select: { name: true },
                },
              },
            },
          },
        },
        machine: {
            select: {
                sequence: true,
                machineType: {
                    select: {
                        name: true,
                    }
                }
            }
        }
      },
      orderBy: {
        moveInTime: "asc",
      },
    });

    const dataUnitParameterResult = await db.unitParameterResult.findMany({
      where: {
        unitId,
      },
      include: {
        part: {
          select: {
            partNo: true,
            name: true,
            line: {
              select: {
                name: true,
                plant: {
                  select: { name: true },
                },
              },
            },
          },
        },
        machine: {
            select: {
                sequence: true,
                machineType: {
                    select: {
                        name: true,
                    }
                }
            }
        },
        parameter: {
            select: {
                name: true,
                unit: true,
            }
        }
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const rows = dataUnitTracking.map((tracking) => ({
      id: tracking.id,
      unitId: tracking.unitId,

      plantName: tracking.part.line.plant?.name ?? "N/A",
      lineName: tracking.part.line.name,

      partNo: tracking.part.partNo,
      partName: tracking.part.name,

      previousStation: tracking.previousStation,
      currentStation: tracking.currentStation,
      nextStation: tracking.nextStation,

      moveInTime: tracking.moveInTime,
      moveOutTime: tracking.moveOutTime,
    }));

    const rowUnitHistory = dataUnitHistory.map((history) => ({
      id: history.id,
      unitId: history.unitId,

      plantName: history.part.line.plant?.name ?? "N/A",
      lineName: history.part.line.name,

      partNo: history.part.partNo,
      partName: history.part.name,

      userNpk: history.operatorNpk,

      machineName: history.machine.machineType.name,
      sequence: history.machine.sequence.toString(),

      cycleTimeSec: history.cycleTimeSec,
      result: history.result,

      moveInTime: history.moveInTime,
      moveOutTime: history.moveOutTime,
    }));

    const rowUnitParameterResult = dataUnitParameterResult.map((parameterResult) => ({ 
        id: parameterResult.id,
        unitId: parameterResult.unitId,

        plantName: parameterResult.part.line.plant?.name ?? "N/A",
        lineName: parameterResult.part.line.name,

        partNo: parameterResult.part.partNo,
        partName: parameterResult.part.name,

        machineName: parameterResult.machine.machineType.name,
        sequence: parameterResult.machine.sequence.toString(),

        value: parameterResult.value,

        parameterName: parameterResult.parameter.name,
        parameterUnit: parameterResult.parameter.unit,
     }));

    return {
      success: true,
      data: rows,
      dataUnitHistory: rowUnitHistory,
      dataUnitParameterResult: rowUnitParameterResult
    };
  } catch (error) {
    console.error("[getTrackingReport] Error:", error);
    return {
      success: false,
      error: "Failed to fetch tracking data",
      data: [],
    };
  }
}