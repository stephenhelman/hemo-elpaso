import type { AdminWithPermissions } from "@/lib/permissions";

/**
 * Attendee emails and phone numbers (event stats, attendance report, their CSVs) are visible to the same people who
 * can open the Patients directory: President and Vice President (canManageUsers). Every other canViewEventStats role
 * (Secretary, Treasurer, Events Coordinator, Sponsor Liaison) sees names, counts and roles only.
 *
 * The split is enforced HERE, on the server, before data is handed to a client component: a masked row never
 * contains the values, so nothing can be revealed in the browser or in an export.
 */
export const canSeeAttendeeContact = (admin: Pick<AdminWithPermissions, "can">) => admin.can("canManageUsers");

export function maskAttendeeContact<T extends { email?: string | null; phone?: string | null }>(row: T, allowed: boolean): T {
  return allowed ? row : { ...row, email: null, phone: null };
}
