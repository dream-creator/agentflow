import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={cn("bg-surface rounded-card border border-surface-200 p-4", className)} {...props}>
      {children}
    </div>
  );
}

function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

function CardTitle({ className, children, ...props }: CardProps) {
  return (
    <h3 className={cn("font-heading text-lg font-semibold text-surface-900", className)} {...props}>
      {children}
    </h3>
  );
}

function CardContent({ className, children, ...props }: CardProps) {
  return <div className={cn("", className)} {...props}>{children}</div>;
}

export { Card, CardHeader, CardTitle, CardContent };
