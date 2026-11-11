import { currentSiteUrl } from "@/lib/site-url";
import { getSpecStatus, specsDocument } from "@/lib/specs";

// Made again at most hourly (SPEC_STATUS_REVALIDATE), like /specs.
export const revalidate = 3600;

/** Every spec in the registry: its versions, Ora's reviewed version and the latest upstream. */
export async function GET() {
  const site = currentSiteUrl().origin;
  return Response.json(specsDocument(await getSpecStatus(), site), {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
