"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";

import {
  createChildPartSchema,
  type CreateChildPartInput,
} from "@/server/childPartModel";
import {
  createChildPart,
  updateChildPart,
} from "@/server/childPartService";

import { getPlants } from "@/server/plantService";
import { getLines } from "@/server/lineService";
import { getParts } from "@/server/partService";

interface ChildPartFormProps {
  initialData?: {
    id: string;
    childPartNo: string;
    childPartname: string;
    qtyLotSupply: number | null;
    partId: string;
    lineId: string;
    plantId: string;
  };
  onSuccess?: () => void;
}

export function ChildPartForm({
  initialData,
  onSuccess,
}: ChildPartFormProps) {
  const [isPending, startTransition] = useTransition();

  /* =========================
   * State (FILTER ONLY)
   * ========================= */
  const [plants, setPlants] = useState<{ id: string; name: string }[]>([]);
  const [lines, setLines] = useState<
    { id: string; name: string; plantId: string }[]
  >([]);
  const [parts, setParts] = useState<
    { id: string; partNo: string; name: string; lineId: string }[]
  >([]);

  const [selectedPlantId, setSelectedPlantId] = useState(
    initialData?.plantId ?? "",
  );
  const [selectedLineId, setSelectedLineId] = useState(
    initialData?.lineId ?? "",
  );

  const isEditMode = !!initialData;

  /* =========================
   * React Hook Form
   * ========================= */
  const form = useForm<CreateChildPartInput>({
    resolver: zodResolver(createChildPartSchema),
    defaultValues: {
      childPartNo: initialData?.childPartNo ?? "",
      childPartname: initialData?.childPartname ?? "",
      partId: initialData?.partId ?? "",
      qtyLotSupply: initialData?.qtyLotSupply ?? null,
    },
  });

  /* =========================
   * Fetch Plant
   * ========================= */
  useEffect(() => {
    getPlants({ page: 1, limit: 1000 }).then((res) => {
      if (res.success && res.plants) {
        setPlants(res.plants.filter((p) => p.isActive));
      }
    });
  }, []);

  /* =========================
   * Fetch Line
   * ========================= */
  useEffect(() => {
    getLines({ page: 1, limit: 1000 }).then((res) => {
      if (res.success && res.lines) {
        setLines(res.lines.filter((l) => l.isActive));
      }
    });
  }, []);

  /* =========================
   * Fetch Part
   * ========================= */
  useEffect(() => {
    getParts({ page: 1, limit: 1000 }).then((res) => {
      if (res.success && res.parts) {
        setParts(res.parts);
      }
    });
  }, []);

  /* =========================
   * Derived Filters
   * ========================= */
  const filteredLines = lines.filter(
    (l) => l.plantId === selectedPlantId,
  );

  const filteredParts = parts.filter(
    (p) => p.lineId === selectedLineId,
  );

  /* =========================
   * Submit
   * ========================= */
  const onSubmit = (data: CreateChildPartInput) => {
    startTransition(async () => {
      const result = isEditMode
        ? await updateChildPart(initialData.id, data)
        : await createChildPart(data);

      if (result.success) {
        toast.success(result.message);
        form.reset();
        onSuccess?.();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* Plant */}
        <FormItem>
          <FormLabel>Plant *</FormLabel>
          <FormControl>
            <Combobox
              options={plants.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
              value={selectedPlantId}
              onValueChange={(val) => {
                setSelectedPlantId(val);
                setSelectedLineId("");
                form.setValue("partId", "");
              }}
              placeholder="Select plant"
            />
          </FormControl>
        </FormItem>

        {/* Line */}
        <FormItem>
          <FormLabel>Line *</FormLabel>
          <FormControl>
            <Combobox
              options={filteredLines.map((l) => ({
                value: l.id,
                label: l.name,
              }))}
              value={selectedLineId}
              onValueChange={(val) => {
                setSelectedLineId(val);
                form.setValue("partId", "");
              }}
              placeholder="Select line"
              disabled={!selectedPlantId}
            />
          </FormControl>
        </FormItem>

        {/* Part (FORM FIELD) */}
        <FormField
          control={form.control}
          name="partId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent Part *</FormLabel>
              <FormControl>
                <Combobox
                  options={filteredParts.map((p) => ({
                    value: p.id,
                    label: `${p.partNo} - ${p.name}`,
                  }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select part"
                  disabled={!selectedLineId}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Child Part No */}
        <FormField
          control={form.control}
          name="childPartNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Child Part No *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Child Part Name */}
        <FormField
          control={form.control}
          name="childPartname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Child Part Name *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Qty */}
        <FormField
          control={form.control}
          name="qtyLotSupply"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Qty Lot Supply</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} onClick={() => {
                console.log("ERRORS", form.formState.errors);
            }}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              isEditMode ? "Update Child Part" : "Create Child Part"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}