import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type PopularCityCard = {
  city: string;
  slug: string;
  state: string;
};

const POPULAR_CITY_IMAGES: Record<string, string> = {
  bengaluru: "/images/cities/bengaluru.jpg",
  delhi: "/images/cities/delhi.jpg",
  mumbai: "/images/cities/mumbai.jpg",
  hyderabad: "/images/cities/hyderabad.jpg",
  chennai: "/images/cities/chennai.jpg",
  pune: "/images/cities/pune.jpg",
  kolkata: "/images/cities/kolkata.jpg",
  ahmedabad: "/images/cities/ahmedabad.jpg",
  jaipur: "/images/cities/jaipur.jpg",
  noida: "/images/cities/noida.jpg",
  lucknow: "/images/cities/lucknow.jpg",
  indore: "/images/cities/indore.jpg",
};

export function PopularCitiesGrid({ cities }: { cities: PopularCityCard[] }) {
  if (!cities.length) return null;
  return (
    <div className="location-grid city-directory-popular">
      {cities.map((place) => {
        const image = POPULAR_CITY_IMAGES[place.slug];
        return (
          <Link
            key={place.slug}
            href={`/locations/${encodeURIComponent(place.slug)}/`}
            prefetch={false}
          >
            {image ? (
              <img src={image} alt="" width={48} height={48} />
            ) : null}
            <div>
              <h3>{place.city}</h3>
              <p>{place.state}</p>
            </div>
            <ArrowRight size={17} />
          </Link>
        );
      })}
    </div>
  );
}
