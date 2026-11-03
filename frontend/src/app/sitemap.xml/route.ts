import {
  sitemapIndexFiles,
  toSitemapIndexXml,
  xmlResponse,
} from "@/lib/sitemaps";

export const revalidate = 86400;

export function GET() {
  const lastModified = new Date().toISOString();
  return xmlResponse(
    toSitemapIndexXml(
      sitemapIndexFiles.map((path) => ({ path, lastModified })),
    ),
  );
}
