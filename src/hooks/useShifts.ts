"use client";

import useSWR from "swr";
import { getShifts } from "@/server/shiftService";
import type { Shift } from "@/components/shifts/shift-columns";
import type { SearchFilter } from "@/components/ui/multi-column-search";

interface UseShiftsParams {
  page?: number;
  limit?: number;
  search?: string;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  plantId?: string;
}

interface UseShiftsReturn {
  shifts: Shift[];
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

export function useShifts(params: UseShiftsParams = {}): UseShiftsReturn {
  const {
    page = 1,
    limit = 10,
    search = "",
    searchFilters = [],
    sortBy = "number",
    sortOrder = "asc",
    lineId,
    plantId,
  } = params;

  // Create a unique key for SWR based on all parameters
  const filtersKey = JSON.stringify(searchFilters);
  const key = `/api/shifts?page=${page}&limit=${limit}&search=${search}&filters=${filtersKey}&sortBy=${sortBy}&sortOrder=${sortOrder}&lineId=${lineId || ""}&plantId=${plantId || ""}`;

  const { data, error, mutate, isLoading } = useSWR(
    key,
    async () => {
      const result = await getShifts({
        page,
        limit,
        search,
        searchFilters, // Pass the full SearchFilter objects with operator and type
        sortBy,
        sortOrder,
        lineId,
        plantId,
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch shifts");
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
    shifts: data?.shifts || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate,
  };
}
