"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Lazy-load Sentry only when an actual error occurs
    import("@sentry/nextjs").then(({ captureException }) => {
      captureException(error);
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-dvh flex items-center justify-center bg-primary-50 px-4">
          <div className="text-center">
            <h2 className="font-heading text-2xl font-bold text-surface-900 mb-4">
              Something went wrong
            </h2>
            <p className="text-surface-500 mb-6">
              An unexpected error occurred. Please try again.
            </p>
            <button onClick={() => reset()} className="btn-primary">
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
