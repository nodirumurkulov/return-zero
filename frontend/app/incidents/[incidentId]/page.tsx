import { notFound } from "next/navigation";
import IncidentDetailView from "@/components/incidents/IncidentDetailView";
import { getIncidentDetail } from "@/lib/incidents";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ incidentId: string }>;
};

export default async function IncidentDetailPage(props: PageProps) {
  const { incidentId } = await props.params;
  const supabase = createServiceClient();
  const detail = await getIncidentDetail(supabase, incidentId);

  if (!detail) notFound();

  return <IncidentDetailView detail={detail} />;
}
