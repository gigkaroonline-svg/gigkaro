export type PublicCompany = {
  key: string;
  name: string;
  initials: string;
  color: string;
  logo: string;
};

const PROD_ASSET_ORIGIN = "https://api.gigkaro.in";

export async function fetchPublicCompanies() {
  const base = (
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api"
  ).replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/companies`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { companies?: PublicCompany[] };
    return (data.companies || []).filter((company) => company.logo);
  } catch {
    return [];
  }
}

export function companyLogoSrc(logo: string) {
  if (!logo) return "";
  if (/^https?:\/\//i.test(logo)) return logo;
  return `${PROD_ASSET_ORIGIN}${logo.startsWith("/") ? logo : `/${logo}`}`;
}
