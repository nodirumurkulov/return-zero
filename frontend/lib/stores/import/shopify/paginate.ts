import type { ShopifyAdminClient } from "@/lib/shopify/client";

import { ImportError } from "../errors";

const MAX_RETRIES = 5;

function parseNextPath(linkHeader: string | null, apiVersion: string): string | null {
  if (!linkHeader) {
    return null;
  }

  for (const part of linkHeader.split(",")) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (!match?.[1]) {
      continue;
    }

    const url = new URL(match[1]);
    const prefix = `/admin/api/${apiVersion}`;
    if (url.pathname.startsWith(prefix)) {
      return `${url.pathname.slice(prefix.length)}${url.search}`;
    }

    return `${url.pathname}${url.search}`;
  }

  return null;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchShopifyRestPages<T>(opts: {
  client: ShopifyAdminClient;
  path: string;
  rootKey: string;
  parseItem: (item: unknown) => T;
}): Promise<T[]> {
  const items: T[] = [];

  const request = async (path: string, retries: number): Promise<void> => {
    const response = await opts.client.fetch(path);

    if (response.status === 429) {
      if (retries >= MAX_RETRIES) {
        throw new ImportError("Shopify rate limit exceeded");
      }

      const retryAfter = Number(response.headers.get("Retry-After") ?? "2");
      await sleep(Math.max(retryAfter, 1) * 1000);
      await request(path, retries + 1);
      return;
    }

    if (!response.ok) {
      throw new ImportError(`Shopify request failed (${response.status}): ${path}`);
    }

    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null || !(opts.rootKey in body)) {
      throw new ImportError(`Shopify response missing ${opts.rootKey}`);
    }

    const pageItems = (body as Record<string, unknown>)[opts.rootKey];
    if (!Array.isArray(pageItems)) {
      throw new ImportError(`Shopify ${opts.rootKey} is not an array`);
    }

    for (const item of pageItems) {
      items.push(opts.parseItem(item));
    }

    const nextPath = parseNextPath(response.headers.get("Link"), opts.client.apiVersion);
    if (nextPath) {
      await request(nextPath, 0);
    }
  };

  const initialPath = opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  await request(initialPath, 0);
  return items;
}
