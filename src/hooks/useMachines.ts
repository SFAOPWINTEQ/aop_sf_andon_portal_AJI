"use client";

import useSWR from "swr";
import { getMachines } from "@/server/machineService";
import type { Machine } from "@/components/machines/machine-columns";
import type { SearchFilter } from "@/components/ui/multi-column-search";

interface UseMachinesParams {
  page?: number;
  limit?: number;
  search?: string;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  plantId?: string;
  machineTypeId?: string;
}

interface UseMachinesReturn {
  machines: Machine[];
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

export function useMachines(params: UseMachinesParams = {}): UseMachinesReturn {
  const {
    page = 1,
    limit = 10,
    search = "",
    searchFilters = [],
    sortBy = "createdAt",
    sortOrder = "desc",
    lineId,
    plantId,
    machineTypeId,
  } = params;

  // Create a unique key for SWR based on all parameters
  const filtersKey = JSON.stringify(searchFilters);
  const key = `/api/machines?page=${page}&limit=${limit}&search=${search}&filters=${filtersKey}&sortBy=${sortBy}&sortOrder=${sortOrder}&lineId=${lineId || ""}&plantId=${plantId || ""}&machineTypeId=${machineTypeId || ""}`;

  const { data, error, mutate, isLoading } = useSWR(
    key,
    async () => {
      const result = await getMachines({
        page,
        limit,
        search,
        searchFilters, // Pass the full SearchFilter objects with operator and type
        sortBy,
        sortOrder,
        lineId,
        plantId,
        machineTypeId
      });
      

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch machines");
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
    machines: data?.machines || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate,
  };
}
