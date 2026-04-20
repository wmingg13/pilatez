// src/app/admin/page.tsx
import { redirect } from "next/navigation";

// /admin just redirects to the members list
export default function AdminPage() {
  redirect("/admin/members");
}
