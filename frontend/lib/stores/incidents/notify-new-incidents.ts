import "server-only";

import { notifyNewIncident } from "@/lib/slack";

import type { CreatedIncident } from "./detect";

export async function notifyNewIncidents(incidents: readonly CreatedIncident[]): Promise<void> {
  await Promise.all(
    incidents.map((inc) =>
      notifyNewIncident({
        incident_id: inc.incident_id,
        title: inc.title,
        severity: inc.severity,
        impact_amount: inc.impact_amount,
        impact_label: inc.impact_label,
      }),
    ),
  );
}
