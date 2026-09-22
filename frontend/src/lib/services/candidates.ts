import type { Application } from "@/types";
import type { Profile } from "@/hooks/use-demo-store";
export function getApplications(applications: Application[]) {
  return applications;
}
export function getProfileCompletion(profile: Profile) {
  const fields = [
    profile.name,
    profile.mobile,
    profile.email,
    profile.pincode,
    profile.city,
    profile.category,
    profile.vehicle,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}
export const applicationStatuses = [
  "Applied",
  "Contacted",
  "Interview",
  "Selected",
  "Joined",
] as const;
