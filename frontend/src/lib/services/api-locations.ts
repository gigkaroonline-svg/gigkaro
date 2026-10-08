export type ApiLocation = {
  pincode: string;
  locality: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
};

function apiBase() {
  return (
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api"
  ).replace(/\/$/, "");
}

export async function fetchPublicLocation(pincode: string) {
  try {
    const res = await fetch(
      `${apiBase()}/locations/${encodeURIComponent(pincode)}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { location?: ApiLocation };
    return data.location ?? null;
  } catch {
    return null;
  }
}

export async function fetchNearbyLocations(city: string, pincode: string) {
  if (!city) return [];
  try {
    const res = await fetch(
      `${apiBase()}/locations/search?q=${encodeURIComponent(city)}&limit=12`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { locations?: ApiLocation[] };
    return (data.locations ?? [])
      .filter((place) => place.pincode !== pincode)
      .slice(0, 8);
  } catch {
    return [];
  }
}
