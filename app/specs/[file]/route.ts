import { SPEC_IDS } from "@ora-ai/specs";
import { currentSiteUrl } from "@/lib/site-url";
import { getSpecStatus, isSpecId, specsDocument } from "@/lib/specs";

type Props = { params: Promise<{ file: string }> };

// One file per registry id, made at build time and again at most hourly (SPEC_STATUS_REVALIDATE).
export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return SPEC_IDS.map((id) => ({ file: `${id}.json` }));
}

/** One spec, in the same shape as an entry of /specs.json. */
export async function GET(_request: Request, { params }: Props) {
  const id = (await params).file.replace(/\.json$/, "");
  if (!isSpecId(id)) return new Response("Not found", { status: 404 });
  const doc = specsDocument(await getSpecStatus(), currentSiteUrl().origin);
  const spec = doc.specs.find((s) => s.id === id);
  return Response.json(
    { registry: doc.registry, checked_at: doc.checked_at, spec },
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );
}
