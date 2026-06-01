"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

export function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console in dev, Sentry in prod
    if (process.env.NODE_ENV === "production") {
      // Sentry captured by global-error
    } else {
      console.error("Route error:", error);
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-destructive-50 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-surface-900 mb-3">
          Something went wrong
        </h2>
        <p className="text-surface-500 mb-8 leading-relaxed">
          An unexpected error occurred. Please try again or head back to the dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => reset()} variant="primary">
            Try again
          </Button>
          <Link href="/dashboard">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
