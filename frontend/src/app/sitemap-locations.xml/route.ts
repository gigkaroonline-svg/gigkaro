import {
  buildLocationsSitemap,
  toUrlSetXml,
  xmlResponse,
} from "@/lib/sitemaps";

// Once per day — locality drip expands at most once daily.
export const revalidate = 86400;

export async function GET() {
  return xmlResponse(toUrlSetXml(await buildLocationsSitemap()));
}
