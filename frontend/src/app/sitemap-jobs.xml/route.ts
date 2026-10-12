import {
  buildJobsSitemap,
  toUrlSetXml,
  xmlResponse,
} from "@/lib/sitemaps";

export const dynamic = "force-static";

export async function GET() {
  return xmlResponse(toUrlSetXml(await buildJobsSitemap()));
}
