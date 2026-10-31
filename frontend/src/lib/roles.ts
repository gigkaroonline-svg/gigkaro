export const staffRoles = ["admin", "hiring_manager", "recruiter"] as const;

export type AppRole =
  | "candidate"
  | "employer"
  | (typeof staffRoles)[number];

export function isStaffRole(role?: string | null): boolean {
  return !!role && (staffRoles as readonly string[]).includes(role);
}

export function staffHome(role?: string | null) {
  if (role === "admin") return "/admin";
  if (role === "hiring_manager" || role === "recruiter")
    return "/admin/applications";
  if (role === "employer") return "/employer";
  return "/candidate";
}

export function roleLabel(role?: string | null) {
  if (role === "hiring_manager") return "Hiring manager";
  if (role === "recruiter") return "Recruiter";
  if (role === "admin") return "Admin";
  if (role === "employer") return "Employer";
  if (role === "candidate") return "Candidate";
  return "Staff";
}
