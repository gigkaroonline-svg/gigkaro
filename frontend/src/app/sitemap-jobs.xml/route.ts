import {
  buildJobsSitemap,
  toUrlSetXml,
  xmlResponse,
} from "@/lib/sitemaps";

// 30 min so rotating IST unlock times are picked up the same day.
export const revalidate = 1800;

export async function GET() {
  return xmlResponse(toUrlSetXml(await buildJobsSitemap()));
}
