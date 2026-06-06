import { notFound } from "next/navigation";
import IncidentDetailView from "@/components/incidents/IncidentDetailView";
import { getStore } from "@/lib/stores/server";
import { createClient } from "@/lib/supabase/server";
import { tryGetStoreScope } from "@/lib/tenancy/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ incidentId: string }>;
};

export default async function IncidentDetailPage(props: PageProps) {
  const { incidentId } = await props.params;
  const supabase = await createClient();
  const scopeResult = await tryGetStoreScope(supabase);
  if (!scopeResult.ok) notFound();

  const scope = scopeResult.scope;
  const detail = await getStore(supabase).incidents.getDetail({
    id: incidentId,
    scope,
  });

  if (!detail) notFound();

  return <IncidentDetailView detail={detail} />;
}
