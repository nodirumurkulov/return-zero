"use client";

import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePatchIncidentStatus } from "@/hooks/stores/incidents/use-patch-incident-status";
import { KANBAN_COLUMNS, type Incident } from "@/lib/stores";

const STATUS_LABELS = Object.fromEntries(
  KANBAN_COLUMNS.map((column) => [column.status, column.label]),
) as Record<string, string>;

export function IncidentCardStatusMenu({ incident }: { incident: Incident }) {
  const patchStatus = usePatchIncidentStatus(incident);
  const currentLabel = STATUS_LABELS[incident.status] ?? incident.status;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="incident-status-trigger"
          className="h-7 gap-1 px-2 text-xs font-medium"
          disabled={patchStatus.isPending}
        >
          {currentLabel}
          <ChevronDownIcon className="size-3.5 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {KANBAN_COLUMNS.map((column) => (
          <DropdownMenuItem
            key={column.status}
            disabled={column.status === incident.status || patchStatus.isPending}
            onClick={() => {
              void patchStatus.mutateAsync({ status: { value: column.status } });
            }}
          >
            {column.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
