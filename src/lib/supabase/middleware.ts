import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isLocalMode } from "@/lib/local/mode";
import { LOCAL_SESSION_COOKIE } from "@/lib/local/session";
import { verifySession } from "@/lib/local/store";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isPublicApi =
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/unsubscribe");

  if (isLocalMode()) {
    const profile = verifySession(
      request.cookies.get(LOCAL_SESSION_COOKIE)?.value
    );

    if (!profile && !isAuthPage && !isPublicApi && pathname !== "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (profile && isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/steps";
      return NextResponse.redirect(url);
    }

    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isAuthPage && !isPublicApi && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/steps";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
