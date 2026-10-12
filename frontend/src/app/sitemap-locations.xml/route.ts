import {
  buildLocationsSitemap,
  toUrlSetXml,
  xmlResponse,
} from "@/lib/sitemaps";

export const dynamic = "force-static";

export function GET() {
  return xmlResponse(toUrlSetXml(buildLocationsSitemap()));
}
