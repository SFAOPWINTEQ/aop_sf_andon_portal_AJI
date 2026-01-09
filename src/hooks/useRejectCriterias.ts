"use client";

import useSWR from "swr";
import { getRejectCriterias } from "@/server/rejectCriteriaService";
import type { RejectCriteria } from "@/components/reject-criteria/reject-criteria-columns";
import type { SearchFilter } from "@/components/ui/multi-column-search";

interface UseRejectCriteriasParams {
  page?: number;
  limit?: number;
  search?: string;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  lineId?: string;
  category?: string;
  plantId?: string;
}

interface UseRejectCriteriasReturn {
  rejectCriterias: RejectCriteria[];
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

export function useRejectCriterias(
  params: UseRejectCriteriasParams = {},
): UseRejectCriteriasReturn {
  const {
    page = 1,
    limit = 10,
    search = "",
    searchFilters = [],
    sortBy = "category",
    sortOrder = "asc",
    lineId,
    category,
    plantId,
  } = params;

  // Create a unique key for SWR based on all parameters
  const filtersKey = JSON.stringify(searchFilters);
  const key = `/api/reject-criterias?page=${page}&limit=${limit}&search=${search}&filters=${filtersKey}&sortBy=${sortBy}&sortOrder=${sortOrder}&lineId=${lineId || ""}&category=${category || ""}&plantId=${plantId || ""}`;

  const { data, error, mutate, isLoading } = useSWR(
    key,
    async () => {
      const result = await getRejectCriterias({
        page,
        limit,
        searchFilters, // Pass the full SearchFilter objects with operator and type
        sortBy,
        sortOrder,
        lineId,
        category,
        plantId,
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch reject criterias");
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
    rejectCriterias: data?.rejectCriterias || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate,
  };
}
