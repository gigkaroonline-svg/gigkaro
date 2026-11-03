"use client";

const PAGE_SIZE = 12;

export { PAGE_SIZE as OPENINGS_PAGE_SIZE };

function pageWindow(current: number, total: number) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const pages = new Set<number>([1, total, current]);
  for (let offset = 1; offset <= 2; offset += 1) {
    pages.add(current - offset);
    pages.add(current + offset);
  }
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];
  for (const page of sorted) {
    const prev = items[items.length - 1];
    if (typeof prev === "number" && page - prev > 1) items.push("ellipsis");
    items.push(page);
  }
  return items;
}

export function OpeningsPager({
  page,
  totalPages,
  onChange,
  scrollToId,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  scrollToId?: string;
}) {
  if (totalPages <= 1) return null;
  const safePage = Math.min(page, totalPages);
  const numbers = pageWindow(safePage, totalPages);

  function goTo(next: number) {
    onChange(Math.min(totalPages, Math.max(1, next)));
    if (!scrollToId) return;
    document
      .getElementById(scrollToId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="city-openings-pager" aria-label="Job pages">
      <div className="city-openings-pages">
        {numbers.map((item, index) =>
          item === "ellipsis" ? (
            <span key={`e-${index}`} className="city-openings-ellipsis">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={
                item === safePage
                  ? "city-openings-page is-active"
                  : "city-openings-page"
              }
              aria-current={item === safePage ? "page" : undefined}
              onClick={() => goTo(item)}
            >
              {item.toLocaleString("en-IN")}
            </button>
          ),
        )}
      </div>
    </nav>
  );
}
