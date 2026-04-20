// src/app/admin/instructors/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getInstructors } from "@/actions/instructor-actions";
import { InstructorsPanel } from "@/components/instructors/instructors-panel";

export const dynamic = "force-dynamic";

export default async function InstructorsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "MASTER_ADMIN") redirect("/admin/members");

  const instructors = await getInstructors();

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <h1 className="font-serif text-3xl text-[#2d2b45] mb-2 tracking-tight">
        Instructors
      </h1>
      <p className="text-sm text-[#a09aad] mb-6">
        Manage instructor names available for member assignment.
      </p>
      <InstructorsPanel instructors={instructors} />
    </div>
  );
}