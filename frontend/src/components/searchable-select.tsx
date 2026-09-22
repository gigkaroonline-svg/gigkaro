"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import { apiAssetUrl } from "@/lib/api";

export type SearchableOption = {
  value: string;
  label: string;
  logo?: string;
  initials?: string;
  color?: string;
};

function OptionMark({
  option,
}: {
  option: Pick<SearchableOption, "logo" | "initials" | "color">;
}) {
  if (option.logo) {
    return (
      <img
        src={apiAssetUrl(option.logo)}
        alt=""
        className="searchable-select-logo"
      />
    );
  }
  if (option.initials) {
    return (
      <span
        className={`searchable-select-logo searchable-select-initials searchable-select-initials-${option.color || "slate"}`}
      >
        {option.initials}
      </span>
    );
  }
  return null;
}

export function SearchableSelect({
  id,
  value,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  required,
  disabled,
  onChange,
}: {
  id?: string;
  value: string;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuBox, setMenuBox] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const selected = options.find((o) => o.value === value) || null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  function placeMenu() {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuBox({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  }

  useEffect(() => {
    if (!open) return;
    placeMenu();
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if ((e.target as HTMLElement)?.closest?.("[data-searchable-select-menu]"))
        return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onReposition = () => placeMenu();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const menu =
    open && menuBox
      ? createPortal(
          <div
            data-searchable-select-menu
            className="searchable-select-panel"
            style={{
              position: "fixed",
              top: menuBox.top,
              left: menuBox.left,
              width: menuBox.width,
            }}
            role="presentation"
          >
            <div className="searchable-select-search">
              <Search size={15} aria-hidden />
              <input
                ref={inputRef}
                type="search"
                value={query}
                placeholder={searchPlaceholder}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filtered[0]) {
                    e.preventDefault();
                    onChange(filtered[0].value);
                    setOpen(false);
                  }
                }}
              />
            </div>
            <ul id={listId} role="listbox" className="searchable-select-list">
              {filtered.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={o.value === value}
                    className={
                      o.value === value
                        ? "searchable-select-option active"
                        : "searchable-select-option"
                    }
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                  >
                    <OptionMark option={o} />
                    <span>{o.label}</span>
                  </button>
                </li>
              ))}
              {!filtered.length && (
                <li className="searchable-select-empty">No matches</li>
              )}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="searchable-select" ref={rootRef}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="searchable-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="searchable-select-value">
          {selected ? (
            <>
              <OptionMark option={selected} />
              <span className="searchable-select-label">{selected.label}</span>
            </>
          ) : (
            <span className="searchable-select-placeholder">{placeholder}</span>
          )}
        </span>
        <ChevronDown size={16} aria-hidden />
      </button>

      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => {}}
          className="searchable-select-native"
        />
      )}

      {menu}
    </div>
  );
}
