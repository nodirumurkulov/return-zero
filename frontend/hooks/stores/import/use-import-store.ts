import { useMutation } from "@tanstack/react-query";

import { postImportStore } from "@/lib/api/stores/import/client";
import type { StorePlatform } from "@/lib/stores";

export function useImportStore(platform: StorePlatform) {
  return useMutation({
    mutationFn: () => postImportStore(platform),
  });
}
