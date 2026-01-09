"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import {
  createUpdtCategorySchema,
  type CreateUpdtCategoryInput,
} from "@/server/updtCategoryModel";
import {
  createUpdtCategory,
  updateUpdtCategory,
} from "@/server/updtCategoryService";
import { getLines } from "@/server/lineService";
import { getPlants } from "@/server/plantService";

interface UpdtCategoryFormProps {
  initialData?: {
    id: string;
    department: string;
    lineId: string;
    name: string;
  };
  onSuccess?: () => void;
}

type PlantOption = { id: string; name: string };
type LineOption = {
  id: string;
  name: string;
  plantId: string;
  isActive: boolean;
};

export function UpdtCategoryForm({
  initialData,
  onSuccess,
}: UpdtCategoryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [plants, setPlants] = useState<PlantOption[]>([]);
  const [allLines, setAllLines] = useState<LineOption[]>([]);
  const [filteredLines, setFilteredLines] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoadingPlants, setIsLoadingPlants] = useState(true);
  const [isLoadingLines, setIsLoadingLines] = useState(true);
  const [selectedPlantId, setSelectedPlantId] = useState<string>("");

  const isEditMode = !!initialData;

  const form = useForm<CreateUpdtCategoryInput>({
    resolver: zodResolver(createUpdtCategorySchema),
    defaultValues: {
      department: initialData?.department || "",
      lineId: initialData?.lineId || "",
      name: initialData?.name || "",
    },
  });

  // Fetch plants for dropdown
  useEffect(() => {
    async function fetchPlants() {
      try {
        const result = await getPlants({
          page: 1,
          limit: 1000,
          sortBy: "name",
          sortOrder: "asc",
        });
        if (result.success && result.plants) {
          const activePlants = result.plants
            .filter((p) => p.isActive)
            .map((p) => ({ id: p.id, name: p.name }));
          setPlants(activePlants);
        }
      } catch (error) {
        console.error("Failed to fetch plants:", error);
        toast.error("Failed to load plants");
      } finally {
        setIsLoadingPlants(false);
      }
    }
    fetchPlants();
  }, []);

  // Fetch lines for dropdown
  useEffect(() => {
    async function fetchLines() {
      try {
        const result = await getLines({
          page: 1,
          limit: 1000,
          sortBy: "name",
          sortOrder: "asc",
        });
        if (result.success && result.lines) {
          const activeLines = result.lines
            .filter((line) => line.isActive)
            .map((line) => ({
              id: line.id,
              name: line.name,
              plantId: line.plantId,
              isActive: line.isActive,
            }));
          setAllLines(activeLines);

          if (initialData?.lineId) {
            const currentLine = activeLines.find(
              (l) => l.id === initialData.lineId,
            );
            if (currentLine) {
              setSelectedPlantId(currentLine.plantId);
              const linesForPlant = activeLines.filter(
                (l) => l.plantId === currentLine.plantId,
              );
              setFilteredLines(
                linesForPlant.map(({ id, name }) => ({ id, name })),
              );
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch lines:", error);
        toast.error("Failed to load lines");
      } finally {
        setIsLoadingLines(false);
      }
    }
    fetchLines();
  }, [initialData?.lineId]);

  const handlePlantChange = (plantId: string) => {
    setSelectedPlantId(plantId);
    const linesForPlant = allLines.filter((line) => line.plantId === plantId);
    setFilteredLines(linesForPlant.map(({ id, name }) => ({ id, name })));
    const currentLineId = form.getValues("lineId");
    if (currentLineId && !linesForPlant.find((l) => l.id === currentLineId)) {
      form.setValue("lineId", "");
    }
  };

  const onSubmit = (data: CreateUpdtCategoryInput) => {
    startTransition(async () => {
      try {
        const result = isEditMode
          ? await updateUpdtCategory(initialData.id, data)
          : await createUpdtCategory(data);

        if (result.success) {
          toast.success(
            result.message ||
              `UPDT category ${isEditMode ? "updated" : "created"} successfully`,
          );
          form.reset();
          onSuccess?.();
        } else {
          toast.error(result.message || "Failed to save UPDT category");
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error("An error occurred while saving the UPDT category");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Plant selection */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Plant *</div>
          <Combobox
            options={plants.map((plant) => ({
              value: plant.id,
              label: plant.name,
            }))}
            value={selectedPlantId}
            onValueChange={handlePlantChange}
            placeholder={
              isLoadingPlants ? "Loading plants..." : "Select a plant first"
            }
            searchPlaceholder="Search plants..."
            emptyText="No plants found."
            disabled={isLoadingPlants || isPending}
          />
          <p className="text-sm text-muted-foreground">
            Select the plant to filter available lines
          </p>
        </div>

        <FormField
          control={form.control}
          name="lineId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Production Line *</FormLabel>
              <FormControl>
                <Combobox
                  options={filteredLines.map((line) => ({
                    value: line.id,
                    label: line.name,
                  }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={
                    !selectedPlantId
                      ? "Select a plant first"
                      : isLoadingLines
                        ? "Loading lines..."
                        : "Select a line"
                  }
                  searchPlaceholder="Search lines..."
                  emptyText={
                    selectedPlantId
                      ? "No active lines available for this plant"
                      : "Please select a plant first"
                  }
                  disabled={isLoadingLines || isPending || !selectedPlantId}
                />
              </FormControl>
              <FormDescription>
                Select the production line for this UPDT category (filtered by
                plant)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department *</FormLabel>
              <FormControl>
                <Combobox
                  options={[
                    { value: "Maintenance", label: "Maintenance" },
                    { value: "Production", label: "Production" },
                    { value: "PPIC", label: "PPIC" },
                    { value: "Engineering", label: "Engineering" },
                    { value: "Dies & Tool", label: "Dies & Tool" },
                    { value: "Quality", label: "Quality" },
                  ]}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select a department"
                  searchPlaceholder="Search departments..."
                  emptyText="No department found."
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Select the department responsible for this category
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Machine Breakdown, Material Shortage"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Enter a descriptive name for this unplanned downtime category
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : isEditMode ? (
              "Update Category"
            ) : (
              "Create Category"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
