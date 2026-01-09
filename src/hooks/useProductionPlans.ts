"use client";

import useSWR from "swr";
import { getProductionPlans } from "@/server/productionPlanService";
import type { SearchFilter } from "@/components/ui/multi-column-search";

export type ProductionPlan = {
  id: string;
  workOrderNo: string;
  planDate: Date;
  lineId: string;
  lineName?: string;
  plantName?: string;
  shiftId: string;
  shiftNumber?: number;
  partId: string;
  partNo?: string;
  partName?: string;
  cycleTimeSec: number;
  plannedQty: number;
  actualQty: number;
  ngQty: number;
  sequence: number;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  createdById: string | null;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
};

interface UseProductionPlansParams {
  page?: number;
  limit?: number;
  search?: string;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  plantId?: string;
  lineId?: string;
  shiftId?: string;
  partId?: string;
  status?: string;
  planDate?: Date;
}

interface UseProductionPlansReturn {
  productionPlans: ProductionPlan[];
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

export function useProductionPlans(
  params: UseProductionPlansParams = {},
): UseProductionPlansReturn {
  const {
    page = 1,
    limit = 10,
    search = "",
    searchFilters = [],
    sortBy = "planDate",
    sortOrder = "desc",
    plantId,
    lineId,
    shiftId,
    partId,
    status,
    planDate,
  } = params;

  // Create a unique key for SWR based on all parameters
  const filtersKey = JSON.stringify(searchFilters);
  const planDateKey = planDate ? planDate.toISOString() : "";
  const key = `/api/production-plans?page=${page}&limit=${limit}&search=${search}&filters=${filtersKey}&sortBy=${sortBy}&sortOrder=${sortOrder}&plantId=${plantId || ""}&lineId=${lineId || ""}&shiftId=${shiftId || ""}&partId=${partId || ""}&status=${status || ""}&planDate=${planDateKey}`;

  const { data, error, mutate, isLoading } = useSWR(
    key,
    async () => {
      const result = await getProductionPlans({
        page,
        limit,
        searchFilters,
        sortBy,
        sortOrder,
        plantId,
        lineId,
        shiftId,
        partId,
        status,
        planDate,
      });

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch production plans");
      }

      return result;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    },
  );

  return {
    productionPlans: data?.productionPlans || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    mutate,
  };
}
