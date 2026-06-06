import { cn } from "@/lib/utils";

export function MarketingAtmosphere({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative min-h-screen bg-background text-foreground", className)}>
      <div className="relative">{children}</div>
    </div>
  );
}
