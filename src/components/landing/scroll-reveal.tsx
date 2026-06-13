"use client";

import { useEffect, useRef, type ReactNode } from "react";

type RevealVariant = "hero" | "content" | "conversion";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
}

const VARIANT_CLASSES: Record<RevealVariant, string> = {
  hero: "scroll-reveal-hero",
  content: "scroll-reveal-content",
  conversion: "scroll-reveal-conversion",
};

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  variant = "content",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion: skip observer entirely
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      el.classList.add("revealed");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.setProperty("--reveal-delay", `${delay}ms`);
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const variantClass = VARIANT_CLASSES[variant];

  return (
    <div ref={ref} className={`scroll-reveal ${variantClass} ${className}`}>
      {children}
    </div>
  );
}
