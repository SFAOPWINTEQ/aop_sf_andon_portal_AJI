"use client";

import useSWR from "swr";
import { getParts } from "@/server/partService";
import type { Part } from "@/components/parts/part-columns";
import type { SearchFilter } from "@/components/ui/multi-column-search";

interface UsePartsParams {
  page?: number;
  limit?: number;
  search?: string;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  plantId?: string;
}

interface UsePartsReturn {
  parts: Part[];
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

export function useParts(params: UsePartsParams = {}): UsePartsReturn {
  const {
    page = 1,
    limit = 10,
    search = "",
    searchFilters = [],
    sortBy = "partNo",
    sortOrder = "asc",
    lineId,
    plantId,
  } = params;

  // Create a unique key for SWR based on all parameters
  const filtersKey = JSON.stringify(searchFilters);
  const key = `/api/parts?page=${page}&limit=${limit}&search=${search}&filters=${filtersKey}&sortBy=${sortBy}&sortOrder=${sortOrder}&lineId=${lineId || ""}&plantId=${plantId || ""}`;

  const { data, error, mutate, isLoading } = useSWR(
    key,
    async () => {
      const result = await getParts({
        page,
        limit,
        searchFilters, // Pass the full SearchFilter objects with operator and type
        sortBy,
        sortOrder,
        lineId,
        plantId,
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch parts");
      }

      return result;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
    },
  );

  return {
    parts: data?.parts || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate,
  };
}
