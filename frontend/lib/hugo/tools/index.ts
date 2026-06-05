import "server-only";

import { createApprovalTools } from "./approval";
import { createCatalogTools } from "./catalog";
import type { HugoToolContext } from "./context";
import { createFinalResponseTool } from "./final-response";
import { createForecastTools } from "./forecast";
import { createIncidentsTools } from "./incidents";
import { createInventoryTools } from "./inventory";
import { createMarketingTools } from "./marketing";
import { createOrdersTools } from "./orders";
import { createPersistTools } from "./persist";
import { createResolveReferenceTools } from "./resolve-reference";
import { createReturnsTools } from "./returns";

export type HugoToolsOptions = {
  approvedBy?: string;
  includePersist?: boolean;
  includeApproval?: boolean;
  includeFinalResponse?: boolean;
};

export function createHugoTools(ctx: HugoToolContext, options: HugoToolsOptions = {}) {
  const {
    approvedBy = "hugo",
    includePersist = true,
    includeApproval = true,
    includeFinalResponse = true,
  } = options;

  return {
    ...createResolveReferenceTools(ctx),
    ...createIncidentsTools(ctx),
    ...createCatalogTools(ctx),
    ...createOrdersTools(ctx),
    ...createReturnsTools(ctx),
    ...createMarketingTools(ctx),
    ...createInventoryTools(ctx),
    ...createForecastTools(ctx),
    ...(includePersist ? createPersistTools(ctx) : {}),
    ...(includeApproval ? createApprovalTools(ctx, approvedBy) : {}),
    ...(includeFinalResponse ? createFinalResponseTool() : {}),
  };
}
