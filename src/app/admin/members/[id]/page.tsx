// src/app/admin/members/[id]/page.tsx
import { notFound } from "next/navigation";
import { getMemberById } from "@/actions/member-actions";
import { getInstructors } from "@/actions/instructor-actions";
import { getMemberHealthProfile } from "@/actions/health-actions";
import { MemberDetailShell } from "@/components/members/detail/member-detail-shell";

interface Props { params: Promise<{ id: string }> }

export const dynamic = "force-dynamic";

export default async function MemberDetailPage({ params }: Props) {
  const { id } = await params;
  const [member, instructors, healthProfile] = await Promise.all([
    getMemberById(id),
    getInstructors(),
    getMemberHealthProfile(id),
  ]);

  if (!member) notFound();

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <MemberDetailShell
        member={member}
        instructors={instructors}
        healthProfile={healthProfile}
      />
    </div>
  );
}