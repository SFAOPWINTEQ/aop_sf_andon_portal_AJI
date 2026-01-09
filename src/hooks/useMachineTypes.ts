"use client";

import useSWR from "swr";
import { getMachineTypes } from "@/server/machineTypeService";
import type { SearchFilter } from "@/components/ui/multi-column-search";

export type MachineType = {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
};

interface UseMachineTypesParams {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseMachineTypesReturn {
  machineTypes: MachineType[];
  pagination?: Pagination;
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
}

export function useMachineTypes(
  params: UseMachineTypesParams = {},
): UseMachineTypesReturn {
  const {
    page = 1,
    limit = 10,
    searchFilters = [],
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const filtersKey = JSON.stringify(searchFilters);
  const key = `/api/machine-types?page=${page}&limit=${limit}&filters=${filtersKey}&sortBy=${sortBy}&sortOrder=${sortOrder}`;

  const { data, error, isLoading, mutate } = useSWR(key, async () => {
    const result = await getMachineTypes({
      page,
      limit,
      searchFilters,
      sortBy,
      sortOrder,
    });

    if (!result.success) {
      throw new Error(result.message || "Failed to fetch machine types");
    }

    return result;
  });

  return {
    machineTypes: data?.machineTypes ?? [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate,
  };
}
