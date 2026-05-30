import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatStage(stage: string): string {
  return stage
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getStageVariant(
  stage: string
): "default" | "primary" | "accent" | "destructive" | "success" | "warning" {
  const variants: Record<string, "default" | "primary" | "accent" | "destructive" | "success" | "warning"> = {
    new_lead: "primary",
    contacted: "accent",
    showing: "warning",
    offer: "default",
    closed_won: "success",
    closed_lost: "destructive",
  };
  return variants[stage] || "default";
}
