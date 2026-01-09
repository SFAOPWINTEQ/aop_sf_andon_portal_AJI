import useSWR from "swr";
import { getParameters } from "@/server/parameterService";
import type { SearchFilter } from "@/components/ui/multi-column-search";

export interface UseParametersParams {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useParameters(params: UseParametersParams) {
  const key = [
    "parameters",
    params.page,
    params.limit,
    JSON.stringify(params.searchFilters ?? []),
    params.sortBy,
    params.sortOrder,
  ];

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {
      const result = await getParameters({
        page: params.page,
        limit: params.limit,
        searchFilters: params.searchFilters,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch parameters");
      }

      return result;
    },
    {
      keepPreviousData: true,
    },
  );

  return {
    parameters: data?.parameters ?? [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate,
  };
}