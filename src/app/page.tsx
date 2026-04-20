// src/app/page.tsx
// Root route — redirect everyone to /login.
// The middleware then bounces authenticated users into /admin/members.
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/login");
}