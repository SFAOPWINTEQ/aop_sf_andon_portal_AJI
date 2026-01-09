"use client";

import useSWR from "swr";
import { getPdtCategories } from "@/server/pdtCategoryService";
import type { PdtCategory } from "@/components/pdt-categories/pdt-category-columns";
import type { SearchFilter } from "@/components/ui/multi-column-search";

interface UsePdtCategoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface UsePdtCategoriesReturn {
  pdtCategories: PdtCategory[];
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

export function usePdtCategories(
  params: UsePdtCategoriesParams = {},
): UsePdtCategoriesReturn {
  const {
    page = 1,
    limit = 10,
    search = "",
    searchFilters = [],
    sortBy = "name",
    sortOrder = "asc",
  } = params;

  // Create a unique key for SWR based on all parameters
  const filtersKey = JSON.stringify(searchFilters);
  const key = `/api/pdt-categories?page=${page}&limit=${limit}&search=${search}&filters=${filtersKey}&sortBy=${sortBy}&sortOrder=${sortOrder}`;

  const { data, error, mutate, isLoading } = useSWR(
    key,
    async () => {
      const result = await getPdtCategories({
        page,
        limit,
        searchFilters, // Pass the full SearchFilter objects with operator and type
        sortBy,
        sortOrder,
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch PDT categories");
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
    pdtCategories: data?.pdtCategories || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate,
  };
}
