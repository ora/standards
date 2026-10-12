import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import jobsJson from "@/content/jobs.json";
import { JOB_IDS, type JobId, jobSchema, STANDARD_ID, type StandardFrontMatter, standardFrontMatter } from "./schema";

/** Where the standards live: one Markdown file each. */
export const STANDARDS_DIR = join(process.cwd(), "content", "standards");

export type Job = z.infer<typeof jobSchema>;

export interface Standard extends StandardFrontMatter {
  /** The file name without ".md". Also the page address: /standards/<id>. */
  id: string;
  /** Position on the whole map, 1 to n, in job order then `order`. */
  number: number;
  /** The Markdown after the front matter. */
  body: string;
}

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

/** Split a file into its YAML front matter and Markdown body. */
export function splitFrontMatter(source: string): { data: unknown; body: string } {
  const match = FRONT_MATTER.exec(source);
  if (!match) throw new Error("missing front matter: the file must start with a --- block");
  return { data: parseYaml(match[1] ?? ""), body: source.slice(match[0].length).trim() };
}

/** Read and check one file. Throws with the file name and every problem found. */
export function parseStandard(id: string, source: string): Omit<Standard, "number"> {
  if (!STANDARD_ID.test(id)) {
    throw new Error(`content/standards/${id}.md: file names are lowercase words joined by hyphens`);
  }
  try {
    const { data, body } = splitFrontMatter(source);
    const result = standardFrontMatter.safeParse(data);
    if (!result.success) throw new Error(z.prettifyError(result.error));
    return { ...result.data, id, body };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`content/standards/${id}.md is not valid:\n${reason}`);
  }
}

/** Check what can only be checked across files: unique places, real links between them. */
export function checkStandards(list: Omit<Standard, "number">[]): void {
  const ids = new Set(list.map((s) => s.id));
  const problems: string[] = [];
  const slots = new Map<string, string>();
  for (const s of list) {
    const slot = `${s.job}#${s.order}`;
    const other = slots.get(slot);
    if (other) problems.push(`${s.id} and ${other} both have job "${s.job}" and order ${s.order}`);
    slots.set(slot, s.id);
    for (const r of s.related) {
      if (r.id === s.id) problems.push(`${s.id} lists itself under related`);
      else if (!ids.has(r.id)) problems.push(`${s.id} lists "${r.id}" under related, but there is no content/standards/${r.id}.md`);
    }
  }
  if (problems.length > 0) throw new Error(`content/standards has problems:\n- ${problems.join("\n- ")}`);
}

/** Sort into map order and number them 1 to n. */
export function numberStandards(list: Omit<Standard, "number">[]): Standard[] {
  return [...list]
    .sort((a, b) => JOB_IDS.indexOf(a.job) - JOB_IDS.indexOf(b.job) || a.order - b.order)
    .map((s, index) => ({ ...s, number: index + 1 }));
}

/** Every standard from a folder, checked and in map order. */
export function loadStandards(dir: string = STANDARDS_DIR): Standard[] {
  const files = readdirSync(dir).filter((name) => name.endsWith(".md") && !name.startsWith("_"));
  const list = files.map((name) => parseStandard(name.slice(0, -3), readFileSync(join(dir, name), "utf8")));
  checkStandards(list);
  return numberStandards(list);
}

let cache: Standard[] | undefined;

/** All standards, read once per build. */
export function getStandards(): Standard[] {
  cache ??= loadStandards();
  return cache;
}

export function getStandard(id: string): Standard | undefined {
  return getStandards().find((s) => s.id === id);
}

/** The five jobs, in map order. */
export const jobs: Job[] = z
  .array(jobSchema)
  .length(JOB_IDS.length)
  .parse(jobsJson)
  .sort((a, b) => JOB_IDS.indexOf(a.id) - JOB_IDS.indexOf(b.id));

export function getJob(id: JobId): Job {
  const job = jobs.find((j) => j.id === id);
  if (!job) throw new Error(`content/jobs.json has no job "${id}"`);
  return job;
}

/** The standards of one job, in map order. */
export function standardsForJob(id: JobId, list: Standard[] = getStandards()): Standard[] {
  return list.filter((s) => s.job === id);
}

/** Whole days between a YYYY-MM-DD date and now. */
export function daysSince(date: string, now: Date = new Date()): number {
  return Math.floor((now.getTime() - Date.parse(`${date}T00:00:00Z`)) / 86_400_000);
}

/** The newest last_verified date, for "status as of". */
export function latestVerified(list: Standard[] = getStandards()): string {
  return list.map((s) => s.last_verified).sort().at(-1) ?? "";
}
