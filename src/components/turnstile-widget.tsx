"use client";

import { lazy, Suspense, forwardRef } from "react";

const LazyTurnstile = lazy(() =>
  import("@marsidev/react-turnstile").then((mod) => ({
    default: mod.Turnstile,
  }))
);

interface TurnstileWidgetProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "invisible";
}

function TurnstileFallback() {
  return null;
}

export function TurnstileWidget({
  siteKey,
  onSuccess,
  onExpire,
  onError,
  theme = "auto",
  size = "normal",
}: TurnstileWidgetProps) {
  return (
    <Suspense fallback={<TurnstileFallback />}>
      <LazyTurnstile
        siteKey={siteKey}
        onSuccess={onSuccess}
        onExpire={onExpire}
        onError={onError}
        options={{ theme, size }}
      />
    </Suspense>
  );
}
