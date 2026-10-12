"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { content } from "@/lib/content";

export function MainNav() {
  const pathname = usePathname();
  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/standards/") : pathname.startsWith(href);
  return (
    <nav className="main-nav" aria-label={content.nav.label}>
      <ul>
        {content.nav.items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
