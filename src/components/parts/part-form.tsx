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
import { createPartSchema, type CreatePartInput } from "@/server/partModel";
import { createPart, updatePart } from "@/server/partService";
import { getLines } from "@/server/lineService";
import { getPlants } from "@/server/plantService";

interface PartFormProps {
  initialData?: {
    id: string;
    sku: string | null;
    partNo: string;
    name: string;
    lineId: string;
    qtyPerLot: number | null;
    cycleTimeSec: number | null;
    line?: {
      plantId: string;
    };
  };
  onSuccess?: () => void;
}

export function PartForm({ initialData, onSuccess }: PartFormProps) {
  const [isPending, startTransition] = useTransition();
  const [plants, setPlants] = useState<Array<{ id: string; name: string }>>([]);
  const [allLines, setAllLines] = useState<
    Array<{ id: string; name: string; plantId: string }>
  >([]);
  const [filteredLines, setFilteredLines] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoadingPlants, setIsLoadingPlants] = useState(true);
  const [isLoadingLines, setIsLoadingLines] = useState(true);
  const [selectedPlantId, setSelectedPlantId] = useState<string>(
    initialData?.line?.plantId || "",
  );

  const isEditMode = !!initialData;

  const form = useForm<CreatePartInput>({
    resolver: zodResolver(createPartSchema),
    defaultValues: {
      sku: initialData?.sku || "",
      partNo: initialData?.partNo || "",
      name: initialData?.name || "",
      lineId: initialData?.lineId || "",
      qtyPerLot: initialData?.qtyPerLot || undefined,
      cycleTimeSec: initialData?.cycleTimeSec || undefined,
    },
  });

  // Fetch plants on component mount
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
            .filter((plant) => plant.isActive)
            .map((plant) => ({
              id: plant.id,
              name: plant.name,
            }));
          setPlants(activePlants);
        } else {
          toast.error("Failed to load plants");
        }
      } catch (error) {
        console.error("Error fetching plants:", error);
        toast.error("Error loading plants");
      } finally {
        setIsLoadingPlants(false);
      }
    }

    fetchPlants();
  }, []);

  // Fetch all lines on component mount
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
            }));
          setAllLines(activeLines);

          // If editing, filter lines by initial plant
          const plantId = initialData?.line?.plantId;
          if (plantId) {
            const linesForPlant = activeLines.filter(
              (line) => line.plantId === plantId,
            );
            setFilteredLines(linesForPlant);
          }
        } else {
          toast.error("Failed to load lines");
        }
      } catch (error) {
        console.error("Error fetching lines:", error);
        toast.error("Failed to load lines");
      } finally {
        setIsLoadingLines(false);
      }
    }

    fetchLines();
  }, [initialData]);

  // Filter lines when plant is selected
  const handlePlantChange = (plantId: string) => {
    setSelectedPlantId(plantId);

    // Filter lines by selected plant
    const linesForPlant = allLines.filter((line) => line.plantId === plantId);
    setFilteredLines(linesForPlant);

    // Reset line field if it's not in the filtered list
    const currentLineId = form.getValues("lineId");
    if (currentLineId && !linesForPlant.find((l) => l.id === currentLineId)) {
      form.setValue("lineId", "");
    }
  };

  const onSubmit = (data: CreatePartInput) => {
    startTransition(async () => {
      try {
        // Convert empty string to null for optional fields
        const processedData = {
          ...data,
          sku: data.sku && data.sku.trim() !== "" ? data.sku : null,
          qtyPerLot: data.qtyPerLot || null,
          cycleTimeSec: data.cycleTimeSec || null,
        };

        const result = isEditMode
          ? await updatePart(initialData.id, processedData)
          : await createPart(processedData);

        if (result.success) {
          toast.success(
            result.message ||
              `Part ${isEditMode ? "updated" : "created"} successfully`,
          );
          form.reset();
          onSuccess?.();
        } else {
          toast.error(result.message || "Failed to save part");
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error("An error occurred while saving the part");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Plant Selection */}
        <FormItem>
          <FormLabel>Plant *</FormLabel>
          <FormControl>
            <Combobox
              options={plants.map((plant) => ({
                value: plant.id,
                label: plant.name,
              }))}
              value={selectedPlantId}
              onValueChange={handlePlantChange}
              placeholder={
                isLoadingPlants ? "Loading plants..." : "Select a plant"
              }
              searchPlaceholder="Search plant..."
              emptyText="No plant found"
              disabled={isPending || isLoadingPlants}
            />
          </FormControl>
          <FormDescription>
            Select the plant where this part is manufactured
          </FormDescription>
          {!selectedPlantId && (
            <p className="text-sm text-destructive">Plant is required</p>
          )}
        </FormItem>

        {/* Line Selection */}
        <FormField
          control={form.control}
          name="lineId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Line *</FormLabel>
              <FormControl>
                <Combobox
                  options={filteredLines.map((line) => ({
                    value: line.id,
                    label: line.name,
                  }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={
                    isLoadingLines
                      ? "Loading lines..."
                      : !selectedPlantId
                        ? "Select a plant first"
                        : "Select a line"
                  }
                  searchPlaceholder="Search line..."
                  emptyText={
                    selectedPlantId ? "No line found" : "Select a plant first"
                  }
                  disabled={isPending || isLoadingLines || !selectedPlantId}
                />
              </FormControl>
              <FormDescription>
                Select the production line for this part
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., SKU001"
                  {...field}
                  value={field.value || ""}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Stock Keeping Unit - optional unique identifier
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="partNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Part Number *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., PN-12345"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>Unique part number (required)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Part Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Engine Component A"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Descriptive name for the part (required)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="qtyPerLot"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity per Lot (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 100"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value ? parseInt(value) : undefined);
                  }}
                  disabled={isPending}
                  min={1}
                />
              </FormControl>
              <FormDescription>
                Standard quantity per production lot (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cycleTimeSec"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cycle Time (seconds) (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 60 or 45.5"
                  step="0.01"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value ? parseFloat(value) : undefined);
                  }}
                  disabled={isPending}
                  min={0.01}
                />
              </FormControl>
              <FormDescription>
                Standard cycle time in seconds for producing one unit (optional,
                supports decimals)
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
              "Update Part"
            ) : (
              "Create Part"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
