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
  createProductionPlan,
  updateProductionPlan,
  getNextWorkOrderNo,
  getNextSequenceForLineShift,
  getAvailableTimeForSequence,
} from "@/server/productionPlanService";
import { getLines } from "@/server/lineService";
import { getShifts } from "@/server/shiftService";
import { getParts } from "@/server/partService";

// Local schema for the form to handle string dates
const formSchema = z.object({
  workOrderNo: z.string().min(1, "Work order number is required"),
  planDate: z.string().min(1, "Plan date is required"),
  lineId: z.string().min(1, "Line is required"),
  shiftId: z.string().min(1, "Shift is required"),
  partId: z.string().min(1, "Part is required"),
  cycleTimeSec: z.number().min(0.01, "Cycle time must be at least 0.01 second"),
  plannedQty: z.number().int().min(1, "Planned quantity must be at least 1"),
  sequence: z.number().int().min(1, "Sequence must be at least 1"),
  status: z.enum(["OPEN", "RUNNING", "CLOSED", "CANCELED"]),
});

type FormValues = z.infer<typeof formSchema>;

interface ProductionPlanFormProps {
  initialData?: {
    id: string;
    workOrderNo: string;
    planDate: Date;
    lineId: string;
    shiftId: string;
    partId: string;
    cycleTimeSec: number;
    plannedQty: number;
    sequence: number;
    status: string;
  };
  onSuccess?: () => void;
}

export function ProductionPlanForm({
  initialData,
  onSuccess,
}: ProductionPlanFormProps) {
  const [isPending, startTransition] = useTransition();
  const [lines, setLines] = useState<Array<{ id: string; name: string }>>([]);
  const [shifts, setShifts] = useState<
    Array<{ id: string; lineId: string; number: number }>
  >([]);
  const [parts, setParts] = useState<
    Array<{
      id: string;
      partNo: string;
      name: string;
      lineId: string;
      qtyPerLot: number | null;
      cycleTimeSec: number | null;
    }>
  >([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedLineId, setSelectedLineId] = useState<string>("");
  const [availableTimeInfo, setAvailableTimeInfo] = useState<{
    totalLoadingTimeSec: number;
    usedTimeSec: number;
    availableTimeSec: number;
    maxPlannedQty: number;
  } | null>(null);
  const [isCalculatingTime, setIsCalculatingTime] = useState(false);
  const isEditing = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workOrderNo: initialData?.workOrderNo || "",
      planDate: initialData?.planDate
        ? new Date(initialData.planDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      lineId: initialData?.lineId || "",
      shiftId: initialData?.shiftId || "",
      partId: initialData?.partId || "",
      cycleTimeSec: initialData?.cycleTimeSec || 60,
      plannedQty: initialData?.plannedQty || 100,
      sequence: initialData?.sequence || 1,
      status:
        (initialData?.status as "OPEN" | "RUNNING" | "CLOSED" | "CANCELED") ||
        "OPEN",
    },
  });

  // Fetch lines, shifts, and parts on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [linesResult, shiftsResult, partsResult] = await Promise.all([
          getLines({
            page: 1,
            limit: 1000,
            sortBy: "name",
            sortOrder: "asc",
          }),
          getShifts({
            page: 1,
            limit: 1000,
            sortBy: "number",
            sortOrder: "asc",
          }),
          getParts({
            page: 1,
            limit: 1000,
            sortBy: "partNo",
            sortOrder: "asc",
          }),
        ]);

        if (linesResult.success && linesResult.lines) {
          const activeLines = linesResult.lines
            .filter((line) => line.isActive)
            .map((line) => ({
              id: line.id,
              name: line.name,
            }));
          setLines(activeLines);
        }

        if (shiftsResult.success && shiftsResult.shifts) {
          setShifts(
            shiftsResult.shifts.map((shift) => ({
              id: shift.id,
              lineId: shift.lineId,
              number: shift.number,
            })),
          );
        }

        if (partsResult.success && partsResult.parts) {
          setParts(
            partsResult.parts.map((part) => ({
              id: part.id,
              partNo: part.partNo,
              name: part.name,
              lineId: part.lineId,
              qtyPerLot: part.qtyPerLot,
              cycleTimeSec: part.cycleTimeSec,
            })),
          );
        }

        // After data is loaded, ensure selectedLineId is set if in edit mode
        if (initialData?.lineId) {
          setSelectedLineId(initialData.lineId);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load form data");
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, [initialData?.lineId]);

  // Ensure selectedLineId is synced with form lineId in edit mode after data loads
  useEffect(() => {
    if (isEditing && !isLoadingData && initialData?.lineId) {
      const currentLineId = form.getValues("lineId");
      if (currentLineId && currentLineId !== selectedLineId) {
        setSelectedLineId(currentLineId);
      }
    }
  }, [isEditing, isLoadingData, initialData?.lineId, form, selectedLineId]);

  // Generate initial work order number on mount (only for create mode)
  useEffect(() => {
    if (isEditing) return; // Skip for edit mode

    async function generateInitialWorkOrderNo() {
      const planDateValue = form.getValues("planDate");
      if (planDateValue) {
        try {
          const planDate = new Date(planDateValue);
          const result = await getNextWorkOrderNo(planDate);

          if (result.success && result.workOrderNo) {
            form.setValue("workOrderNo", result.workOrderNo);
          }
        } catch (error) {
          console.error("Error generating initial work order number:", error);
        }
      }
    }

    generateInitialWorkOrderNo();
  }, [form, isEditing]);

  // Auto-populate cycleTimeSec and plannedQty when part is selected
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "partId" && value.partId) {
        const selectedPart = parts.find((p) => p.id === value.partId);
        if (selectedPart) {
          // Only set default values if current values are the initial defaults
          // (to avoid overwriting user-modified values)
          if (
            !isEditing ||
            form.getValues("cycleTimeSec") === initialData?.cycleTimeSec
          ) {
            if (selectedPart.cycleTimeSec) {
              form.setValue("cycleTimeSec", selectedPart.cycleTimeSec);
            }
          }
          if (
            !isEditing ||
            form.getValues("plannedQty") === initialData?.plannedQty
          ) {
            if (selectedPart.qtyPerLot) {
              form.setValue("plannedQty", selectedPart.qtyPerLot);
            }
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, parts, isEditing, initialData]);

  // Auto-populate sequence when date, line, or shift changes (only for create mode)
  useEffect(() => {
    if (isEditing) return; // Skip for edit mode

    const subscription = form.watch(async (value, { name }) => {
      // Trigger when any of these fields change
      if (
        (name === "planDate" || name === "lineId" || name === "shiftId") &&
        value.planDate &&
        value.lineId &&
        value.shiftId
      ) {
        try {
          const planDate = new Date(value.planDate);
          const result = await getNextSequenceForLineShift(
            planDate,
            value.lineId,
            value.shiftId,
          );

          if (result.success && result.sequence) {
            form.setValue("sequence", result.sequence);
          }
        } catch (error) {
          console.error("Error fetching next sequence:", error);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isEditing]);

  // Auto-populate work order number when date changes (only for create mode)
  useEffect(() => {
    if (isEditing) return; // Skip for edit mode

    const subscription = form.watch(async (value, { name }) => {
      if (name === "planDate" && value.planDate) {
        try {
          const planDate = new Date(value.planDate);
          const result = await getNextWorkOrderNo(planDate);

          if (result.success && result.workOrderNo) {
            form.setValue("workOrderNo", result.workOrderNo);
          }
        } catch (error) {
          console.error("Error generating work order number:", error);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isEditing]);

  // Filter shifts based on selected line
  const availableShifts = shifts.filter(
    (shift) => shift.lineId === selectedLineId,
  );

  // Filter parts based on selected line
  const availableParts = parts.filter((part) => part.lineId === selectedLineId);

  // Calculate available time and max quantity when relevant fields change
  useEffect(() => {
    const subscription = form.watch(async (value) => {
      // Only calculate if all required fields are filled
      if (
        value.planDate &&
        value.lineId &&
        value.shiftId &&
        value.sequence &&
        value.cycleTimeSec &&
        value.cycleTimeSec > 0
      ) {
        setIsCalculatingTime(true);
        try {
          const planDate = new Date(value.planDate);
          const result = await getAvailableTimeForSequence(
            planDate,
            value.lineId,
            value.shiftId,
            value.sequence,
            value.cycleTimeSec,
            isEditing ? initialData?.id : undefined,
          );

          if (result.success) {
            setAvailableTimeInfo({
              totalLoadingTimeSec: result.totalLoadingTimeSec || 0,
              usedTimeSec: result.usedTimeSec || 0,
              availableTimeSec: result.availableTimeSec || 0,
              maxPlannedQty: result.maxPlannedQty || 0,
            });
          } else {
            setAvailableTimeInfo(null);
          }
        } catch (error) {
          console.error("Error calculating available time:", error);
          setAvailableTimeInfo(null);
        } finally {
          setIsCalculatingTime(false);
        }
      } else {
        setAvailableTimeInfo(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isEditing, initialData?.id]);

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        // Validate planned quantity against available time
        if (
          availableTimeInfo &&
          data.plannedQty > availableTimeInfo.maxPlannedQty
        ) {
          const availableHours = (
            availableTimeInfo.availableTimeSec / 3600
          ).toFixed(2);
          const requiredHours = (
            (data.plannedQty * data.cycleTimeSec) /
            3600
          ).toFixed(2);
          toast.error(`Planned quantity exceeds available time!`, {
            description: `Available: ${availableHours}h (max ${availableTimeInfo.maxPlannedQty} units). Required: ${requiredHours}h for ${data.plannedQty} units.`,
            duration: 6000,
          });
          return;
        }

        const planDate = new Date(data.planDate);

        if (isEditing) {
          // For editing, only send changed fields
          const updateData: Record<string, unknown> = {};
          if (data.workOrderNo !== initialData.workOrderNo)
            updateData.workOrderNo = data.workOrderNo;
          if (
            data.planDate !==
            new Date(initialData.planDate).toISOString().split("T")[0]
          )
            updateData.planDate = planDate;
          if (data.lineId !== initialData.lineId)
            updateData.lineId = data.lineId;
          if (data.shiftId !== initialData.shiftId)
            updateData.shiftId = data.shiftId;
          if (data.partId !== initialData.partId)
            updateData.partId = data.partId;
          if (data.cycleTimeSec !== initialData.cycleTimeSec)
            updateData.cycleTimeSec = data.cycleTimeSec;
          if (data.plannedQty !== initialData.plannedQty)
            updateData.plannedQty = data.plannedQty;
          if (data.sequence !== initialData.sequence)
            updateData.sequence = data.sequence;
          if (data.status !== initialData.status)
            updateData.status = data.status;

          const result = await updateProductionPlan(initialData.id, updateData);
          if (result.success) {
            toast.success(result.message || "Updated successfully");
            form.reset();
            onSuccess?.();
          } else {
            toast.error(result.message || "Failed to update");
          }
        } else {
          const result = await createProductionPlan({
            ...data,
            planDate,
          });
          if (result.success) {
            toast.success(result.message || "Created successfully");
            form.reset();
            onSuccess?.();
          } else {
            toast.error(result.message || "Failed to create");
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="workOrderNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Order Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="WO-2511040001"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription>Unique work order identifier</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="planDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={isPending} />
                </FormControl>
                <FormDescription>Production plan date</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Available Time Information Banner */}
        {availableTimeInfo && (
          <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
            <h4 className="text-sm font-medium">
              Time Availability for Sequence {form.watch("sequence")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">
                  Total Loading Time:
                </span>
                <div className="font-medium">
                  {(availableTimeInfo.totalLoadingTimeSec / 3600).toFixed(2)}{" "}
                  hours
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Used by Previous:</span>
                <div className="font-medium">
                  {(availableTimeInfo.usedTimeSec / 3600).toFixed(2)} hours
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Available:</span>
                <div
                  className={`font-medium ${
                    availableTimeInfo.availableTimeSec > 0
                      ? "text-green-600"
                      : "text-destructive"
                  }`}
                >
                  {(availableTimeInfo.availableTimeSec / 3600).toFixed(2)} hours
                </div>
              </div>
            </div>
            <div className="pt-2 border-t">
              <span className="text-xs text-muted-foreground">
                Maximum quantity for this sequence:{" "}
                <span className="font-semibold text-foreground">
                  {availableTimeInfo.maxPlannedQty} units
                </span>
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="lineId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Line</FormLabel>
                <FormControl>
                  <Combobox
                    options={lines.map((line) => ({
                      value: line.id,
                      label: line.name,
                    }))}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedLineId(value);
                      // Reset shift and part when line changes
                      form.setValue("shiftId", "");
                      form.setValue("partId", "");
                    }}
                    placeholder={
                      isLoadingData ? "Loading lines..." : "Select a line"
                    }
                    searchPlaceholder="Search lines..."
                    emptyText="No lines found."
                    disabled={isPending || isLoadingData}
                  />
                </FormControl>
                <FormDescription>Production line</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shiftId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shift</FormLabel>
                <FormControl>
                  <Combobox
                    key={`shift-${selectedLineId}-${availableShifts.length}`}
                    options={availableShifts.map((shift) => ({
                      value: shift.id,
                      label: `Shift ${shift.number}`,
                    }))}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={
                      !selectedLineId
                        ? "Select a line first"
                        : isLoadingData
                          ? "Loading shifts..."
                          : "Select a shift"
                    }
                    searchPlaceholder="Search shifts..."
                    emptyText={
                      selectedLineId
                        ? "No shifts available for this line"
                        : "Select a line first"
                    }
                    disabled={isPending || isLoadingData || !selectedLineId}
                  />
                </FormControl>
                <FormDescription>Work shift</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="partId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Part</FormLabel>
              <FormControl>
                <Combobox
                  key={`part-${selectedLineId}-${availableParts.length}`}
                  options={availableParts.map((part) => ({
                    value: part.id,
                    label: `${part.partNo} - ${part.name}`,
                  }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={
                    !selectedLineId
                      ? "Select a line first"
                      : isLoadingData
                        ? "Loading parts..."
                        : "Select a part"
                  }
                  searchPlaceholder="Search parts..."
                  emptyText={
                    selectedLineId
                      ? "No parts available for this line"
                      : "Select a line first"
                  }
                  disabled={isPending || isLoadingData || !selectedLineId}
                />
              </FormControl>
              <FormDescription>Part to be produced</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="cycleTimeSec"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cycle Time (seconds)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="60 or 45.5"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    disabled={isPending}
                    min={0.01}
                  />
                </FormControl>
                <FormDescription>
                  Time per unit (supports decimals)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="plannedQty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Planned Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="100"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription>
                  Target quantity
                  {availableTimeInfo && (
                    <span className="block mt-1">
                      {isCalculatingTime ? (
                        <span className="text-muted-foreground text-xs">
                          Calculating available time...
                        </span>
                      ) : (
                        <>
                          <span
                            className={`text-xs font-medium ${
                              field.value > availableTimeInfo.maxPlannedQty
                                ? "text-destructive"
                                : "text-green-600"
                            }`}
                          >
                            Available time:{" "}
                            {(
                              availableTimeInfo.availableTimeSec / 3600
                            ).toFixed(2)}
                            h (max {availableTimeInfo.maxPlannedQty} units)
                          </span>
                          {field.value > 0 && (
                            <span className="block text-xs text-muted-foreground">
                              Required:{" "}
                              {(
                                (field.value * form.getValues("cycleTimeSec")) /
                                3600
                              ).toFixed(2)}
                              h for {field.value} units
                            </span>
                          )}
                          {availableTimeInfo.usedTimeSec > 0 && (
                            <span className="block text-xs text-muted-foreground">
                              Used by previous sequences:{" "}
                              {(availableTimeInfo.usedTimeSec / 3600).toFixed(
                                2,
                              )}
                              h
                            </span>
                          )}
                        </>
                      )}
                    </span>
                  )}
                </FormDescription>
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
                  <Input
                    type="number"
                    placeholder="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    disabled={isPending || !isEditing}
                  />
                </FormControl>
                <FormDescription>
                  {isEditing
                    ? "Production order (per date, line, and shift)"
                    : "Auto-generated based on date, line, and shift"}
                  {availableTimeInfo && availableTimeInfo.usedTimeSec > 0 && (
                    <span className="block text-xs text-amber-600 mt-1">
                      Note: Sequences before this have used{" "}
                      {(availableTimeInfo.usedTimeSec / 3600).toFixed(2)}h
                    </span>
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <Combobox
                  options={[
                    { value: "OPEN", label: "Open" },
                    { value: "RUNNING", label: "Running" },
                    { value: "CLOSED", label: "Closed" },
                    { value: "CANCELED", label: "Canceled" },
                  ]}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select status"
                  searchPlaceholder="Search status..."
                  emptyText="No status found."
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>Production plan status</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isPending || isLoadingData}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Create"} Production Plan
          </Button>
        </div>
      </form>
    </Form>
  );
}
