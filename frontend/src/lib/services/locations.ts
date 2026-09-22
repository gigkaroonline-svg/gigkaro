import { locations } from "@/data/locations";
export const getLocations = () => locations;
export const getPopularLocations = () =>
  locations.filter(
    (l, i, all) => all.findIndex((v) => v.city === l.city) === i,
  );
export const getLocationByPincode = (pincode: string) =>
  locations.find((l) => l.pincode === pincode);
