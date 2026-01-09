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
import { Combobox } from "@/components/ui/combobox";

import {
  createUserPerLineSchema,
  type CreateUserPerLineInput,
} from "@/server/userPerLineModel";
import {
  createUserPerLine,
  updateUserPerLine,
} from "@/server/userPerLineService";
import { useUsers } from "@/hooks/useUsers";
import { useLines } from "@/hooks/useLines";
import { Input } from "../ui/input";

interface UserPerLineFormProps {
  initialData?: {
    id: string;
    userId: string;
    lineId: string;
    userUid: string;
    isActive: boolean;
  };
  onSuccess?: () => void;
}

export function UserPerLineForm({ initialData, onSuccess }: UserPerLineFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initialData;

  const { users } = useUsers({ limit: 100 });
  const { lines } = useLines({ limit: 100 });

  // Pastikan default value selalu ada untuk isActive
  const form = useForm<CreateUserPerLineInput>({
    resolver: zodResolver(createUserPerLineSchema),
    defaultValues: {
      userId: initialData?.userId || "",
      lineId: initialData?.lineId || "",
      userUid: initialData?.userUid || "",
      isActive: initialData?.isActive ?? true, // selalu boolean, bukan undefined
    },
  });

  const onSubmit = (data: CreateUserPerLineInput) => {
    startTransition(async () => {
      try {
        let result;
        if (isEditing) {
          result = await updateUserPerLine(initialData!.id, {
            ...data,
            isActive: data.isActive ?? true, // fallback boolean
          });
        } else {
          result = await createUserPerLine({
            ...data,
            isActive: data.isActive ?? true,
          });
        }

        if (result.success) {
          toast.success(result.message);
          form.reset();
          onSuccess?.();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error("UserPerLine form error:", error);
        toast.error("An error occurred. Please try again.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* User dropdown */}
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select User</FormLabel>
              <FormControl>
                <Combobox
                  options={users.map((u) => ({ value: u.id, label: `${u.name} (${u.npk || "N/A"})` }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select a user"
                  searchPlaceholder="Search users..."
                  emptyText="No users found"
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>Select the user for this line</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* User Input */}
        <FormField
          control={form.control}
          name="userUid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User RFID UID</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Input RFID UID user"
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                Input RFID UID user for this line
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Line dropdown */}
        <FormField
          control={form.control}
          name="lineId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Line</FormLabel>
              <FormControl>
                <Combobox
                  options={lines.map((l) => ({ value: l.id, label: l.name }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select a line"
                  searchPlaceholder="Search lines..."
                  emptyText="No lines found"
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>Select the line to assign this user to</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Active status */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Inactive users cannot access this line
                </FormDescription>
              </div>
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value ?? true} // pastikan boolean
                  onChange={field.onChange}
                  disabled={isPending}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isPending} className="min-w-[100px]">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}