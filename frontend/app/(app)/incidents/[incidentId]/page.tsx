import { notFound } from "next/navigation";
import IncidentDetailView from "@/components/incidents/IncidentDetailView";
import { tryRequireOrganizationId } from "@/lib/organizations";
import { getStore } from "@/lib/stores/server";
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

  const detail = await getStore(supabase).incidents.getDetail({
    id: incidentId,
    organizationId: org.organizationId,
  });

  if (!detail) notFound();

  return <IncidentDetailView detail={detail} />;
}
