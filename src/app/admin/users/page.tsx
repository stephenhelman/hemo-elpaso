import { redirect } from "next/navigation";

// The users directory became the Patients list.
export default function AdminUsersRedirect() {
  redirect("/admin/patients");
}
