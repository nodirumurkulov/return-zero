/** Organization member row — matches Supabase `organization_members` table columns. */
export type OrganizationMember = {
  organization_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: string;
};
