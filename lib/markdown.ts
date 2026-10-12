import { Marked } from "marked";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Markdown from content/ to HTML. Raw HTML in a file is shown as text, never
 * run, so a pull request can only change words and links.
 */
const markdown = new Marked({
  gfm: true,
  async: false,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    link({ href, title, tokens }) {
      const label = this.parser.parseInline(tokens);
      const safe = /^(https?:|\/|#|mailto:)/i.test(href) ? href : "#";
      const external = /^https?:/i.test(safe);
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      const rel = external ? ' rel="noopener"' : "";
      return `<a href="${escapeHtml(safe)}"${titleAttr}${rel}>${label}</a>`;
    },
  },
});

/** A block of Markdown (paragraphs, lists, headings). */
export function renderMarkdown(source: string): string {
  return markdown.parse(source, { async: false });
}

/** One line of Markdown (links, emphasis, code), with no paragraph around it. */
export function renderInline(source: string): string {
  return markdown.parseInline(source, { async: false });
}
