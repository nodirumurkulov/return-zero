export const incidentKeys = {
  all: ["incidents"] as const,
  list: () => [...incidentKeys.all, "list"] as const,
  detail: (id: string) => [...incidentKeys.all, "detail", id] as const,
};
