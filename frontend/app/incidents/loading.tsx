import { Skeleton } from "@/components/ui/skeleton";

export default function IncidentsLoading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-72" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-[420px] w-72 shrink-0" />
        ))}
      </div>
    </div>
  );
}
