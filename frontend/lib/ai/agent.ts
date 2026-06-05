import "server-only";

import {
  Output,
  stepCountIs,
  ToolLoopAgent,
  type FlexibleSchema,
  type ToolSet,
} from "ai";
import { getModel } from "./model";

export function createInvestigationAgent<TOOLS extends ToolSet, OUTPUT>(options: {
  instructions: string;
  tools: TOOLS;
  outputSchema: FlexibleSchema<OUTPUT>;
}) {
  return new ToolLoopAgent({
    model: getModel(),
    instructions: options.instructions,
    tools: options.tools,
    output: Output.object({ schema: options.outputSchema }),
    stopWhen: stepCountIs(5),
  });
}

export function createSynthesisAgent<OUTPUT>(options: {
  instructions: string;
  outputSchema: FlexibleSchema<OUTPUT>;
}) {
  return new ToolLoopAgent({
    model: getModel(),
    instructions: options.instructions,
    output: Output.object({ schema: options.outputSchema }),
  });
}
