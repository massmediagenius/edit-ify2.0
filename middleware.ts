import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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

  const path = request.nextUrl.pathname;

  // Redirect unauthenticated users away from protected routes
  if (!user && (path.startsWith("/dashboard") || path.startsWith("/admin") || path.startsWith("/onboarding"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from auth pages
  if (user && (path === "/login" || path === "/signup")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin") {
      return NextResponse.redirect(new URL("/admin/queue", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Onboarding gate: force incomplete editors through onboarding
  if (user && path.startsWith("/dashboard")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, role")
      .eq("id", user.id)
      .maybeSingle();

    // No profile row yet — create a stub and send through onboarding
    if (!profile) {
      await supabase.from("profiles").upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name ?? null,
        role: "editor",
        onboarding_completed: false,
      }, { onConflict: "id" });
      return NextResponse.redirect(new URL("/onboarding/step-1", request.url));
    }

    if (profile.role === "admin") {
      return NextResponse.redirect(new URL("/admin/queue", request.url));
    }

    if (!profile.onboarding_completed) {
      return NextResponse.redirect(new URL("/onboarding/step-1", request.url));
    }
  }

  // Block editors from admin routes
  if (user && path.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
