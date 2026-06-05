import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "accent" | "destructive" | "success" | "warning";
  children: React.ReactNode;
}

function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-surface-100 text-surface-600",
    primary: "bg-primary-100 text-primary-700",
    accent: "bg-accent-100 text-accent-700",
    destructive: "bg-destructive-50 text-destructive",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-warning-100 text-warning-700",
  };

  return (
    <span
      className={cn("badge font-medium", variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
