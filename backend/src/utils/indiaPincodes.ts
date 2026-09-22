import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { locationCatalog } from "../data/taxonomy.js";
import { distanceKm } from "./jobs.js";

export type LocationRow = {
  pincode: string;
  locality: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
};

const require = createRequire(import.meta.url);

let rows: LocationRow[] | null = null;
let byPin: Map<string, LocationRow> | null = null;
let sortedPins: string[] | null = null;

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(So|Bo|Ho|Po|S\.O|B\.O|H\.O|P\.O)\b/gi, (m) => m.toUpperCase());
}

function cleanOfficeName(office: string) {
  return titleCase(
    office
      .replace(/\s+(S\.O|B\.O|H\.O|P\.O|G\.P\.O|MDG|SO|BO|HO|PO)\.?$/i, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function packageDataDir() {
  const entry = require.resolve("indian-pincode-utils");
  return path.join(path.dirname(entry), "../data");
}

/** Load ~19k unique India PINs from indian-pincode-utils + curated overrides. */
export function ensureIndiaPincodesLoaded(): LocationRow[] {
  if (rows) return rows;

  const dataDir = packageDataDir();
  const officeNames: string[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, "meta/officeNames.json"), "utf8"),
  );
  const districts: string[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, "meta/districts.json"), "utf8"),
  );
  const states: string[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, "meta/states.json"), "utf8"),
  );

  type Acc = {
    lat: number;
    lng: number;
    locality: string;
    city: string;
    state: string;
    rank: number;
  };
  const map = new Map<string, Acc>();

  const officeRank = (name: string) => {
    const u = name.toUpperCase();
    if (u.includes("S.O") || u.endsWith(" SO")) return 3;
    if (u.includes("H.O") || u.includes("G.P.O") || u.includes("MDG")) return 2;
    return 1;
  };

  for (const file of fs.readdirSync(path.join(dataDir, "shards"))) {
    if (!file.endsWith(".json")) continue;
    const shard = JSON.parse(
      fs.readFileSync(path.join(dataDir, "shards", file), "utf8"),
    ) as {
      pincodes: Record<string, [number, number]>;
      offices: Array<[string, number, number, number, number?, number?]>;
    };

    for (const [pin, coords] of Object.entries(shard.pincodes || {})) {
      if (!/^\d{6}$/.test(pin)) continue;
      const [lat, lng] = coords;
      if (!map.has(pin)) {
        map.set(pin, {
          lat: lat || 0,
          lng: lng || 0,
          locality: pin,
          city: "",
          state: "",
          rank: 0,
        });
      }
    }

    for (const row of shard.offices || []) {
      const pin = String(row[0] || "");
      if (!/^\d{6}$/.test(pin)) continue;
      const office = officeNames[row[1]] || "";
      const district = districts[row[2]] || "";
      const state = states[row[3]] || "";
      const lat = typeof row[4] === "number" ? row[4] : undefined;
      const lng = typeof row[5] === "number" ? row[5] : undefined;
      const rank = officeRank(office);
      const prev = map.get(pin);
      if (!prev || rank >= prev.rank) {
        map.set(pin, {
          lat: lat ?? prev?.lat ?? 0,
          lng: lng ?? prev?.lng ?? 0,
          locality: cleanOfficeName(office) || prev?.locality || pin,
          city: titleCase(district) || prev?.city || "",
          state: titleCase(state) || prev?.state || "",
          rank,
        });
      } else if (prev && !prev.city && district) {
        prev.city = titleCase(district);
        prev.state = titleCase(state) || prev.state;
      }
    }
  }

  // Curated demo localities win (Koramangala etc.)
  for (const loc of locationCatalog) {
    map.set(loc.pincode, {
      lat: loc.lat,
      lng: loc.lng,
      locality: loc.locality,
      city: loc.city,
      state: loc.state,
      rank: 99,
    });
  }

  const loaded: LocationRow[] = [...map.entries()]
    .map(([pincode, v]) => ({
      pincode,
      locality: v.locality,
      city: v.city || v.locality,
      state: v.state,
      lat: v.lat,
      lng: v.lng,
    }))
    .sort((a, b) => a.pincode.localeCompare(b.pincode));

  rows = loaded;
  byPin = new Map(loaded.map((r) => [r.pincode, r]));
  sortedPins = loaded.map((r) => r.pincode);
  return loaded;
}

export function getAllIndiaPincodes() {
  return ensureIndiaPincodesLoaded();
}

export function getIndiaPincode(pin: string) {
  ensureIndiaPincodesLoaded();
  return byPin!.get(pin);
}

export function searchIndiaPincodes(q: string, limit = 12): LocationRow[] {
  ensureIndiaPincodesLoaded();
  const query = q.trim();
  if (query.length < 2) return [];

  if (/^\d+$/.test(query)) {
    const out: LocationRow[] = [];
    // Binary search for first prefix match
    let lo = 0;
    let hi = sortedPins!.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sortedPins![mid] < query) lo = mid + 1;
      else hi = mid;
    }
    for (let i = lo; i < sortedPins!.length && out.length < limit; i++) {
      const pin = sortedPins![i];
      if (!pin.startsWith(query)) break;
      out.push(byPin!.get(pin)!);
    }
    return out;
  }

  const re = new RegExp(
    query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "i",
  );
  const out: LocationRow[] = [];
  for (const row of rows!) {
    if (re.test(row.locality) || re.test(row.city) || re.test(row.state)) {
      out.push(row);
      if (out.length >= limit) break;
    }
  }
  return out;
}

export function nearestIndiaPincode(lat: number, lng: number) {
  ensureIndiaPincodesLoaded();
  let best: LocationRow | null = null;
  let bestDist = Infinity;
  for (const row of rows!) {
    if (!row.lat && !row.lng) continue;
    const d = distanceKm({ lat, lng }, { lat: row.lat, lng: row.lng });
    if (d < bestDist) {
      bestDist = d;
      best = row;
    }
  }
  if (!best) return undefined;
  return { location: best, distanceKm: bestDist };
}

export function serializeLocation(doc: LocationRow) {
  return {
    pincode: doc.pincode,
    locality: doc.locality,
    city: doc.city,
    state: doc.state || "",
    lat: doc.lat || 0,
    lng: doc.lng || 0,
    label: `${doc.locality}, ${doc.city} (${doc.pincode})`,
  };
}
