"use client";

import { usePathname } from "next/navigation";
import { content, reportErrorHref } from "@/lib/content";

export function ReportErrorLink({ label = content.footer.reportError }: { label?: string }) {
  const pathname = usePathname();
  return <a href={reportErrorHref(pathname)}>{label}</a>;
}
