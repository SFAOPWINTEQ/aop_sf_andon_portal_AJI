"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";

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
  createMachine,
  updateMachine,
  getNextMachineSequence,
} from "@/server/machineService";
import { getPlants } from "@/server/plantService";
import { getLines } from "@/server/lineService";
import { getMachineTypes } from "@/server/machineTypeService";

/* -------------------------------------------------------------------------- */
/*                                   Schema                                   */
/* -------------------------------------------------------------------------- */
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  plantId: z.string().min(1, "Plant is required"),
  lineId: z.string().min(1, "Line is required"),
  machineTypeId: z.string().min(1, "Machine type is required"),
  sequence: z.number().int().min(1),
});

type FormValues = z.infer<typeof formSchema>;

export type MachineFormInitialData = {
  id: string;
  name: string;
  lineId: string;
  machineTypeId: string;
  sequence: number;
  line?: {
    plantId: string;
  };
};


interface MachineFormProps {
  initialData?: MachineFormInitialData;
  onSuccess?: () => void;
}

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */
export function MachineForm({ initialData, onSuccess }: MachineFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initialData;

  const [plants, setPlants] = useState<Array<{ id: string; name: string }>>([]);
  const [lines, setLines] = useState<
    Array<{ id: string; name: string; plantId: string }>
  >([]);
  const [machineTypes, setMachineTypes] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [selectedPlantId, setSelectedPlantId] = useState<string>(
    initialData?.line?.plantId || "",
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plantId: initialData?.line?.plantId || "",
      name: initialData?.name?.toString() || "",
      lineId: initialData?.lineId || "",
      machineTypeId: initialData?.machineTypeId || "",
      sequence: initialData?.sequence || 1,
    },
  });

  /* -------------------------------------------------------------------------- */
  /*                              Fetch Master Data                             */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    async function fetchData() {
      try {
        const [plantRes, lineRes, machineTypeRes] = await Promise.all([
          getPlants({ page: 1, limit: 1000, sortBy: "name", sortOrder: "asc" }),
          getLines({ page: 1, limit: 1000, sortBy: "name", sortOrder: "asc" }),
          getMachineTypes({
            page: 1,
            limit: 1000,
            sortBy: "name",
            sortOrder: "asc",
          }),
        ]);

        if (plantRes.success && plantRes.plants) {
          setPlants(
            plantRes.plants
              .filter((p) => p.isActive)
              .map((p) => ({ id: p.id, name: p.name })),
          );
        }

        if (lineRes.success && lineRes.lines) {
          setLines(
            lineRes.lines
              .filter((l) => l.isActive)
              .map((l) => ({
                id: l.id,
                name: l.name,
                plantId: l.plantId,
              })),
          );
        }

        if (machineTypeRes.success && machineTypeRes.machineTypes) {
          setMachineTypes(
            machineTypeRes.machineTypes.map((m) => ({
              id: m.id,
              name: m.name,
            })),
          );
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load form data");
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                      Auto Generate Sequence (Create)                       */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (isEditing) return;

    const subscription = form.watch(async (value, { name }) => {
      if (name === "lineId" && value.lineId) {
        try {
          const result = await getNextMachineSequence(value.lineId);
          if (result.success && result.sequence) {
            form.setValue("sequence", result.sequence);
          }
        } catch (error) {
          console.error("Failed to fetch next sequence", error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, isEditing]);

  /* -------------------------------------------------------------------------- */
  /*                                  Submit                                    */
  /* -------------------------------------------------------------------------- */
  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        if (isEditing) {
          const updateData: Record<string, unknown> = {};

          if (data.lineId !== initialData!.lineId)
            updateData.lineId = data.lineId;

          if (data.machineTypeId !== initialData!.machineTypeId)
            updateData.machineTypeId = data.machineTypeId;

          if (data.name !== initialData!.name)
            updateData.name = data.name;

          const result = await updateMachine(initialData!.id, updateData);

          if (result.success) {
            toast.success(result.message);
            onSuccess?.();
          } else {
            toast.error(result.message);
          }
        } else {
          const result = await createMachine({
            lineId: data.lineId,
            name: data.name,
            machineTypeId: data.machineTypeId,
          });

          if (result.success) {
            toast.success(result.message);
            form.reset();
            onSuccess?.();
          } else {
            toast.error(result.message);
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("An error occurred. Please try again.");
      }
    });
  };

  const availableLines = lines.filter(
    (line) => line.plantId === selectedPlantId,
  );

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="plantId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plant</FormLabel>
              <FormControl>
                <Combobox
                  options={plants.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedPlantId(value);
                    form.setValue("lineId", "");
                  }}
                  placeholder={
                    isLoadingData ? "Loading plants..." : "Select a plant"
                  }
                  disabled={isPending || isLoadingData}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lineId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Line</FormLabel>
              <FormControl>
                <Combobox
                  options={availableLines.map((l) => ({
                    value: l.id,
                    label: l.name,
                  }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={
                    !selectedPlantId
                      ? "Select plant first"
                      : "Select a line"
                  }
                  disabled={isPending || !selectedPlantId}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Machine name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Input machine name"
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Input machine name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="machineTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Machine Type</FormLabel>
              <FormControl>
                <Combobox
                  options={machineTypes.map((m) => ({
                    value: m.id,
                    label: m.name,
                  }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select machine type"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sequence"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sequence</FormLabel>
              <FormControl>
                <Input type="number" {...field} disabled />
              </FormControl>
              <FormDescription>
                Auto-generated based on selected line
              </FormDescription>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending || isLoadingData}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Create"} Machine
          </Button>
        </div>
      </form>
    </Form>
  );
}