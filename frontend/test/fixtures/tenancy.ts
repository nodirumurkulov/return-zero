import type { AppTenancy } from "@/lib/tenancy";

const DEFAULT_STORE_ID = "aaaaaaaa-1111-1111-1111-111111111111";
const DEFAULT_ORG_ID = "bbbbbbbb-1111-1111-1111-111111111111";

export function createTenancyFixture(overrides: Partial<AppTenancy> = {}): AppTenancy {
  const store = {
    id: DEFAULT_STORE_ID,
    label: "Hugo mock store",
    platform: "mock_csv" as const,
    status: "connected" as const,
  };

  return {
    organization: {
      id: DEFAULT_ORG_ID,
      name: "Hugo mock store",
    },
    stores: [store],
    activeStore: store,
    scope: {
      organizationId: DEFAULT_ORG_ID,
      storeId: DEFAULT_STORE_ID,
    },
    ...overrides,
  };
}
