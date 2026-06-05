import { NextResponse, type NextRequest } from "next/server";
import {
  onboardingUploadPartialResponseSchema,
  onboardingUploadSuccessResponseSchema,
} from "@/lib/onboarding/api-schemas";
import { importContractData } from "@/lib/onboarding/import";
import { CONTRACT_FILES } from "@/lib/onboarding/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // large uploads can take a while

// POST /api/onboarding/upload — multipart form with one CSV per contract file.
// Replaces the contract tables with the uploaded data and returns per-table counts.
export async function POST(req: NextRequest) {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const replace = form.get("replace") !== "false"; // default: replace existing data

  const entries = await Promise.all(
    CONTRACT_FILES.map(async (name): Promise<readonly [string, string] | null> => {
      const f = form.get(name);
      return f instanceof File && f.size > 0 ? ([name, await f.text()] as const) : null;
    })
  );
  const files = Object.fromEntries(entries.filter((e): e is readonly [string, string] => e !== null));
  if (Object.keys(files).length === 0) {
    return NextResponse.json({ error: "No CSV files provided" }, { status: 400 });
  }

  const supabase = createAdminClient();
  try {
    const results = await importContractData(supabase, files, { replace });
    const ok = results.every((r) => !r.error);
    const body = ok
      ? onboardingUploadSuccessResponseSchema.parse({ success: true, results })
      : onboardingUploadPartialResponseSchema.parse({ success: false, results });
    return NextResponse.json(body, { status: ok ? 200 : 207 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
