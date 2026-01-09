import { LoginForm } from "@/components/form/login-form";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/layout/Header/ThemeToggle";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <>
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        {/* Theme Toggle - Positioned in top-right corner */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <LoginForm />
      </div>
      <Toaster />
    </>
  );
}
