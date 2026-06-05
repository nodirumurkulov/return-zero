import { apiClient } from "@/lib/api/client";

type ConnectionResponse = {
  connection: {
    platform: string;
    status: string;
    connected_at: string | null;
  } | null;
};

export async function getImportStatus(): Promise<ConnectionResponse> {
  const data = await apiClient("/api/stores/import/status", {
    method: "GET",
  });
  return data as ConnectionResponse;
}
