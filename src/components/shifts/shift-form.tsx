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
import { createShiftSchema, type CreateShiftInput } from "@/server/shiftModel";
import { createShift, updateShift } from "@/server/shiftService";
import { getLines } from "@/server/lineService";
import { getPlants } from "@/server/plantService";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ShiftFormProps {
  initialData?: {
    id: string;
    lineId: string;
    number: number;
    workStart: string;
    workEnd: string;
    break1Start?: string | null;
    break1End?: string | null;
    break2Start?: string | null;
    break2End?: string | null;
    break3Start?: string | null;
    break3End?: string | null;
  };
  onSuccess?: () => void;
}

export function ShiftForm({ initialData, onSuccess }: ShiftFormProps) {
  const [isPending, startTransition] = useTransition();
  type PlantOption = { id: string; name: string };
  type LineOption = { id: string; name: string; plantId: string };
  const [plants, setPlants] = useState<PlantOption[]>([]);
  const [allLines, setAllLines] = useState<LineOption[]>([]);
  const [filteredLines, setFilteredLines] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoadingPlants, setIsLoadingPlants] = useState(true);
  const [isLoadingLines, setIsLoadingLines] = useState(true);
  const [selectedPlantId, setSelectedPlantId] = useState<string>("");
  const [showBreaks, setShowBreaks] = useState(
    !!(
      initialData?.break1Start ||
      initialData?.break2Start ||
      initialData?.break3Start
    ),
  );
  const isEditing = !!initialData;

  const form = useForm<CreateShiftInput>({
    resolver: zodResolver(createShiftSchema),
    defaultValues: {
      lineId: initialData?.lineId || "",
      number: initialData?.number || 1,
      workStart: initialData?.workStart || "",
      workEnd: initialData?.workEnd || "",
      break1Start: initialData?.break1Start || undefined,
      break1End: initialData?.break1End || undefined,
      break2Start: initialData?.break2Start || undefined,
      break2End: initialData?.break2End || undefined,
      break3Start: initialData?.break3Start || undefined,
      break3End: initialData?.break3End || undefined,
    },
  });

  // Fetch plants on component mount
  useEffect(() => {
    async function fetchPlants() {
      try {
        const result = await getPlants({
          page: 1,
          limit: 1000, // Get all active plants
          sortBy: "name",
          sortOrder: "asc",
        });

        if (result.success && result.plants) {
          const activePlants: PlantOption[] = result.plants
            .filter((plant) => plant.isActive)
            .map((plant) => ({ id: plant.id, name: plant.name }));
          setPlants(activePlants);
        } else {
          toast.error("Failed to load plants");
        }
      } catch (error) {
        console.error("Error fetching plants:", error);
        toast.error("Failed to load plants");
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
          limit: 1000, // Get all active lines
          sortBy: "name",
          sortOrder: "asc",
        });

        if (result.success && result.lines) {
          const activeLines: LineOption[] = result.lines
            .filter((line) => line.isActive)
            .map((line) => ({
              id: line.id,
              name: line.name,
              plantId: line.plantId,
            }));
          setAllLines(activeLines);

          // If editing, infer plant from existing lineId
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
  }, [initialData?.lineId]);

  // Filter lines when plant is selected
  const handlePlantChange = (plantId: string) => {
    setSelectedPlantId(plantId);

    const linesForPlant = allLines.filter((line) => line.plantId === plantId);
    setFilteredLines(linesForPlant.map(({ id, name }) => ({ id, name })));

    const currentLineId = form.getValues("lineId");
    if (
      currentLineId &&
      !linesForPlant.find((line) => line.id === currentLineId)
    ) {
      form.setValue("lineId", "");
    }
  };

  const onSubmit = (data: CreateShiftInput) => {
    startTransition(async () => {
      try {
        let result: { success: boolean; message: string };

        if (isEditing) {
          // For editing, only send changed fields
          const updateData: Record<string, unknown> = {};
          if (data.lineId !== initialData.lineId)
            updateData.lineId = data.lineId;
          if (data.number !== initialData.number)
            updateData.number = data.number;
          if (data.workStart !== initialData.workStart)
            updateData.workStart = data.workStart;
          if (data.workEnd !== initialData.workEnd)
            updateData.workEnd = data.workEnd;
          if (data.break1Start !== initialData.break1Start)
            updateData.break1Start = data.break1Start;
          if (data.break1End !== initialData.break1End)
            updateData.break1End = data.break1End;
          if (data.break2Start !== initialData.break2Start)
            updateData.break2Start = data.break2Start;
          if (data.break2End !== initialData.break2End)
            updateData.break2End = data.break2End;
          if (data.break3Start !== initialData.break3Start)
            updateData.break3Start = data.break3Start;
          if (data.break3End !== initialData.break3End)
            updateData.break3End = data.break3End;

          result = await updateShift(initialData.id, updateData);
        } else {
          result = await createShift(data);
        }

        if (result.success) {
          toast.success(result.message);
          form.reset();
          onSuccess?.();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("An error occurred. Please try again.");
        console.error("Form submission error:", error);
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Plant Selection */}
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
            disabled={isPending || isLoadingPlants}
          />
          <p className="text-sm text-muted-foreground">
            Select the plant to filter available lines
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="lineId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Line</FormLabel>
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
                    disabled={isPending || isLoadingLines || !selectedPlantId}
                  />
                </FormControl>
                <FormDescription>
                  The production line for this shift (filtered by plant)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shift Number</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription>
                  Shift number (must be unique per line)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Work Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="workStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Start</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      placeholder="07:00"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>Start time (HH:mm)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workEnd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work End</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      placeholder="15:00"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormDescription>End time (HH:mm)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Collapsible open={showBreaks} onOpenChange={setShowBreaks}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="outline" className="w-full">
              {showBreaks ? "Hide" : "Add"} Break Times (Optional)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Break 1</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="break1Start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Break 1 Start</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          placeholder="10:00"
                          {...field}
                          value={field.value || ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="break1End"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Break 1 End</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          placeholder="10:15"
                          {...field}
                          value={field.value || ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Break 2</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="break2Start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Break 2 Start</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          placeholder="12:00"
                          {...field}
                          value={field.value || ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="break2End"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Break 2 End</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          placeholder="12:30"
                          {...field}
                          value={field.value || ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Break 3</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="break3Start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Break 3 Start</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          placeholder="14:00"
                          {...field}
                          value={field.value || ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="break3End"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Break 3 End</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          placeholder="14:15"
                          {...field}
                          value={field.value || ""}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isPending || isLoadingLines}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Create"} Shift
          </Button>
        </div>
      </form>
    </Form>
  );
}
