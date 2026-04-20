// src/app/admin/members/page.tsx
import { getMembers } from "@/actions/member-actions";
import { getInstructors } from "@/actions/instructor-actions";
import { MembersTable } from "@/components/members/members-table";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const [members, instructors] = await Promise.all([getMembers(), getInstructors()]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="font-serif text-3xl text-[#2d2b45] mb-6 tracking-tight">
        Members
      </h1>
      <MembersTable members={members} instructors={instructors} />
    </div>
  );
}