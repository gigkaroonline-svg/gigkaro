import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/job\/([^/]+)\/?$/);
  const slug = match?.[1];
  if (!slug || slug === "local" || slug === "view") return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/job/view/";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/job/:slug*"],
};
