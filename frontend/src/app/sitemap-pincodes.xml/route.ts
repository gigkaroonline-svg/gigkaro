import {
  buildPincodesSitemap,
  toUrlSetXml,
  xmlResponse,
} from "@/lib/sitemaps";

export const revalidate = 3600;

export function GET() {
  return xmlResponse(toUrlSetXml(buildPincodesSitemap()));
}
