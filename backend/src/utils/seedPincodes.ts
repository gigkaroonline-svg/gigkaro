import {
  ensureIndiaPincodesLoaded,
  serializeLocation,
  type LocationRow,
} from "./indiaPincodes.js";

export type PincodeSeedRow = LocationRow;

/** Ensure the full India PIN catalog is loaded into memory. */
export async function seedPincodesIfEmpty() {
  const rows = ensureIndiaPincodesLoaded();
  console.log(`India pincode catalog ready (${rows.length})`);
  return rows.length;
}

export function serializePincode(doc: {
  pincode: string;
  locality: string;
  city: string;
  state?: string;
  lat?: number;
  lng?: number;
}) {
  return serializeLocation({
    pincode: doc.pincode,
    locality: doc.locality,
    city: doc.city,
    state: doc.state || "",
    lat: doc.lat || 0,
    lng: doc.lng || 0,
  });
}
