import {
  buildStaticSitemap,
  toUrlSetXml,
  xmlResponse,
} from "@/lib/sitemaps";

export const revalidate = 86400;

export function GET() {
  return xmlResponse(toUrlSetXml(buildStaticSitemap()));
}
