"use client";

import useSWR from "swr";
import { getPlants } from "@/server/plantService";
import type { SearchFilter } from "@/server/plantRepository";

export type Plant = {
  id: string;
  name: string;
  subplant: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

interface UsePlantsParams {
  page?: number;
  limit?: number;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface UsePlantsReturn {
  plants: Plant[];
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

export function usePlants(params: UsePlantsParams = {}): UsePlantsReturn {
  const cacheKey = [
    "plants",
    params.page,
    params.limit,
    JSON.stringify(params.searchFilters),
    params.sortBy,
    params.sortOrder,
  ];

  const { data, error, mutate } = useSWR(cacheKey, async () => {
    const result = await getPlants(params);
    return result;
  });

  return {
    plants: data?.plants || [],
    pagination: data?.pagination,
    isLoading: !error && !data,
    isError: !!error,
    mutate,
  };
}
