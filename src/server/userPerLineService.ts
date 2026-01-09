"use server";

import { userPerLineRepository, type SearchFilter } from "@/server/userPerLineRepository";
import {
  createUserPerLineSchema,
  updateUserPerLineSchema,
  deleteUserPerLineSchema,
  type CreateUserPerLineInput,
  type UpdateUserPerLineInput,
  type UserPerLineResponse,
  type UserPerLinesResponse,
} from "@/server/userPerLineModel";
import { revalidatePath } from "next/cache";

/**
 * Get all UserPerLine records with pagination, search and sorting
 */
export async function getUserPerLines(params?: {
  page?: number;
  limit?: number;
  search?: string;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  plantId?: string;
  lineId?: string;
}): Promise<
  UserPerLinesResponse & {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
> {
  try {
    const result = await userPerLineRepository.getAll(params);

    return {
      success: true,
      usersPerLine: result.data.map((record) => ({
        id: record.id,
        userUid: record.uid,
        userId: record.userId,
        userName: record.user.name,
        userNpk: record.user.npk,
        userRole: record.user.role,
        lineId: record.lineId,
        lineName: record.line.name,
        isActive: record.isActive,
        createdAt: record.createdAt,
        lastLoginAt: record.user.lastLoginAt ?? null, 
        updatedAt: record.updatedAt,
        deletedAt: record.deletedAt,
      })),
      pagination: result.pagination,
    };
  } catch (error) {
    console.error("Error fetching UserPerLine:", error);
    return {
      success: false,
      message: "Failed to fetch UserPerLine records",
      usersPerLine: [],
    };
  }
}

/**
 * Get UserPerLine by ID
 */
export async function getUserPerLineById(id: string): Promise<UserPerLineResponse> {
  try {
    const record = await userPerLineRepository.getById(id);

    if (!record) {
      return { success: false, message: "Record not found" };
    }

    return {
      success: true,
      message: "Record retrieved successfully",
      userPerLine: {
        id: record.id,
        userUid: record.uid,
        userId: record.userId,
        userName: record.user.name,
        userNpk: record.user.npk,
        userRole: record.user.role,
        lineId: record.lineId,
        lineName: record.line.name,
        isActive: record.isActive,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        deletedAt: record.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error fetching UserPerLine by ID:", error);
    return { success: false, message: "Failed to fetch record" };
  }
}

/**
 * Create UserPerLine
 */
export async function createUserPerLine(
  data: CreateUserPerLineInput
): Promise<UserPerLineResponse> {
  try {
    const validation = createUserPerLineSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, message: validation.error.issues[0].message };
    }

    if (await userPerLineRepository.userExist(validation.data.userId)) {
        return { success: false, message: "User already exists" };
    }

    // Send directly to repository
    const record = await userPerLineRepository.create({
      userId: validation.data.userId,
      userUid: validation.data.userUid,
      lineId: validation.data.lineId,
      isActive: validation.data.isActive,
    });

    revalidatePath("/user-per-lines");

    return {
      success: true,
      message: "Record created successfully",
      userPerLine: {
        id: record.id,
        userId: record.userId,
        userUid: record.uid,
        userName: record.user.name,
        userNpk: record.user.npk,
        userRole: record.user.role,
        lineId: record.lineId,
        lineName: record.line.name,
        isActive: record.isActive,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        deletedAt: record.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error creating UserPerLine:", error);
    return { success: false, message: "Failed to create record" };
  }
}

/**
 * Update UserPerLine
 */
export async function updateUserPerLine(
  id: string,
  data: UpdateUserPerLineInput
): Promise<UserPerLineResponse> {
  try {
    const validation = updateUserPerLineSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, message: validation.error.issues[0].message };
    }

    if (
        validation.data.userId &&
        (await userPerLineRepository.userExist(validation.data.userId, id))
    ) {
        return { success: false, message: "User already exists!" };
    }

    const record = await userPerLineRepository.update(id, {
      userId: validation.data.userId!,
      userUid: validation.data.userUid!,
      lineId: validation.data.lineId!,
      isActive: validation.data.isActive,
    });

    revalidatePath("/user-per-lines");

    return {
      success: true,
      message: "Record updated successfully",
      userPerLine: {
        id: record.id,
        userId: record.userId,
        userUid: record.uid,
        userName: record.user.name,
        userNpk: record.user.npk,
        userRole: record.user.role,
        lineId: record.lineId,
        lineName: record.line.name,
        isActive: record.isActive,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        deletedAt: record.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error updating UserPerLine:", error);
    return { success: false, message: "Failed to update record" };
  }
}

/**
 * Delete UserPerLine
 */
export async function deleteUserPerLine(id: string): Promise<UserPerLineResponse> {
  try {
    const validation = deleteUserPerLineSchema.safeParse({ id });
    if (!validation.success) {
      return { success: false, message: validation.error.issues[0].message };
    }

    await userPerLineRepository.delete(id);
    revalidatePath("/user-per-lines");

    return { success: true, message: "Record deleted successfully" };
  } catch (error) {
    console.error("Error deleting UserPerLine:", error);
    return { success: false, message: "Failed to delete record" };
  }
}

/**
 * Toggle active status
 */
export async function toggleUserPerLineActive(id: string): Promise<UserPerLineResponse> {
  try {
    const record = await userPerLineRepository.toggleActive(id);
    revalidatePath("/user-per-lines");

    return {
      success: true,
      message: `Record ${record.isActive ? "activated" : "deactivated"} successfully`,
      userPerLine: {
        id: record.id,
        userUid: record.uid,
        userId: record.userId,
        userName: record.user.name,
        userNpk: record.user.npk,
        userRole: record.user.role,
        lineId: record.lineId,
        lineName: record.line.name,
        isActive: record.isActive,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        deletedAt: record.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error toggling UserPerLine active:", error);
    return { success: false, message: "Failed to toggle record status" };
  }
}

/**
 * Generate template for import (Excel)
 */
export async function getUserPerLineTemplateData() {
  try {
    return {
      success: true,
      templateData: [
        {
          userNpk: "12345",
          lineName: "Line A",
          isActive: "TRUE",
        },
      ],
      instructions: {
        title: "UserPerLine Import Instructions",
        description: "Use this template to import multiple UserPerLine records.",
        fields: [
          { field: "userNpk", description: "User NPK (must exist in Users table)", required: true },
          { field: "lineName", description: "Line name (must exist in Line table)", required: true },
          { field: "isActive", description: "Active status TRUE/FALSE", required: false },
        ],
      },
    };
  } catch (error) {
    console.error("Error generating template data:", error);
    return { success: false, message: "Failed to generate template data" };
  }
}