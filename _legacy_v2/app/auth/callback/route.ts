import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectResponse = NextResponse.redirect(new URL("/dashboard/personas", url.origin));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  if (code) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, options);
          });
        }
      }
    });

    await supabase.auth.exchangeCodeForSession(code);
  }

  return redirectResponse;
}
