"use client";

import { lazy, Suspense } from "react";

const Turnstile = lazy(() =>
  import("@marsidev/react-turnstile").then((mod) => ({
    default: mod.Turnstile,
  }))
);

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "invisible";
}

export function TurnstileWidget({
  onSuccess,
  onExpire,
  onError,
  theme = "auto",
  size = "normal",
}: TurnstileWidgetProps) {
  return (
    <Suspense fallback={null}>
      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={onSuccess}
        onExpire={onExpire}
        onError={onError}
        options={{ theme, size }}
      />
    </Suspense>
  );
}
