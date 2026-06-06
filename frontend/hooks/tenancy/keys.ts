export const tenancyKeys = {
  all: ["tenancy"] as const,
  organization: () => [...tenancyKeys.all, "organization"] as const,
  stores: () => [...tenancyKeys.all, "stores"] as const,
  activeStore: () => [...tenancyKeys.all, "activeStore"] as const,
};
