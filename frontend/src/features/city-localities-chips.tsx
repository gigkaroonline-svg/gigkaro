"use client";

import { useEffect, useRef, useState } from "react";
import { localityHubPath } from "@/lib/services/locations";

export function CityLocalitiesChips({
  localities,
  city,
}: {
  localities: string[];
  city: { name: string; slug: string };
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;

    const measure = () => {
      if (expanded) return;
      setNeedsToggle(node.scrollHeight > node.clientHeight + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [expanded, localities]);

  const showToggle = needsToggle || expanded;

  return (
    <div
      className={
        expanded
          ? "city-page-localities-wrap"
          : "city-page-localities-wrap is-collapsed"
      }
    >
      <ul
        ref={listRef}
        className={
          expanded
            ? "city-page-localities"
            : "city-page-localities city-page-localities-collapsed"
        }
      >
        {localities.map((locality) => (
          <li key={locality}>
            {/* Hard nav: unknown localities are rewritten to /locations/view. */}
            <a href={localityHubPath(city.slug, locality)}>{locality}</a>
          </li>
        ))}
        {showToggle && (
          <li className="city-page-localities-toggle">
            <button
              type="button"
              className="city-page-localities-more"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
