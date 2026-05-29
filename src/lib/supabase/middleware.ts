import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
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
            supabaseResponse = NextResponse.next({
              request,
            });
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

    // Protected routes
    const protectedPaths = ["/dashboard", "/pipeline", "/leads", "/follow-ups", "/settings", "/api/leads", "/api/pipeline"];
    const isProtected = protectedPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    );

    if (isProtected && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Redirect logged-in users away from auth pages
    const authPaths = ["/login", "/signup"];
    const isAuth = authPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    );

    if (isAuth && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  } catch (error) {
    // If Supabase client fails, continue without auth check
    // This allows public pages to render even if Supabase is misconfigured
    console.error("Middleware auth error:", error);
  }

  return supabaseResponse;
}
