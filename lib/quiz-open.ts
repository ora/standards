import { z } from "zod";
import openJson from "@/content/quiz/open.json";
import { statusLabel } from "./content";
import { type QuizQuestion, quizDeck } from "./quiz-schema";
import { STATUS_IDS } from "./schema";
import { getStandards, type Standard } from "./standards";

/** The status options of a "Real or hype?" card, in map legend order. */
const STATUS_OPTIONS = STATUS_IDS.map((status) => statusLabel(status));

/** Markdown links and code to plain text, for a card's explanation. */
function plain(markdown: string): string {
  return markdown.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`([^`]+)`/g, "$1");
}

/** The reality check's opening, which states the status and why: up to two sentences that fit a card. */
function realityOpening(markdown: string): string {
  const sentences = plain(markdown).match(/[^.!?]+[.!?]+(?=\s|$)/g) ?? [markdown];
  let out = sentences[0]?.trim() ?? "";
  const second = sentences[1]?.trim();
  if (second && out.length + second.length + 1 <= 320) out += ` ${second}`;
  return out.slice(0, 320);
}

/**
 * One "Real or hype?" card per standard, written from its page: the answer is
 * its status today, so the card changes the day the page does and never goes
 * stale on its own.
 */
export function statusCard(s: Standard): QuizQuestion {
  return {
    id: `o-status-${s.id}`,
    kind: "real",
    prompt: `${s.full_name ? `${s.name} (${s.full_name})` : s.name}: ${s.phrase.charAt(0).toLowerCase()}${s.phrase.slice(1)}. How real is it today?`,
    options: STATUS_OPTIONS,
    answer: STATUS_IDS.indexOf(s.status),
    explain: realityOpening(s.reality_check),
    standard: s.id,
    source: `https://ax.guide/standards/${s.id}`,
    checked: s.last_verified,
  };
}

/** The open deck: content/quiz/open.json plus a status card per standard. */
export function getOpenDeck(): QuizQuestion[] {
  return [...openCards(), ...getStandards().map(statusCard)];
}

let cache: QuizQuestion[] | undefined;

/** content/quiz/open.json, checked. */
export function openCards(): QuizQuestion[] {
  if (cache) return cache;
  const result = quizDeck.safeParse(openJson);
  if (!result.success) throw new Error(`content/quiz/open.json is not valid:\n${z.prettifyError(result.error)}`);
  cache = result.data;
  return cache;
}
