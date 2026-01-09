"use server";

import { revalidatePath } from "next/cache";
import {
  createParameterSchema,
  updateParameterSchema,
  deleteParameterSchema,
} from "./parameterModel";
import { parameterRepository } from "./parameterRepository";

export async function getParameters(params?: {
  page?: number;
  limit?: number;
  searchFilters?: any[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<{
  success: boolean;
  parameters: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}> {
  try {
    const result = await parameterRepository.getAll(params);

    return {
      success: true,
      parameters: result.parameters,
      pagination: result.pagination,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      parameters: [],
      pagination: {
        page: 1,
        limit: params?.limit ?? 10,
        total: 0,
        totalPages: 0,
      },
      message: "Failed to fetch parameters", // 🔥
    };
  }
}


export async function createParameter(data: any) {
  const validation = createParameterSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: validation.error.issues[0].message };
  }

  if (await parameterRepository.nameExists(validation.data.name)) {
    return { success: false, message: "Parameter already exists" };
  }
  
  if (await parameterRepository.opcTagExists(validation.data.opcTagName)) {
    return { success: false, message: "OPC Tag Name already exists" };
  }

  const parameter = await parameterRepository.create(validation.data);
  revalidatePath("/master-data/parameters");

  return { success: true, message: "Parameter created successfully", parameter };
}

export async function updateParameter(id: string, data: any) {
  const validation = updateParameterSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: validation.error.issues[0].message };
  }

  if (
    validation.data.name &&
    (await parameterRepository.nameExists(validation.data.name, id))
  ) {
    return { success: false, message: "Parameter already exists!" };
  }

  if (
    validation.data.opcTagName &&
    (await parameterRepository.opcTagExists(validation.data.opcTagName, id))
  ) {
    return { success: false, message: "OPC Tag Name already exists!" };
  }

  const parameter = await parameterRepository.update(id, validation.data);
  revalidatePath("/master-data/parameters");

  return { success: true, message: "Parameter updated successfully", parameter };
}

export async function deleteParameter(id: string) {
  const validation = deleteParameterSchema.safeParse({ id });
  if (!validation.success) {
    return { success: false, message: "Invalid ID" };
  }

  await parameterRepository.delete(id);
  revalidatePath("/master-data/parameters");

  return { success: true , message: "Parameter type deleted successfully" };
}