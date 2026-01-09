"use client";

import useSWR from "swr";
import { getChildParts } from "@/server/childPartService";
import type { ChildPart } from "@/components/child-parts/child-part-columns";
import type { SearchFilter } from "@/components/ui/multi-column-search";

interface UseChildPartsParams {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  partId?: string;
  lineId?: string;
  plantId?: string;
}

interface UseChildPartsReturn {
  childParts: ChildPart[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
}

export function useChildParts(
  params: UseChildPartsParams = {},
): UseChildPartsReturn {
  const {
    page = 1,
    limit = 10,
    searchFilters = [],
    sortBy = "childPartNo",
    sortOrder = "asc",
    partId,
    lineId,
    plantId,
  } = params;

  /**
   * SWR key must include ALL params
   */
  const filtersKey = JSON.stringify(searchFilters);

  const key = `/api/child-parts?page=${page}&limit=${limit}&filters=${filtersKey}&sortBy=${sortBy}&sortOrder=${sortOrder}&partId=${partId || ""}&lineId=${lineId || ""}&plantId=${plantId || ""}`;

  const { data, error, mutate, isLoading } = useSWR(
    key,
    async () => {
      const result = await getChildParts({
        page,
        limit,
        searchFilters,
        sortBy,
        sortOrder,
        partId,
        lineId,
        plantId,
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch child parts");
      }

      /**
       * 🔥 Mapping ke ChildPart (UI shape)
       */
      return {
        childParts: result.childParts.map((cp) => ({
            id: cp.id,
            childPartNo: cp.childPartNo,
            childPartname: cp.childPartname,
            qtyLotSupply: cp.qtyLotSupply,

            partId: cp.partId,
            lineId: cp.lineId,
            lineName: cp.lineName,
            plantId: cp.plantId,

            partNo: cp.partNo ?? "-",
            partName: cp.partName ?? "-",
            partSku: cp.partSku ?? "-",

            createdAt: cp.createdAt,
            updatedAt: cp.updatedAt,
        })),
        pagination: result.pagination,
      };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    },
  );

  return {
    childParts: data?.childParts || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate,
  };
}