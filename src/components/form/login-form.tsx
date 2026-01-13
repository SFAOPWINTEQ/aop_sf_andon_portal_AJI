"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "@/server/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { LoginInput2, login2Schema } from "@/server/authModel";
import { Logo } from "@/components/logo";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { update } = useSession();

  const form = useForm<LoginInput2>({
    resolver: zodResolver(login2Schema),
    defaultValues: {
      npk: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginInput2) {
    // Clear any previous errors
    setError(null);

    startTransition(async () => {
      try {
        const result = await login(data);

        if (result.success) {
          await update();
          form.reset();
          router.replace("/dashboard/general");
          // In a real app, you would redirect to dashboard or update session
          console.log("Login successful:", result.user);
        } else {
          // Expected error: server-side validation or auth failure
          setError(result.message);
        }
      } catch (err) {
        // Uncaught exception: unexpected error
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        console.error("Login error:", err);
      }
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-6 pb-4">
        <Logo />
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Display error message if present */}
            {error && (
              <div
                className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <FormField
              control={form.control}
              name="npk"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NPK</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="e.g. 123456"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
