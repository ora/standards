import { z } from "zod";
import guideJson from "@/content/guide.json";
import home from "@/content/home.json";
import pairsJson from "@/content/pairs.json";
import site from "@/content/site.json";
import { guideSchema, pairSchema, type StatusId } from "./schema";

export type Site = typeof site;

/** All page shell text. Components read from here, never from literals. */
export const content: Site = site;
export const homeContent = home;
export const pairs = z.array(pairSchema).parse(pairsJson);
export const guide = guideSchema.parse(guideJson);

export function statusLabel(status: StatusId): string {
  return content.statuses[status].label;
}

/** Link to the GitHub editor for a file in the repository. */
export function editHref(path: string): string {
  return `${content.repo.url}/edit/${content.repo.branch}/${path}`;
}

/**
 * Link to a new GitHub issue whose title is the page path, so a reader can
 * report a wrong sentence on the page they are reading.
 */
export function reportErrorHref(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${content.repo.newIssueUrl}?template=correction.yml&title=${encodeURIComponent(`Correction: ${path}`)}`;
}

/** "2026-10-11" as "October 11, 2026", the same on every server. */
export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];

/** 12 as "twelve"; numbers past twenty stay as digits. */
export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}
