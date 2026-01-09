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
  createRejectCriteriaSchema,
  rejectCriteriaCategories,
  type CreateRejectCriteriaInput,
} from "@/server/rejectCriteriaModel";
import {
  createRejectCriteria,
  updateRejectCriteria,
} from "@/server/rejectCriteriaService";
import { getLines } from "@/server/lineService";
import { getPlants } from "@/server/plantService";

interface RejectCriteriaFormProps {
  initialData?: {
    id: string;
    lineId: string;
    category: string;
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

export function RejectCriteriaForm({
  initialData,
  onSuccess,
}: RejectCriteriaFormProps) {
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

  const form = useForm<CreateRejectCriteriaInput>({
    resolver: zodResolver(createRejectCriteriaSchema),
    defaultValues: {
      lineId: initialData?.lineId || "",
      category:
        initialData?.category &&
        rejectCriteriaCategories.includes(
          initialData.category as (typeof rejectCriteriaCategories)[number],
        )
          ? (initialData.category as (typeof rejectCriteriaCategories)[number])
          : undefined,
      name: initialData?.name || "",
    },
  });

  // Fetch plants on mount
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

          // If editing, infer plant from initial lineId
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

  const onSubmit = (data: CreateRejectCriteriaInput) => {
    startTransition(async () => {
      try {
        const result = isEditMode
          ? await updateRejectCriteria(initialData.id, data)
          : await createRejectCriteria(data);

        if (result.success) {
          toast.success(
            result.message ||
              `Reject criteria ${isEditMode ? "updated" : "created"} successfully`,
          );
          form.reset();
          onSuccess?.();
        } else {
          toast.error(result.message || "Failed to save reject criteria");
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error("An error occurred while saving the reject criteria");
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
                Select the production line for this reject criteria (filtered by
                plant)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category *</FormLabel>
              <FormControl>
                <Combobox
                  options={rejectCriteriaCategories.map((category) => ({
                    value: category,
                    label: category,
                  }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select a category"
                  searchPlaceholder="Search categories..."
                  emptyText="No categories found."
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Select the rejection category (NG Setting or NG Regular)
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
              <FormLabel>Reject Criteria Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Dent, Scratch, Crack, Discoloration"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Enter a descriptive name for this reject criteria
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{isEditMode ? "Update" : "Create"} Reject Criteria</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
