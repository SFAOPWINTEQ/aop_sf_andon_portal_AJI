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
import { Combobox } from "@/components/ui/combobox";
import { createUserSchema, type CreateUserInput } from "@/server/userModel";
import { createUser, updateUser } from "@/server/userService";

interface UserFormProps {
  initialData?: {
    id: string;
    name: string;
    npk: string | null;
    role: string;
    isActive: boolean;
  };
  onSuccess?: () => void;
}

export function UserForm({ initialData, onSuccess }: UserFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initialData;

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: initialData?.name || "",
      npk: initialData?.npk || "",
      password: "",
      role: (initialData?.role as "ADMIN" | "MANAGER" | "USER" | "OPERATOR" | "FOREMAN" | "DIRECTOR") || "USER",
      isActive: initialData?.isActive ?? true,
    },
  });

  const onSubmit = (data: CreateUserInput) => {
    startTransition(async () => {
      try {
        let result: { success: boolean; message: string };

        if (isEditing) {
          // For editing, only send changed fields
          const updateData: Record<string, unknown> = {};
          if (data.name !== initialData.name) updateData.name = data.name;
          if (data.npk !== initialData.npk) updateData.npk = data.npk;
          if (data.password) updateData.password = data.password;
          if (data.role !== initialData.role) updateData.role = data.role;
          if (data.isActive !== initialData.isActive)
            updateData.isActive = data.isActive;

          result = await updateUser(initialData.id, updateData);
        } else {
          result = await createUser(data);
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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} disabled={isPending} />
              </FormControl>
              <FormDescription>The full name of the user</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="npk"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NPK</FormLabel>
              <FormControl>
                <Input placeholder="emp001" {...field} disabled={isPending} />
              </FormControl>
              <FormDescription>
                Unique employee identification number
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Password {isEditing && "(Leave blank to keep current)"}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={isEditing ? "••••••••" : "Enter password"}
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>
                {isEditing
                  ? "Only fill this if you want to change the password"
                  : "Minimum 5 characters"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <Combobox
                  options={[
                    { value: "USER", label: "User" },
                    { value: "MANAGER", label: "Manager" },
                    { value: "ADMIN", label: "Admin" },
                    { value: "OPERATOR", label: "Operator" },
                    { value: "FOREMAN", label: "Foreman" },
                    { value: "DIRECTOR", label: "Director" },
                  ]}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select a role"
                  searchPlaceholder="Search roles..."
                  emptyText="No role found."
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>The user's access level</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Inactive users cannot log in to the system
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
          <Button type="submit" disabled={isPending} className="min-w-[100px]">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
