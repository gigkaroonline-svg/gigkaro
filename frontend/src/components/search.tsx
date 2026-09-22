"use client";
import { uiText } from "@/lib/i18n";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search, Navigation, ChevronDown } from "lucide-react";
import { getCategories } from "@/lib/services/categories";
import { api, ApiError } from "@/lib/api";

type LocationHit = {
  pincode: string;
  locality: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  label: string;
};

export function LocationSearch({
  compact = false,
  initial = "",
}: {
  compact?: boolean;
  initial?: string;
}) {
  const id = useId();
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [location, setLocation] = useState(initial);
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [hits, setHits] = useState<LocationHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = location.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      api<{ locations: LocationHit[] }>(
        `/locations/search?q=${encodeURIComponent(q)}&limit=12`,
        { auth: false },
      )
        .then((data) => {
          if (!cancelled) {
            setHits(data.locations || []);
            setOpen(true);
          }
        })
        .catch(() => {
          if (!cancelled) setHits([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [location]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!location.trim()) {
      setError("Enter a pincode or city to find nearby work.");
      return;
    }
    if (/^\d+$/.test(location) && !/^\d{6}$/.test(location)) {
      setError("Enter a valid 6-digit pincode.");
      return;
    }
    setOpen(false);
    router.push(
      `/jobs?${new URLSearchParams({ location: location.trim(), ...(category ? { category } : {}), radius: "10" })}`,
    );
  }

  function pick(hit: LocationHit) {
    setLocation(hit.pincode);
    setError("");
    setOpen(false);
  }

  function locate() {
    if (!navigator.geolocation) {
      setError("Location is unavailable. Enter your pincode instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await api<{
            location: LocationHit;
            distanceKm: number;
          }>(
            `/locations/nearest?lat=${position.coords.latitude}&lng=${position.coords.longitude}`,
            { auth: false },
          );
          if (data.distanceKm > 80) {
            setError(
              "Couldn’t match a nearby pincode. Enter your pincode instead.",
            );
          } else {
            setLocation(data.location.pincode);
            setError("");
          }
        } catch (err) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Couldn’t get your location. Enter your pincode instead.",
          );
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setError("Couldn’t get your location. Enter your pincode instead.");
      },
      { timeout: 10000 },
    );
  }

  return (
    <div className={compact ? "search-wrap compact" : "search-wrap"} ref={wrapRef}>
      <form onSubmit={submit} className="location-search">
        <div className="search-field location-autocomplete">
          <MapPin size={21} />
          <label>
            <span>{uiText("yourNeighbourhood")}</span>
            <input
              aria-label={uiText("pincodeOrLocation")}
              placeholder={uiText("enterPincodeOrLocation")}
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setError("");
                setOpen(true);
              }}
              onFocus={() => hits.length && setOpen(true)}
              autoComplete="off"
              role="combobox"
              aria-expanded={open}
              aria-controls={id}
            />
          </label>
          {open && (hits.length > 0 || loading) && (
            <ul id={id} className="location-suggest" role="listbox">
              {loading && !hits.length && (
                <li className="location-suggest-empty">Searching…</li>
              )}
              {hits.map((h) => (
                <li key={`${h.pincode}-${h.locality}`}>
                  <button
                    type="button"
                    role="option"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(h)}
                  >
                    <strong>{h.pincode}</strong>
                    <span>
                      {h.locality}, {h.city}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {!compact && (
          <div className="search-field search-category">
            <BriefcaseIcon />
            <label>
              <span>{uiText("whatKindOfWork")}</span>
              <select
                aria-label={uiText("jobCategory")}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">{uiText("allJobCategories")}</option>
                {getCategories().map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <ChevronDown size={16} />
          </div>
        )}
        <button className="button button-primary search-submit" type="submit">
          <Search size={18} />
          {uiText("findJobs")}
          <span className="sr-only"> {uiText("nearMe")}</span>
        </button>
      </form>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {!compact && (
        <div className="search-below">
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="text-link"
          >
            <Navigation size={14} />
            {locating ? "Finding your location…" : "Use my current location"}
          </button>
          <span>{uiText("noCvNoLongFormsJustOpportunities")}</span>
        </div>
      )}
    </div>
  );
}
function BriefcaseIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M3 12a20 20 0 0 0 18 0M12 11v3" />
    </svg>
  );
}
export const PincodeSearch = LocationSearch;
