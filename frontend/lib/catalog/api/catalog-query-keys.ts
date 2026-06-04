export const catalogKeys = {
  all: ["catalog"] as const,
  list: () => [...catalogKeys.all, "list"] as const,
  detail: (productId: string) => [...catalogKeys.all, "detail", productId] as const,
};
