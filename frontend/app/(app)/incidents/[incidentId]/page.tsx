import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import IncidentDetailView from "@/components/incidents/IncidentDetailView";
import { getIncidentDetailQueryOptions } from "@/hooks/stores/incidents/query-options.server";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { getQueryClient } from "@/lib/query/query-client";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ incidentId: string }>;
};

export default async function IncidentDetailPage(props: PageProps) {
  const { incidentId } = await props.params;
  const supabase = await createClient();
  const org = await tryRequireOrganizationId(supabase);
  if (!org.ok) notFound();

  const queryClient = getQueryClient();

  const detail = await queryClient.fetchQuery(
    getIncidentDetailQueryOptions(supabase, { id: incidentId }, org.organizationId),
  );

  if (!detail) notFound();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <IncidentDetailView incidentId={incidentId} />
    </HydrationBoundary>
  );
}
