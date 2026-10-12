"use client";

import { useState } from "react";
import type { StatusId } from "@/lib/schema";

type Filter = "all" | StatusId;

/**
 * Status buttons over the map. Picking one dims every tile with another
 * status. Without JavaScript the buttons do nothing and the whole map shows.
 */
export function MapFilter({
  label,
  options,
  children,
}: {
  label: string;
  options: { id: Filter; label: string; count: number }[];
  children: React.ReactNode;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  return (
    <div className="map" data-filter={filter}>
      <div className="map__filter" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`map__filter-button status--${option.id}`}
            aria-pressed={filter === option.id}
            onClick={() => setFilter(option.id)}
          >
            {option.id !== "all" && <span className={`status status--${option.id}`}><span className="status__dot" aria-hidden="true" /></span>}
            {option.label}
            <span className="map__filter-count">{option.count}</span>
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
