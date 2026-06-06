import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

import type { Database } from "./database.types";

export function createRouteHandlerClient(request: NextRequest, response: NextResponse) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
}

export async function getRouteHandlerUser(request: NextRequest, response: NextResponse) {
  const supabase = createRouteHandlerClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
