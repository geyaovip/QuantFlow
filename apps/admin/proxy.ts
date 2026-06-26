import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function resolveApiBaseUrl(request: NextRequest) {
  if (process.env.NEXT_PROXY_API === "true") {
    return request.nextUrl.origin;
  }

  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.quantflow.chat";
}

export async function proxy(request: NextRequest) {
  const isValid = await hasValidSession(request, "admin");
  if (isValid) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

async function hasValidSession(request: NextRequest, audience: "admin") {
  const token = request.cookies.get("qf_admin_session")?.value;
  if (!token) {
    return false;
  }

  try {
    const response = await fetch(
      `${resolveApiBaseUrl(request)}/api/v1/auth/session?audience=${audience}`,
      {
        headers: {
          cookie: `qf_admin_session=${encodeURIComponent(token)}`,
        },
        cache: "no-store",
      },
    );
    return response.ok;
  } catch {
    return false;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
