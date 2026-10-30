import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShareBody } from "@/components/quiz/share-body";
import { decodeShare } from "@/lib/quiz";
import "../../play.css";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shared = decodeShare((await params).code);
  if (!shared) return {};
  const correct = shared.results.filter(Boolean).length;
  return {
    title: `${correct}/${shared.results.length} on the agentic web quiz`,
    description: `${shared.score.toLocaleString("en-US")} points. Twelve cards on the standards that let AI agents use the web. Can you beat it?`,
    robots: { index: false },
  };
}

/** A shared open-run score. The score lives in the address, so this page needs no database. */
export default async function SharedScore({ params }: Props) {
  const shared = decodeShare((await params).code);
  if (!shared) notFound();
  const correct = shared.results.filter(Boolean).length;
  return <ShareBody kicker="Someone's quick run" score={shared.score} correct={correct} results={shared.results} />;
}
