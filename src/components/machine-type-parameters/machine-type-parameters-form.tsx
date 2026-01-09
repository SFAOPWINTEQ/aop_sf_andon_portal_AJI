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
import { getParameters } from "@/server/parameterService";
import { createMachineTypeParameter, updateMachineTypeParameter } from "@/server/machineTypeParameterService";

/* -------------------------------------------------------------------------- */
/*                                   Schema                                   */
/* -------------------------------------------------------------------------- */
const formSchema = z.object({
  parameterId: z.string().min(1, "Parameter is required"),
  machineTypeId: z.string().min(1, "Machine type is required"),
});

type FormValues = z.infer<typeof formSchema>;

export type MachineTypeParameterFormInitialData = {
  id: string;
  parameterId: string;
  machineTypeId: string;
};


interface MachineTypeParameterFormProps {
  initialData?: MachineTypeParameterFormInitialData;
  onSuccess?: () => void;
}

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */
export function MachineTypeParameterForm({ initialData, onSuccess }: MachineTypeParameterFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initialData;

  const [machineTypes, setMachineTypes] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [parameters, setParameters] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoadingData, setIsLoadingData] = useState(true);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      machineTypeId: initialData?.machineTypeId || "",
      parameterId: initialData?.parameterId || ""
    },
  });

  /* -------------------------------------------------------------------------- */
  /*                              Fetch Master Data                             */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    async function fetchData() {
      try {
        const [machineTypeRes, parameterRes] = await Promise.all([
          getMachineTypes({
            page: 1,
            limit: 1000,
            sortBy: "name",
            sortOrder: "asc",
          }),
          getParameters({
            page: 1,
            limit: 1000,
            sortBy: "name",
            sortOrder: "asc",
          }),
        ]);


        if (machineTypeRes.success && machineTypeRes.machineTypes) {
          setMachineTypes(
            machineTypeRes.machineTypes.map((m) => ({
              id: m.id,
              name: m.name,
            })),
          );
        }

        if (parameterRes.success && parameterRes.parameters) {
          setParameters(
            parameterRes.parameters.map((m) => ({
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
  /*                                  Submit                                    */
  /* -------------------------------------------------------------------------- */
  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        if (isEditing) {
          const updateData: Record<string, unknown> = {};


          if (data.machineTypeId !== initialData!.machineTypeId)
            updateData.machineTypeId = data.machineTypeId;

          if (data.parameterId !== initialData!.parameterId)
            updateData.parameterId = data.parameterId;

          const result = await updateMachineTypeParameter(initialData!.id, updateData);

          if (result.success) {
            toast.success(result.message);
            onSuccess?.();
          } else {
            toast.error(result.message);
          }
        } else {
          const result = await createMachineTypeParameter({
            parameterId: data.parameterId,
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

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">


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
          name="parameterId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parameter</FormLabel>
              <FormControl>
                <Combobox
                  options={parameters.map((m) => ({
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