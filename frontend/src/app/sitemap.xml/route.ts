import {
  sitemapIndexFiles,
  toSitemapIndexXml,
  xmlResponse,
} from "@/lib/sitemaps";

export const dynamic = "force-static";

export function GET() {
  const lastModified = new Date().toISOString();
  return xmlResponse(
    toSitemapIndexXml(
      sitemapIndexFiles.map((path) => ({ path, lastModified })),
    ),
  );
}
