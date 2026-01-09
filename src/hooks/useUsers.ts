"use client";

import useSWR from "swr";
import { getUsers } from "@/server/userService";
import type { User } from "@/components/users/user-columns";
import type { SearchFilter } from "@/components/ui/multi-column-search";

interface UseUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface UseUsersReturn {
  users: User[];
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

export function useUsers(params: UseUsersParams = {}): UseUsersReturn {
  const {
    page = 1,
    limit = 10,
    search = "",
    searchFilters = [],
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  // Create a unique key for SWR based on all parameters
  const filtersKey = JSON.stringify(searchFilters);
  const key = `/api/users?page=${page}&limit=${limit}&search=${search}&filters=${filtersKey}&sortBy=${sortBy}&sortOrder=${sortOrder}`;

  const { data, error, mutate, isLoading } = useSWR(
    key,
    async () => {
      const result = await getUsers({
        page,
        limit,
        search,
        searchFilters, // Pass the full SearchFilter objects with operator and type
        sortBy,
        sortOrder,
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch users");
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
    users: data?.users || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate,
  };
}
