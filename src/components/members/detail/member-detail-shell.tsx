// src/components/members/detail/member-detail-shell.tsx
"use client";

import { useState } from "react";
import { MembershipStatus, PilatesExperience, type Instructor } from "@prisma/client";
import { initials, avatarColor, formatDate } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { OverviewTab } from "./overview-tab";
import { ViewCompareTab } from "./view-compare-tab";
import { EditPhotosTab } from "./edit-photos-tab";
import { ManageMemberTab } from "./manage-member-tab";
import { FitnessReportTab } from "./fitness-report-tab";
import { UploadModal } from "./upload-modal";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type MemberWithInstructor = {
  id: string; name: string; phone: string | null; email: string | null;
  age: number | null; remarks: string | null;
  membershipStatus: MembershipStatus; joinedAt: Date;
  instructorId: string | null; instructor: Instructor | null;
};

type HealthProfile = {
  pilatesExperience: PilatesExperience | null;
  fitnessGoal: string | null; physicalConsiderations: string | null;
  currentMedications: string | null; currentInjuries: string | null;
  pastSurgeries: string | null;
  condHerniatedDisk: boolean; condHighBloodPressure: boolean;
  condDiabetes: boolean; condHypoglycemia: boolean; condNumbness: boolean;
  condBackpain: boolean; condOsteoporosis: boolean; condPregnancy: boolean;
  condVertigo: boolean; condShoulderImpingement: boolean; condStenosis: boolean;
  condScoliosis: boolean; condCarpalTunnel: boolean; condCancer: boolean;
  assessmentSummary: string | null; trainingPlan: string | null;
} | null;

type TabKey = "overview" | "front" | "back" | "left" | "right" | "fitnessreport" | "editphotos" | "manage";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview",   label: "Overview" },
  { key: "front",      label: "Front" },
  { key: "back",       label: "Back" },
  { key: "left",       label: "Left" },
  { key: "right",      label: "Right" },
  { key: "fitnessreport", label: "Fitness Report" },
  { key: "editphotos", label: "Edit Photos" },
  { key: "manage",     label: "Manage Member" },
];

interface Props {
  member: MemberWithInstructor;
  instructors: Instructor[];
  healthProfile: HealthProfile;
}

export function MemberDetailShell({ member, instructors, healthProfile }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab]     = useState<TabKey>("overview");
  const [refreshKey, setRefreshKey]   = useState(0);
  const [uploadModal, setUploadModal] = useState<{ open: boolean; defaultView: string }>({
    open: false, defaultView: "Front",
  });

  const VIEW_TABS: TabKey[] = ["front", "back", "left", "right"];
  const viewLabel = TABS.find((t) => t.key === activeTab)?.label ?? "";

  function openUpload(view: string) {
    setUploadModal({ open: true, defaultView: view });
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/admin/members" className="flex items-center gap-1.5 text-xs text-[#a09aad] hover:text-[#2d2b45] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Members
        </Link>
        <span className="text-[#d0cdd8] text-xs">›</span>
        <span className="text-xs text-[#2d2b45] font-medium">{member.name}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-[#e0ddd5] px-6 py-5 flex items-center gap-4 mb-4">
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0", avatarColor(member.id))}>
          {initials(member.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-medium text-[#2d2b45]">{member.name}</div>
          <div className="text-xs text-[#a09aad] mt-0.5">
            {member.phone}{member.email ? ` · ${member.email}` : ""}
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className={cn("text-[10px] px-2.5 py-0.5 rounded-full font-medium",
              member.membershipStatus === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-[#e8e5ec] text-[#7a7887]")}>
              {member.membershipStatus === "ACTIVE" ? "Active" : "Inactive"}
            </span>
            {member.instructor && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#f0edf8] text-[#4a3d72] font-medium">
                {member.instructor.name}
              </span>
            )}
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#f5f3f0] text-[#7a7887]">
              Joined {formatDate(member.joinedAt)}
            </span>
          </div>
        </div>
        <div className="hidden sm:flex gap-6 flex-shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-[#a09aad] uppercase tracking-widest mb-1">Instructor</div>
            <div className="text-sm font-medium text-[#2d2b45]">{member.instructor?.name ?? "—"}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[#a09aad] uppercase tracking-widest mb-1">Status</div>
            <div className={cn("text-sm font-medium", member.membershipStatus === "ACTIVE" ? "text-emerald-600" : "text-[#7a7887]")}>
              {member.membershipStatus === "ACTIVE" ? "Active" : "Inactive"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[#a09aad] uppercase tracking-widest mb-1">Joined</div>
            <div className="text-sm font-medium text-[#2d2b45]">{formatDate(member.joinedAt)}</div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex bg-[#e0ddd5] rounded-xl p-1 gap-0.5 mb-4 w-fit flex-wrap">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs transition-colors whitespace-nowrap",
              activeTab === key
                ? "bg-white text-[#2d2b45] font-medium shadow-sm"
                : "text-[#7a7887] hover:text-[#2d2b45]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab
          member={member}
          instructors={instructors}
          healthProfile={healthProfile}
          onMemberUpdated={() => router.refresh()}
        />
      )}
      {VIEW_TABS.includes(activeTab) && (
        <ViewCompareTab
          memberId={member.id}
          view={viewLabel}
          onUpload={() => openUpload(viewLabel)}
          refreshKey={refreshKey}
        />
      )}
      {activeTab === "editphotos" && (
        <EditPhotosTab
          memberId={member.id}
          onUpload={() => openUpload("Front")}
          refreshKey={refreshKey}
        />
      )}
      {activeTab === "fitnessreport" && (
        <FitnessReportTab
          member={member}
          healthProfile={healthProfile}
        />
      )}
      {activeTab === "manage" && (
        <ManageMemberTab memberId={member.id} memberName={member.name} />
      )}

      <UploadModal
        open={uploadModal.open}
        defaultView={uploadModal.defaultView}
        memberId={member.id}
        onClose={() => setUploadModal((s) => ({ ...s, open: false }))}
        onUploaded={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}