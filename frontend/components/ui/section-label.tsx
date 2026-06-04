import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Label
      className={cn(
        "text-[10px] font-semibold uppercase tracking-widest text-muted-foreground",
        className,
      )}
    >
      {children}
    </Label>
  );
}
