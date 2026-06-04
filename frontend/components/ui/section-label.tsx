import { cn } from "@/lib/utils";

export default function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[10px] font-semibold uppercase tracking-widest text-muted-foreground",
        className
      )}
    >
      {children}
    </p>
  );
}
