"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
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
import { createPlantSchema, type CreatePlantInput } from "@/server/plantModel";
import { createPlant, updatePlant } from "@/server/plantService";

interface PlantFormProps {
  initialData?: {
    id: string;
    name: string;
    subplant: string;
    isActive: boolean;
  };
  onSuccess?: () => void;
}

export function PlantForm({ initialData, onSuccess }: PlantFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initialData;

  const form = useForm<CreatePlantInput>({
    resolver: zodResolver(createPlantSchema),
    defaultValues: {
      name: initialData?.name || "",
      subplant: initialData?.subplant || "",
      isActive: initialData?.isActive ?? true,
    },
  });

  const onSubmit = (data: CreatePlantInput) => {
    startTransition(async () => {
      try {
        if (isEditing) {
          // For editing, only send changed fields
          const updateData: Record<string, unknown> = {};
          if (data.name !== initialData.name) updateData.name = data.name;
          if (data.subplant !== initialData.subplant)
            updateData.subplant = data.subplant;
          if (data.isActive !== initialData.isActive)
            updateData.isActive = data.isActive;

          const result = await updatePlant(initialData.id, updateData);
          if (result.success) {
            toast.success(result.message || "Plant updated successfully");
            form.reset();
            onSuccess?.();
          } else {
            toast.error(result.message || "Failed to update plant");
          }
        } else {
          const result = await createPlant(data);
          if (result.success) {
            toast.success(result.message || "Plant created successfully");
            form.reset();
            onSuccess?.();
          } else {
            toast.error(result.message || "Failed to create plant");
          }
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
                  <Input
                    placeholder="Plant A"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription>
                  The name of the plant (must be unique)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subplant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subplant</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Subplant 1"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription>
                  The subplant identifier or code
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
                  Inactive plants will not appear in production planning
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
            {isEditing ? "Update" : "Create"} Plant
          </Button>
        </div>
      </form>
    </Form>
  );
}
