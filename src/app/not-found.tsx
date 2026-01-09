"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, FileQuestion } from "lucide-react";
import { ThemeToggle } from "@/components/layout/Header/ThemeToggle";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      {/* Theme Toggle - Positioned in top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <div className="relative bg-primary/10 p-6 rounded-full">
                <FileQuestion className="h-16 w-16 text-primary" />
              </div>
            </div>

            {/* Error Code */}
            <div className="space-y-2">
              <h1 className="text-6xl font-bold text-primary">404</h1>
              <h2 className="text-2xl font-semibold">Page Not Found</h2>
            </div>

            {/* Description */}
            <p className="text-muted-foreground max-w-sm">
              The page you're looking for doesn't exist or has been moved.
              Please check the URL or return to the homepage.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
              <Button asChild variant="default" className="flex-1">
                <Link href="/dashboard/general">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1"
                onClick={() => window.history.back()}
              >
                <button type="button">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </button>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
