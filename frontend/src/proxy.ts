import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import builtSlugs from "./generated/job-slugs.json";

const built = new Set<string>(builtSlugs);
const reserved = new Set(["view", "local"]);

export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/job\/([^/]+)\/?$/);
  if (!match) return NextResponse.next();
  const slug = decodeURIComponent(match[1] || "");
  if (!slug || reserved.has(slug) || built.has(slug)) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = "/job/view/";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/job/:path*"],
};
