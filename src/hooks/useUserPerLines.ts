"use client";

import useSWR from "swr";
import { getUserPerLines } from "@/server/userPerLineService";
import type { UserPerLine } from "@/components/user-per-lines/user-per-lines-columns";
import type { SearchFilter } from "@/server/userPerLineRepository";

interface UseUserPerLinesParams {
  page?: number;
  limit?: number;
  search?: string;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  plantId?: string;
  lineId?: string;
}

interface UseUserPerLinesReturn {
  userPerLines: UserPerLine[];
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

export function useUserPerLines(
  params: UseUserPerLinesParams = {}
): UseUserPerLinesReturn {
  const {
    page = 1,
    limit = 10,
    search = "",
    searchFilters = [],
    sortBy = "createdAt",
    sortOrder = "desc",
    plantId,
    lineId
  } = params;

  // Build unique key for SWR cache
  const filtersKey = JSON.stringify(searchFilters);
  const key = `/api/user-per-lines?page=${page}&limit=${limit}&search=${search}&filters=${filtersKey}&sortBy=${sortBy}&sortOrder=${sortOrder}&plantId=${plantId}&lineId=${lineId}`;

  const { data, error, mutate, isLoading } = useSWR(
    key,
    async () => {
      const result = await getUserPerLines({
        page,
        limit,
        search,
        searchFilters,
        sortBy,
        sortOrder,
        plantId,
        lineId
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch UserPerLines");
      }

      // Map data to include all required fields for UserPerLine type
      return {
        ...result,
        usersPerLine: result.usersPerLine.map((item) => ({
          ...item,
          lastLoginAt: item.lastLoginAt ?? null, // ensure lastLoginAt exists
        })),
      };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    userPerLines: data?.usersPerLine || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate,
  };
}