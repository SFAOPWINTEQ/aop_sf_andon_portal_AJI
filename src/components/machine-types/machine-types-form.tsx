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

import {
  createMachineTypeSchema,
  type CreateMachineTypeInput,
} from "@/server/machineTypeModel";
import {
  createMachineType,
  updateMachineType,
} from "@/server/machineTypeService";

interface MachineTypeFormProps {
  initialData?: {
    id: string;
    name: string;
    code: string;
  };
  onSuccess?: () => void;
}

export function MachineTypeForm({
  initialData,
  onSuccess,
}: MachineTypeFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initialData;

  const form = useForm<CreateMachineTypeInput>({
    resolver: zodResolver(createMachineTypeSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
    },
  });

  const onSubmit = (data: CreateMachineTypeInput) => {
    startTransition(async () => {
      try {
        let result: { success: boolean; message: string };

        if (isEditing) {
          const updateData: Record<string, unknown> = {};

          if (data.name !== initialData.name) updateData.name = data.name;
          if (data.code !== initialData.code) updateData.code = data.code;

          result = await updateMachineType(initialData.id, updateData);
        } else {
          result = await createMachineType(data);
        }

        if (result.success) {
          toast.success(result.message);
          form.reset();
          onSuccess?.();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error(error);
        toast.error("An error occurred. Please try again.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="CNC Machine"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription>
                  Machine type name (must be unique)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Code */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="CNC"
                    {...field}
                    disabled={isPending}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                  />
                </FormControl>
                <FormDescription>
                  Short unique code (uppercase, no spaces)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? "Update" : "Create"} Machine Type
          </Button>
        </div>
      </form>
    </Form>
  );
}