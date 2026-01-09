"use server";

import { revalidatePath } from "next/cache";
import * as childPartRepository from "./childPartRepository";
import {
  createChildPartSchema,
  updateChildPartSchema,
  deleteChildPartSchema,
  type CreateChildPartInput,
  type UpdateChildPartInput,
  type ChildPartsResponse,
  type ChildPartDetailResponse,
} from "./childPartModel";
import type { SearchFilter } from "@/components/ui/multi-column-search";

/**
 * Get paginated ChildParts
 */
export async function getChildParts(params?: {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  partId?: string;
  lineId?: string;
  plantId?: string;
}): Promise<ChildPartsResponse> {
  try {
    const result = await childPartRepository.getChildParts(params);

    return {
      success: true,
      childParts: result.data.map((cp) => ({
        id: cp.id,
        childPartNo: cp.childPartNo,
        childPartname: cp.childPartname,
        qtyLotSupply: cp.qtyLotSupply,

        partId: cp.partId,
        lineId: cp.part.lineId,
        plantId: cp.part.line.plantId,

        partNo: cp.part.partNo,
        partName: cp.part.name,
        partSku: cp.part.sku ?? "-",
        lineName: cp.part.line.name,

        createdAt: cp.createdAt,
        updatedAt: cp.updatedAt,
        deletedAt: cp.deletedAt,
      })),
      pagination: result.pagination,
    };
  } catch (error) {
    console.error("Error fetching child parts:", error);
    return {
      success: false,
      message: "Failed to fetch child parts",
      childParts: [],
    };
  }
}

/**
 * Get ChildPart by ID
 */
export async function getChildPartById(
  id: string,
): Promise<ChildPartDetailResponse> {
  try {
    const childPart = await childPartRepository.getChildPartById(id);

    if (!childPart) {
      return {
        success: false,
        message: "Child part not found",
      };
    }

    return {
      success: true,
      childPart: {
        id: childPart.id,
        childPartNo: childPart.childPartNo,
        childPartname: childPart.childPartname,
        qtyLotSupply: childPart.qtyLotSupply,

        partId: childPart.partId,
        lineId: childPart.part.line.id,
        plantId: childPart.part.line.plantId,

        partNo: childPart.part.partNo,
        partName: childPart.part.name,
        partSku: childPart.part.sku ?? "-",
        lineName: childPart.part.line.name,

        createdAt: childPart.createdAt,
        updatedAt: childPart.updatedAt,
        deletedAt: childPart.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error fetching child part:", error);
    return {
      success: false,
      message: "Failed to fetch child part",
    };
  }
}

/**
 * Create ChildPart
 */
export async function createChildPart(
  data: CreateChildPartInput,
): Promise<ChildPartDetailResponse> {
  try {
    const validation = createChildPartSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    // 1️⃣ Create (tanpa relasi)
    const created = await childPartRepository.createChildPart(
      validation.data,
    );

    // 2️⃣ Fetch ulang DENGAN relasi (INI KUNCI)
    const childPart = await childPartRepository.getChildPartById(created.id);

    if (!childPart || !childPart.part) {
      return {
        success: false,
        message: "Failed to load created child part",
      };
    }

    revalidatePath("/child-parts");

    // 3️⃣ Return SESUAI ChildPartResponse
    return {
      success: true,
      message: "Child part created successfully",
      childPart: {
        id: childPart.id,
        childPartNo: childPart.childPartNo,
        childPartname: childPart.childPartname,
        qtyLotSupply: childPart.qtyLotSupply,

        partId: childPart.partId,
        lineId: childPart.part.line.id,
        plantId: childPart.part.line.plantId,

        partNo: childPart.part.partNo,
        partName: childPart.part.name,
        lineName: childPart.part.line.name,

        createdAt: childPart.createdAt,
        updatedAt: childPart.updatedAt,
        deletedAt: childPart.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error creating child part:", error);
    return {
      success: false,
      message: "Failed to create child part",
    };
  }
}


/**
 * Update ChildPart
 */
export async function updateChildPart(
  id: string,
  data: UpdateChildPartInput,
): Promise<ChildPartDetailResponse> {
  try {
    const validation = updateChildPartSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    // 1️⃣ Update (tanpa relasi)
    await childPartRepository.updateChildPart(
      id,
      validation.data,
    );

    // 2️⃣ Fetch ulang DENGAN relasi
    const childPart = await childPartRepository.getChildPartById(id);

    if (!childPart || !childPart.part) {
      return {
        success: false,
        message: "Failed to load updated child part",
      };
    }

    revalidatePath("/child-parts");

    // 3️⃣ Return SESUAI ChildPartResponse
    return {
      success: true,
      message: "Child part updated successfully",
      childPart: {
        id: childPart.id,
        childPartNo: childPart.childPartNo,
        childPartname: childPart.childPartname,
        qtyLotSupply: childPart.qtyLotSupply,

        partId: childPart.partId,
        lineId: childPart.part.line.id,
        plantId: childPart.part.line.plantId,

        partNo: childPart.part.partNo,
        partName: childPart.part.name,
        lineName: childPart.part.line.name,

        createdAt: childPart.createdAt,
        updatedAt: childPart.updatedAt,
        deletedAt: childPart.deletedAt,
      },
    };
  } catch (error) {
    console.error("Error updating child part:", error);
    return {
      success: false,
      message: "Failed to update child part",
    };
  }
}


/**
 * Delete ChildPart (soft delete)
 */
export async function deleteChildPart(
  id: string,
): Promise<ChildPartDetailResponse> {
  try {
    const validation = deleteChildPartSchema.safeParse({ id });
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    await childPartRepository.deleteChildPart(id);

    revalidatePath("/child-parts");

    return {
      success: true,
      message: "Child part deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting child part:", error);
    return {
      success: false,
      message: "Failed to delete child part",
    };
  }
}
