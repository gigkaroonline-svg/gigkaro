export const staffRoles = ["admin", "hiring_manager", "recruiter"] as const;

export type StaffRole = (typeof staffRoles)[number];

export const userRoles = [
  "candidate",
  "employer",
  "admin",
  "hiring_manager",
  "recruiter",
] as const;

export type UserRole = (typeof userRoles)[number];

export function isStaffRole(role: string | undefined | null): role is StaffRole {
  return !!role && (staffRoles as readonly string[]).includes(role);
}

export const recruiterStatuses = ["Applied", "Contacted", "Interview"] as const;
