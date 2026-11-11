import {
  buildJobsSitemap,
  toUrlSetXml,
  xmlResponse,
} from "@/lib/sitemaps";

// Once per day — drip expands at most once daily; no need to rebuild every 30m.
export const revalidate = 86400;

export async function GET() {
  return xmlResponse(toUrlSetXml(await buildJobsSitemap()));
}
