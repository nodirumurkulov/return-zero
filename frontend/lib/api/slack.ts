import { parseJsonString } from "./read-json";

export type SlackInteractionPayload = {
  actions?: Array<{ action_id: string; value: string }>;
  user?: { name: string };
};

export function parseSlackInteractionPayload(raw: string): SlackInteractionPayload | null {
  return parseJsonString<SlackInteractionPayload>(raw);
}
