import {
  sitemapIndexFiles,
  toSitemapIndexXml,
  xmlResponse,
} from "@/lib/sitemaps";

export const revalidate = 3600;

export function GET() {
  const lastModified = new Date().toISOString();
  return xmlResponse(
    toSitemapIndexXml(
      sitemapIndexFiles.map((path) => ({ path, lastModified })),
    ),
  );
}
