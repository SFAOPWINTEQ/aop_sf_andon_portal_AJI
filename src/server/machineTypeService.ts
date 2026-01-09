"use server";

import { revalidatePath } from "next/cache";
import type { MachineType } from "@prisma/client";
import {
  createMachineTypeSchema,
  updateMachineTypeSchema,
  deleteMachineTypeSchema,
  type CreateMachineTypeInput,
  type UpdateMachineTypeInput,
  type MachineTypeResponse,
  type MachineTypesResponse,
} from "./machineTypeModel";
import { machineTypeRepository } from "./machineTypeRepository";
import type { SearchFilter } from "./lineRepository";

export async function getMachineTypes(params?: {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<{
  success: boolean;
  machineTypes: MachineType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}> {
  try {
    const result = await machineTypeRepository.getAll(params);
    return {
      success: true,
      machineTypes: result.machineTypes,
      pagination: result.pagination,
    };
  } catch {
    return {
        success: false,
        machineTypes: [],
        pagination: {
        page: 1,
        limit: params?.limit ?? 10,
        total: 0,
        totalPages: 0,
        },
        message: "Failed to fetch machine types",
    };
    }
}

export async function createMachineType(
  data: CreateMachineTypeInput,
): Promise<MachineTypeResponse> {
  const validation = createMachineTypeSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: validation.error.issues[0].message };
  }

  if (await machineTypeRepository.nameExists(validation.data.name)) {
    return { success: false, message: "Machine Type Name already exists!" };
  }

  if (await machineTypeRepository.codeExists(validation.data.code)) {
    return { success: false, message: "Machine Type Code already exists" };
  }

  const machineType = await machineTypeRepository.create(validation.data);
  revalidatePath("/machine-types");

  return {
    success: true,
    message: "Machine type created successfully",
    machineType,
  };
}

export async function updateMachineType(
  id: string,
  data: UpdateMachineTypeInput,
): Promise<MachineTypeResponse> {
  const validation = updateMachineTypeSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: validation.error.issues[0].message };
  }

  if (
    validation.data.code &&
    (await machineTypeRepository.codeExists(validation.data.code, id))
  ) {
    return { success: false, message: "Machine Type Code already exists!" };
  }

  if (
    validation.data.name &&
    (await machineTypeRepository.nameExists(validation.data.name, id))
  ) {
    return { success: false, message: "Machine Type Name already exists!" };
  }

  const machineType = await machineTypeRepository.update(id, validation.data);
  revalidatePath("/machine-types");

  return {
    success: true,
    message: "Machine type updated successfully",
    machineType,
  };
}

export async function deleteMachineType(
  id: string,
): Promise<MachineTypeResponse> {
  const validation = deleteMachineTypeSchema.safeParse({ id });
  if (!validation.success) {
    return { success: false, message: validation.error.issues[0].message };
  }

  await machineTypeRepository.delete(id);
  revalidatePath("/machine-types");

  return { success: true, message: "Machine type deleted successfully" };
}