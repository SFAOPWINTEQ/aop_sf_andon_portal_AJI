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
import { createLineSchema, type CreateLineInput } from "@/server/lineModel";
import { createLine, updateLine } from "@/server/lineService";
import { getPlants } from "@/server/plantService";

interface LineFormProps {
  initialData?: {
    id: string;
    name: string;
    plantId: string;
    isActive: boolean;
  };
  onSuccess?: () => void;
}

export function LineForm({ initialData, onSuccess }: LineFormProps) {
  const [isPending, startTransition] = useTransition();
  const [plants, setPlants] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingPlants, setIsLoadingPlants] = useState(true);
  const isEditing = !!initialData;

  const form = useForm<CreateLineInput>({
    resolver: zodResolver(createLineSchema),
    defaultValues: {
      name: initialData?.name || "",
      plantId: initialData?.plantId || "",
      isActive: initialData?.isActive ?? true,
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
          // Filter only active plants
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

  const onSubmit = (data: CreateLineInput) => {
    startTransition(async () => {
      try {
        let result: { success: boolean; message: string };

        if (isEditing) {
          // For editing, only send changed fields
          const updateData: Record<string, unknown> = {};
          if (data.name !== initialData.name) updateData.name = data.name;
          if (data.plantId !== initialData.plantId)
            updateData.plantId = data.plantId;
          if (data.isActive !== initialData.isActive)
            updateData.isActive = data.isActive;

          result = await updateLine(initialData.id, updateData);
        } else {
          result = await createLine(data);
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Line A" {...field} disabled={isPending} />
                </FormControl>
                <FormDescription>
                  The name of the production line (must be unique)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="plantId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plant</FormLabel>
                <FormControl>
                  <Combobox
                    options={plants.map((plant) => ({
                      value: plant.id,
                      label: plant.name,
                    }))}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={
                      isLoadingPlants ? "Loading plants..." : "Select a plant"
                    }
                    searchPlaceholder="Search plants..."
                    emptyText="No plants found."
                    disabled={isPending || isLoadingPlants}
                  />
                </FormControl>
                <FormDescription>
                  The plant where this line is located
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Inactive lines will not appear in production planning
                </FormDescription>
              </div>
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Create"} Line
          </Button>
        </div>
      </form>
    </Form>
  );
}
