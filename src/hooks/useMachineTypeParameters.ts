"use client";

import useSWR from "swr";
import { getMachineTypeParameters } from "@/server/machineTypeParameterService";
import type { MachineTypeParameter } from "@/components/machine-type-parameters/machine-type-parameters-columns";
import type { SearchFilter } from "@/components/ui/multi-column-search";

interface UseMachineTypeParametersParams {
  page?: number;
  limit?: number;
  search?: string;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  parameterId?: string;
  machineTypeId?: string;
}

interface UseMachineTypeParametersReturn {
  machineTypeParameters: MachineTypeParameter[];
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

export function useMachineTypeParameters(params: UseMachineTypeParametersParams = {}): UseMachineTypeParametersReturn {
  const {
    page = 1,
    limit = 10,
    search = "",
    searchFilters = [],
    sortBy = "createdAt",
    sortOrder = "desc",
    machineTypeId,
    parameterId
  } = params;

  // Create a unique key for SWR based on all parameters
  const filtersKey = JSON.stringify(searchFilters);
  const key = `/api/machine-type-parameters?page=${page}&limit=${limit}&search=${search}&filters=${filtersKey}&sortBy=${sortBy}&sortOrder=${sortOrder}&machineTypeId=${machineTypeId || ""}&parameterId=${parameterId || ""}`;

  const { data, error, mutate, isLoading } = useSWR(
    key,
    async () => {
      const result = await getMachineTypeParameters({
        page,
        limit,
        search,
        searchFilters, // Pass the full SearchFilter objects with operator and type
        sortBy,
        sortOrder,
        parameterId,
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
    machineTypeParameters: data?.machineTypeParameters || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate,
  };
}