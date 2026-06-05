/** Stamp owner_user_id on rows written to tenant-scoped tables. */
export function withOwner<T extends Record<string, unknown>>(
  ownerUserId: string,
  rows: T[],
): (T & { owner_user_id: string })[] {
  return rows.map((row) => ({ ...row, owner_user_id: ownerUserId }));
}

export function withOwnerOne<T extends Record<string, unknown>>(
  ownerUserId: string,
  row: T,
): T & { owner_user_id: string } {
  return { ...row, owner_user_id: ownerUserId };
}
