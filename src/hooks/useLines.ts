"use client";

import useSWR from "swr";
import { getLines } from "@/server/lineService";
import type { Line } from "@/components/lines/line-columns";
import type { SearchFilter } from "@/components/ui/multi-column-search";

interface UseLinesParams {
  page?: number;
  limit?: number;
  search?: string;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  plantId?: string;
}

interface UseLinesReturn {
  lines: Line[];
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

export function useLines(params: UseLinesParams = {}): UseLinesReturn {
  const {
    page = 1,
    limit = 10,
    search = "",
    searchFilters = [],
    sortBy = "createdAt",
    sortOrder = "desc",
    plantId,
  } = params;

  // Create a unique key for SWR based on all parameters
  const filtersKey = JSON.stringify(searchFilters);
  const key = `/api/lines?page=${page}&limit=${limit}&search=${search}&filters=${filtersKey}&sortBy=${sortBy}&sortOrder=${sortOrder}&plantId=${plantId || ""}`;

  const { data, error, mutate, isLoading } = useSWR(
    key,
    async () => {
      const result = await getLines({
        page,
        limit,
        search,
        searchFilters, // Pass the full SearchFilter objects with operator and type
        sortBy,
        sortOrder,
        plantId,
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch lines");
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
    lines: data?.lines || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate,
  };
}
