import { redirect } from "next/navigation";

// /admin has no page of its own; the login link uses returnTo=/admin.
// Access is enforced by src/middleware.ts before this runs.
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
