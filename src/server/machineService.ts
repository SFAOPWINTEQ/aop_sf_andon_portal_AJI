"use server";

import { machineRepository } from "@/server/machineRepository";
import type {
  CreateMachineInput,
  UpdateMachineInput,
} from "@/server/machineModel";

interface GetMachinesParams {
  page?: number;
  limit?: number;
  search?: string;
  searchFilters?: any[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  plantId?: string;
  machineTypeId?: string;
}

export async function getMachines(params: GetMachinesParams) {
  try {
    const result = await machineRepository.getAll({
      page: params.page,
      limit: params.limit,
      searchFilters: params.searchFilters,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      lineId: params.lineId,
      plantId: params.plantId,
      machineTypeId: params.machineTypeId,
    });

    return {
      success: true,
      machines: result.machines,
      pagination: result.pagination,
    };
  } catch (error: any) {
    console.error("getMachines error:", error);

    return {
      success: false,
      message: error?.message ?? "Failed to fetch machines",
    };
  }
}


/* -------------------------------------------------------------------------- */
/*                                   CREATE                                   */
/* -------------------------------------------------------------------------- */
export async function createMachine(data: CreateMachineInput) {
  try {
    const machine = await machineRepository.create({
      lineId: data.lineId,
      machineTypeId: data.machineTypeId,
      name: data.name
    });

    return {
      success: true,
      message: "Machine created successfully",
      machine,
    };
  } catch (error: any) {
    console.error("createMachine error:", error);

    return {
      success: false,
      message: error?.message ?? "Failed to create machine",
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                        GET NEXT MACHINE SEQUENCE                            */
/* -------------------------------------------------------------------------- */
export async function getNextMachineSequence(lineId: string) {
  try {
    const sequence =
      await machineRepository.getNextSequenceByLine(lineId);

    return {
      success: true,
      sequence,
    };
  } catch (error) {
    console.error("getNextMachineSequence error:", error);

    return {
      success: false,
      message: "Failed to get next machine sequence",
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                                   UPDATE                                   */
/* -------------------------------------------------------------------------- */
export async function updateMachine(
  id: string,
  data: UpdateMachineInput,
) {
  try {
    const updateData: {
      lineId?: string;
      machineTypeId?: string;
      name?: string;
    } = {};

    if (data.lineId) updateData.lineId = data.lineId;
    if (data.name) updateData.name = data.name;
    if (data.machineTypeId)
      updateData.machineTypeId = data.machineTypeId;

    const machine = await machineRepository.update(
      id,
      updateData,
    );

    return {
      success: true,
      message: "Machine updated successfully",
      machine,
    };
  } catch (error: any) {
    console.error("updateMachine error:", error);

    return {
      success: false,
      message: error?.message ?? "Failed to update machine",
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                                   DELETE                                   */
/* -------------------------------------------------------------------------- */
export async function deleteMachine(id: string) {
  try {
    await machineRepository.delete(id);

    return {
      success: true,
      message: "Machine deleted successfully",
    };
  } catch (error: any) {
    console.error("deleteMachine error:", error);

    return {
      success: false,
      message: error?.message ?? "Failed to delete machine",
    };
  }
}