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
  createParameterSchema,
  type CreateParameterInput,
} from "@/server/parameterModel";
import {
  createParameter,
  updateParameter,
} from "@/server/parameterService";

interface ParameterFormProps {
  initialData?: {
    id: string;
    name: string;
    unit: string;
    opcTagName: string;
    status: number;
  };
  onSuccess?: () => void;
}

export function ParameterForm({
  initialData,
  onSuccess,
}: ParameterFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initialData;

  const form = useForm<CreateParameterInput>({
    resolver: zodResolver(createParameterSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      unit: initialData?.unit ?? "",
      opcTagName: initialData?.opcTagName ?? "",
    },
  });

  const onSubmit = (data: CreateParameterInput) => {
    startTransition(async () => {
      try {
        const result = isEditing
          ? await updateParameter(initialData!.id, data)
          : await createParameter(data);

        if (result.success) {
          toast.success(result.message);
          form.reset();
          onSuccess?.();
        } else {
          toast.error(result.message);
        }
      } catch (e) {
        console.error(e);
        toast.error("Something went wrong");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Speed"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Parameter name (must be unique)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit</FormLabel>
              <FormControl>
                <Input
                  placeholder="RPM / Nm / V / mm / bar"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Free text unit (RPM, Nm, V, hh:mm:ss, dll)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="opcTagName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>OPC Tag Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="ex: Tag001"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Free text OPC Tag Name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? "Update" : "Create"} Parameter
          </Button>
        </div>
      </form>
    </Form>
  );
}