"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ChevronDown, MapPin, Search } from "lucide-react";
import {
  localityHubPath,
  type CityLocalityEntry,
} from "@/lib/services/locations";
import {
  PopularCitiesGrid,
  type PopularCityCard,
} from "@/features/popular-cities-grid";

export type PopularCity = PopularCityCard;

function cityHref(slug: string) {
  return `/locations/${encodeURIComponent(slug)}/`;
}

function letterFor(name: string) {
  const ch = name.trim().charAt(0).toUpperCase();
  return ch >= "A" && ch <= "Z" ? ch : "#";
}

export function CityLocalitiesDirectory({
  cities,
  popular = [],
}: {
  cities: CityLocalityEntry[];
  popular?: PopularCity[];
}) {
  const [query, setQuery] = useState("");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const deferred = useDeferredValue(query.trim().toLowerCase());

  const filtered = useMemo(() => {
    if (!deferred) return cities;
    return cities.filter((city) => city.name.toLowerCase().includes(deferred));
  }, [cities, deferred]);

  const letters = useMemo(() => {
    const present = new Set(filtered.map((city) => letterFor(city.name)));
    return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter((letter) => present.has(letter));
  }, [filtered]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const city of filtered) {
      const letter = letterFor(city.name);
      const list = map.get(letter) || [];
      list.push(city);
      map.set(letter, list);
    }
    return map;
  }, [filtered]);

  return (
    <div className="city-directory">
      {popular.length > 0 && <PopularCitiesGrid cities={popular} />}

      <div className="city-directory-toolbar">
        <label className="city-directory-search">
          <Search size={18} aria-hidden />
          <span className="sr-only">Search a city</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a city"
            aria-label="Search a city"
          />
        </label>
      </div>

      {letters.length > 0 && (
        <nav className="city-directory-letters" aria-label="Jump to letter">
          {letters.map((letter) => (
            <a key={letter} href={`#city-letter-${letter}`}>
              {letter}
            </a>
          ))}
        </nav>
      )}

      {!filtered.length && (
        <p className="muted" role="status">
          No cities match “{query.trim()}”.
        </p>
      )}

      {[...grouped.entries()].map(([letter, rows]) => (
        <section
          key={letter}
          id={`city-letter-${letter}`}
          className="city-directory-group"
          aria-labelledby={`city-letter-heading-${letter}`}
        >
          <h3 id={`city-letter-heading-${letter}`}>{letter}</h3>
          <ul className="city-directory-list">
            {rows.map((city) => {
              const expanded = openSlug === city.slug;
              return (
                <li key={city.slug} className={expanded ? "open" : undefined}>
                  <div className="city-directory-row">
                    <Link href={cityHref(city.slug)} className="city-directory-city">
                      <MapPin size={18} aria-hidden />
                      <span>
                        <strong>{city.name}</strong>
                        <small>
                          {city.localities.length.toLocaleString("en-IN")} localities
                        </small>
                      </span>
                    </Link>
                    <button
                      type="button"
                      className="city-directory-toggle"
                      aria-expanded={expanded}
                      aria-controls={`city-localities-${city.slug}`}
                      onClick={() =>
                        setOpenSlug((current) => (current === city.slug ? null : city.slug))
                      }
                    >
                      <span className="sr-only">
                        {expanded ? "Hide" : "Show"} localities in {city.name}
                      </span>
                      <ChevronDown size={18} aria-hidden />
                    </button>
                  </div>
                  {expanded && (
                    <ul
                      id={`city-localities-${city.slug}`}
                      className="city-directory-localities"
                    >
                      {city.localities.map((locality) => (
                        <li key={locality}>
                          <a href={localityHubPath(city.slug, locality)}>
                            {locality}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
