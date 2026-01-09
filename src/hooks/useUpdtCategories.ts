"use client";

import useSWR from "swr";
import { getUpdtCategories } from "@/server/updtCategoryService";
import type { UpdtCategory } from "@/components/updt-categories/updt-category-columns";
import type { SearchFilter } from "@/components/ui/multi-column-search";

interface UseUpdtCategoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  department?: string;
  plantId?: string;
}

interface UseUpdtCategoriesReturn {
  updtCategories: UpdtCategory[];
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

export function useUpdtCategories(
  params: UseUpdtCategoriesParams = {},
): UseUpdtCategoriesReturn {
  const {
    page = 1,
    limit = 10,
    search = "",
    searchFilters = [],
    sortBy = "department",
    sortOrder = "asc",
    lineId,
    department,
    plantId,
  } = params;

  // Create a unique key for SWR based on all parameters
  const filtersKey = JSON.stringify(searchFilters);
  const key = `/api/updt-categories?page=${page}&limit=${limit}&search=${search}&filters=${filtersKey}&sortBy=${sortBy}&sortOrder=${sortOrder}&lineId=${lineId || ""}&department=${department || ""}&plantId=${plantId || ""}`;

  const { data, error, mutate, isLoading } = useSWR(
    key,
    async () => {
      const result = await getUpdtCategories({
        page,
        limit,
        searchFilters, // Pass the full SearchFilter objects with operator and type
        sortBy,
        sortOrder,
        lineId,
        department,
        plantId,
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch UPDT categories");
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
    updtCategories: data?.updtCategories || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate,
  };
}
