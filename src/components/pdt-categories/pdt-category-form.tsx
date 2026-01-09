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
  createPdtCategorySchema,
  type CreatePdtCategoryInput,
} from "@/server/pdtCategoryModel";
import {
  createPdtCategory,
  updatePdtCategory,
} from "@/server/pdtCategoryService";

interface PdtCategoryFormProps {
  initialData?: {
    id: string;
    name: string;
    defaultDurationMin: number;
  };
  onSuccess?: () => void;
}

export function PdtCategoryForm({
  initialData,
  onSuccess,
}: PdtCategoryFormProps) {
  const [isPending, startTransition] = useTransition();

  const isEditMode = !!initialData;

  const form = useForm<CreatePdtCategoryInput>({
    resolver: zodResolver(createPdtCategorySchema),
    defaultValues: {
      name: initialData?.name || "",
      defaultDurationMin: initialData?.defaultDurationMin || 30,
    },
  });

  const onSubmit = (data: CreatePdtCategoryInput) => {
    startTransition(async () => {
      try {
        const result = isEditMode
          ? await updatePdtCategory(initialData.id, data)
          : await createPdtCategory(data);

        if (result.success) {
          toast.success(
            result.message ||
              `PDT category ${isEditMode ? "updated" : "created"} successfully`,
          );
          form.reset();
          onSuccess?.();
        } else {
          toast.error(result.message || "Failed to save PDT category");
        }
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error("An error occurred while saving the PDT category");
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
              <FormLabel>Category Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Setup, Maintenance, Changeover"
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Enter a unique name for the PDT category (e.g., Setup,
                Maintenance)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultDurationMin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Duration (minutes) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="30"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  disabled={isPending}
                  min={1}
                  max={1440}
                />
              </FormControl>
              <FormDescription>
                Default duration in minutes (1-1440 min, max 24 hours)
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
