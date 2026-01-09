"use server";

import { machineTypeParameterRepository } from "@/server/machineTypeParameterRepository";

import {
  createMachineTypeParameterSchema,
  updateMachineTypeParameterSchema,
  deleteMachineTypeParameterSchema,
  type CreateMachineTypeParameterInput,
  type UpdateMachineTypeParameterInput,
  type MachineTypeParameterResponse,
  type MachinesTypeParameterResponse,
} from "./machineTypeParameterModel";

import type { SearchFilter } from "@/components/ui/multi-column-search";

/* -------------------------------------------------------------------------- */
/*                                   GET ALL                                  */
/* -------------------------------------------------------------------------- */
interface GetMachineTypeParametersParams {
  page?: number;
  limit?: number;
  search?: string;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  machineTypeId?: string;
  parameterId?: string;
}

export async function getMachineTypeParameters(
  params: GetMachineTypeParametersParams,
) {
  try {
    const result = await machineTypeParameterRepository.getAll({
      page: params.page,
      limit: params.limit,
      searchFilters: params.searchFilters,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      machineTypeId: params.machineTypeId,
      parameterId: params.parameterId,
    });

    return {
      success: true,
      machineTypeParameters: result.machineTypeParameters,
      pagination: result.pagination,
    };
  } catch (error: any) {
    console.error("getMachineTypeParameters error:", error);

    return {
      success: false,
      message:
        error?.message ?? "Failed to fetch machine type parameters",
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                                   CREATE                                   */
/* -------------------------------------------------------------------------- */
export async function createMachineTypeParameter(
  data: CreateMachineTypeParameterInput,
) {
  try {
    const validation = createMachineTypeParameterSchema.safeParse(data);
    if (!validation.success) {
    return { success: false, message: validation.error.issues[0].message };
    }

    if (await machineTypeParameterRepository.dataExist(validation.data.machineTypeId, validation.data.parameterId)) {
    return { success: false, message: "Machine Type Parameter already exists!" };
    }

    const machineTypeParameter =
      await machineTypeParameterRepository.create({
        parameterId: data.parameterId,
        machineTypeId: data.machineTypeId,
      });

    return {
      success: true,
      message: "Machine type parameter created successfully",
      machineTypeParameter,
    };
  } catch (error: any) {
    console.error("createMachineTypeParameter error:", error);

    return {
      success: false,
      message:
        error?.message ??
        "Failed to create machine type parameter",
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                                   UPDATE                                   */
/* -------------------------------------------------------------------------- */
export async function updateMachineTypeParameter(
  id: string,
  data: UpdateMachineTypeParameterInput,
) {
  try {
    const updateData: {
      parameterId?: string;
      machineTypeId?: string;
    } = {};

    if (data.parameterId) {
      updateData.parameterId = data.parameterId;
    }

    if (data.machineTypeId) {
      updateData.machineTypeId = data.machineTypeId;
    }

    const machineTypeParameter =
      await machineTypeParameterRepository.update(
        id,
        updateData,
      );

    return {
      success: true,
      message: "Machine type parameter updated successfully",
      machineTypeParameter,
    };
  } catch (error: any) {
    console.error("updateMachineTypeParameter error:", error);

    return {
      success: false,
      message:
        error?.message ??
        "Failed to update machine type parameter",
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                                   DELETE                                   */
/* -------------------------------------------------------------------------- */
export async function deleteMachineTypeParameter(id: string) {
  try {
    await machineTypeParameterRepository.delete(id);

    return {
      success: true,
      message: "Machine type parameter deleted successfully",
    };
  } catch (error: any) {
    console.error("deleteMachineTypeParameter error:", error);

    return {
      success: false,
      message:
        error?.message ??
        "Failed to delete machine type parameter",
    };
  }
}