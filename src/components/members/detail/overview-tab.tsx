// src/components/members/detail/overview-tab.tsx
"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { MembershipStatus, PilatesExperience, type Instructor } from "@prisma/client";
import { Pencil, Loader2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/helpers";
import { toast } from "sonner";
import { updateMember } from "@/actions/member-actions";
import { updateHealthProfile, updateInstructorNotes } from "@/actions/health-actions";

// ─── Types ───────────────────────────────────────────────────────────────────

type MemberData = {
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

interface Props {
  member: MemberData;
  instructors: Instructor[];
  healthProfile: HealthProfile;
  onMemberUpdated: () => void;
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const inputCls = "w-full bg-[#f5f3f0] border border-[#e0ddd5] rounded-lg px-3 py-2 text-sm text-[#2d2b45] placeholder:text-[#c0bcc8] outline-none focus:ring-2 focus:ring-[#4a3d72]/20 focus:border-[#4a3d72] transition-all";
const labelCls = "block text-[10px] text-[#a09aad] uppercase tracking-wider font-medium mb-1.5";
const valueCls = "text-sm text-[#2d2b45] leading-relaxed";
const naCls    = "text-sm text-[#c0bcc8] italic";

const EXPERIENCE_LABELS: Record<PilatesExperience, string> = {
  NONE:               "None",
  LESS_THAN_6_MONTHS: "Less than 6 months",
  ONE_TO_THREE_YEARS: "1 – 3 years",
  MORE_THAN_3_YEARS:  "More than 3 years",
};

const CONDITIONS: { key: keyof NonNullable<HealthProfile>; label: string }[] = [
  { key: "condHerniatedDisk",       label: "Herniated disk" },
  { key: "condHighBloodPressure",   label: "High blood pressure" },
  { key: "condDiabetes",            label: "Diabetes" },
  { key: "condHypoglycemia",        label: "Hypoglycemia" },
  { key: "condNumbness",            label: "Numbness" },
  { key: "condBackpain",            label: "Backpain" },
  { key: "condOsteoporosis",        label: "Osteoporosis" },
  { key: "condPregnancy",           label: "Pregnancy (current)" },
  { key: "condVertigo",             label: "Vertigo" },
  { key: "condShoulderImpingement", label: "Shoulder impingement" },
  { key: "condStenosis",            label: "Stenosis" },
  { key: "condScoliosis",           label: "Scoliosis" },
  { key: "condCarpalTunnel",        label: "Carpal tunnel syndrome" },
  { key: "condCancer",              label: "Cancer" },
];

// ─── Section wrapper with pen/save/cancel ────────────────────────────────────

function SectionCard({
  title, dot = true, editing, onEdit, onSave, onCancel, saving, children,
}: {
  title: string; dot?: boolean; editing: boolean;
  onEdit: () => void; onSave: () => void; onCancel: () => void;
  saving: boolean; children: React.ReactNode;
}) {
  return (
    <div className={cn(
      "bg-white rounded-2xl border transition-colors",
      editing ? "border-[#c4bdd8]" : "border-[#e0ddd5]"
    )}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0ede8]">
        <div className="flex items-center gap-2">
          {dot && <div className="w-1.5 h-1.5 rounded-full bg-[#4a3d72] flex-shrink-0" />}
          <span className="text-sm font-medium text-[#2d2b45]">{title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {editing ? (
            <>
              <button
                onClick={onCancel}
                disabled={saving}
                className="w-7 h-7 rounded-lg border border-[#e0ddd5] bg-white flex items-center justify-center text-[#a09aad] hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="h-7 px-3 rounded-lg bg-[#4a3d72] hover:bg-[#3a2f5c] text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          ) : (
            <button
              onClick={onEdit}
              className="w-7 h-7 rounded-lg border border-[#e0ddd5] bg-white flex items-center justify-center text-[#a09aad] hover:border-[#c4bdd8] hover:text-[#4a3d72] hover:bg-[#f5f3fb] transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// ─── Checkbox row ─────────────────────────────────────────────────────────────

function ConditionBox({ label, checked, editing, onChange }: {
  label: string; checked: boolean; editing: boolean; onChange?: (v: boolean) => void;
}) {
  return (
    <label className={cn("flex items-center gap-2 text-xs text-[#2d2b45]", editing && "cursor-pointer select-none")}>
      <div
        onClick={editing ? () => onChange?.(!checked) : undefined}
        className={cn(
          "w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 transition-colors",
          checked ? "bg-[#4a3d72] border border-[#4a3d72]" : "border border-[#d0cdd8]",
          editing && !checked && "bg-[#f5f3f0]",
          !editing && !checked && "bg-white",
        )}
      >
        {checked && (
          <svg className="w-2 h-2" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 10 10">
            <polyline points="2,5 4,7 8,3" />
          </svg>
        )}
      </div>
      {label}
    </label>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OverviewTab({ member, instructors, healthProfile, onMemberUpdated }: Props) {

  // ── Member info section ──
  const [infoEditing, setInfoEditing]   = useState(false);
  const [infoSaving, startInfoSave]     = useTransition();
  const infoFormRef = useRef<HTMLFormElement>(null);

  // ── Health section ──
  const [healthEditing, setHealthEditing] = useState(false);
  const [healthSaving, startHealthSave]   = useTransition();
  const healthFormRef = useRef<HTMLFormElement>(null);
  const [conditions, setConditions]       = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CONDITIONS.map(({ key }) => [key, !!(healthProfile as Record<string, unknown>)?.[key]]))
  );

  // ── Notes section ──
  const [notesEditing, setNotesEditing] = useState(false);
  const [notesSaving, startNotesSave]   = useTransition();
  const notesFormRef = useRef<HTMLFormElement>(null);

  // Reset conditions when health profile changes
  useEffect(() => {
    setConditions(Object.fromEntries(
      CONDITIONS.map(({ key }) => [key, !!(healthProfile as Record<string, unknown>)?.[key]])
    ));
  }, [healthProfile]);

  // ── Save handlers ──

  function saveInfo() {
    if (!infoFormRef.current) return;
    const fd = new FormData(infoFormRef.current);
    startInfoSave(async () => {
      const result = await updateMember(member.id, { success: false, message: "" }, fd);
      if (result.success) {
        toast.success("Member information updated.");
        setInfoEditing(false);
        onMemberUpdated();
      } else {
        toast.error(result.message || "Failed to update.");
      }
    });
  }

  function saveHealth() {
    if (!healthFormRef.current) return;
    const fd = new FormData(healthFormRef.current);
    CONDITIONS.forEach(({ key }) => fd.set(key, conditions[key] ? "true" : "false"));
    startHealthSave(async () => {
      const result = await updateHealthProfile(member.id, fd);
      if (result.success) {
        toast.success("Health profile updated.");
        setHealthEditing(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  function saveNotes() {
    if (!notesFormRef.current) return;
    const fd = new FormData(notesFormRef.current);
    startNotesSave(async () => {
      const result = await updateInstructorNotes(member.id, fd);
      if (result.success) {
        toast.success("Instructor notes updated.");
        setNotesEditing(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  const hp = healthProfile;
  const joinedAt = new Date(member.joinedAt).toISOString().split("T")[0];

  return (
    <div className="flex flex-col gap-4">

      {/* ── Member information ── */}
      <SectionCard
        title="Member information"
        editing={infoEditing}
        onEdit={() => setInfoEditing(true)}
        onSave={saveInfo}
        onCancel={() => setInfoEditing(false)}
        saving={infoSaving}
      >
        {infoEditing ? (
          <form ref={infoFormRef} className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Full name</label>
              <input name="name" required defaultValue={member.name} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone number</label>
              <input name="phone" required defaultValue={member.phone ?? ""} placeholder="098-655-8888" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email address <span className="normal-case font-normal">(optional)</span></label>
              <input name="email" type="email" defaultValue={member.email ?? ""} placeholder="name@example.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Age <span className="normal-case font-normal">(optional)</span></label>
              <input name="age" type="number" min={1} max={120} defaultValue={member.age ?? ""} placeholder="e.g. 32" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Membership status</label>
              <select name="membershipStatus" defaultValue={member.membershipStatus} className={inputCls}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Instructor <span className="normal-case font-normal">(optional)</span></label>
              <select name="instructorId" defaultValue={member.instructorId ?? ""} className={inputCls}>
                <option value="">— No instructor —</option>
                {instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Join date</label>
              <input name="joinedAt" type="date" required defaultValue={joinedAt} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Remarks <span className="normal-case font-normal">(optional)</span></label>
              <textarea name="remarks" rows={3} defaultValue={member.remarks ?? ""} placeholder="Sticky note — any admin notes about this member…" className={inputCls} />
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {[
              { label: "Full name",          value: member.name },
              { label: "Phone number",       value: member.phone },
              { label: "Email address",      value: member.email },
              { label: "Age",                value: member.age ? `${member.age} years old` : null },
              { label: "Membership status",  value: member.membershipStatus === "ACTIVE" ? "Active" : "Inactive" },
              { label: "Instructor",         value: member.instructor?.name ?? "—" },
              { label: "Join date",          value: formatDate(member.joinedAt) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className={labelCls}>{label}</div>
                <div className={value ? valueCls : naCls}>{value || "—"}</div>
              </div>
            ))}
            {/* Remarks — full width sticky note */}
            <div className="col-span-2">
              <div className={labelCls}>Remarks</div>
              <div className={cn(
                "text-sm leading-relaxed whitespace-pre-wrap rounded-lg px-3 py-2.5 mt-0.5",
                member.remarks
                  ? "bg-[#fdfcf7] border border-[#e8e5d8] text-[#2d2b45]"
                  : "text-[#c0bcc8] italic"
              )}>
                {member.remarks || "No remarks"}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Health & fitness history ── */}
      <SectionCard
        title="Health & fitness history"
        editing={healthEditing}
        onEdit={() => setHealthEditing(true)}
        onSave={saveHealth}
        onCancel={() => {
          setHealthEditing(false);
          setConditions(Object.fromEntries(
            CONDITIONS.map(({ key }) => [key, !!(healthProfile as Record<string, unknown>)?.[key]])
          ));
        }}
        saving={healthSaving}
      >
        {healthEditing ? (
          <form ref={healthFormRef} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Past pilates experience</label>
                <select name="pilatesExperience" defaultValue={hp?.pilatesExperience ?? ""} className={inputCls}>
                  <option value="">— Select —</option>
                  <option value="NONE">None</option>
                  <option value="LESS_THAN_6_MONTHS">Less than 6 months</option>
                  <option value="ONE_TO_THREE_YEARS">1 – 3 years</option>
                  <option value="MORE_THAN_3_YEARS">More than 3 years</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Personal fitness goal</label>
                <textarea name="fitnessGoal" rows={3} defaultValue={hp?.fitnessGoal ?? ""} placeholder="Improve core stability, increase flexibility, or post-rehab strength…" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Physical considerations & injuries</label>
              <textarea name="physicalConsiderations" rows={2} defaultValue={hp?.physicalConsiderations ?? ""} placeholder="Occasional lower back stiffness, limited shoulder mobility…" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Current medications</label>
                <textarea name="currentMedications" rows={2} defaultValue={hp?.currentMedications ?? ""} placeholder="None, or list medications affecting heart rate or balance…" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Current or past injuries</label>
                <textarea name="currentInjuries" rows={2} defaultValue={hp?.currentInjuries ?? ""} placeholder="Torn ACL (2022), chronic wrist strain from typing…" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Past or recent surgeries</label>
              <textarea name="pastSurgeries" rows={2} defaultValue={hp?.pastSurgeries ?? ""} placeholder="Knee arthroscopy (Jan 2024), C-section (3 years ago)…" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Medical conditions — select all that apply</label>
              <div className="grid grid-cols-3 gap-y-2.5 gap-x-4 mt-1">
                {CONDITIONS.map(({ key, label }) => (
                  <ConditionBox
                    key={key} label={label} editing
                    checked={conditions[key] ?? false}
                    onChange={(v) => setConditions((prev) => ({ ...prev, [key]: v }))}
                  />
                ))}
              </div>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <div className={labelCls}>Past pilates experience</div>
                <div className={hp?.pilatesExperience ? valueCls : naCls}>
                  {hp?.pilatesExperience ? EXPERIENCE_LABELS[hp.pilatesExperience] : "N/A"}
                </div>
              </div>
              <div>
                <div className={labelCls}>Personal fitness goal</div>
                <div className={hp?.fitnessGoal ? valueCls : naCls}>{hp?.fitnessGoal || "N/A"}</div>
              </div>
            </div>
            <div>
              <div className={labelCls}>Physical considerations & injuries</div>
              <div className={hp?.physicalConsiderations ? valueCls : naCls}>{hp?.physicalConsiderations || "N/A"}</div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <div className={labelCls}>Current medications</div>
                <div className={hp?.currentMedications ? valueCls : naCls}>{hp?.currentMedications || "N/A"}</div>
              </div>
              <div>
                <div className={labelCls}>Current or past injuries</div>
                <div className={hp?.currentInjuries ? valueCls : naCls}>{hp?.currentInjuries || "N/A"}</div>
              </div>
            </div>
            <div>
              <div className={labelCls}>Past or recent surgeries</div>
              <div className={hp?.pastSurgeries ? valueCls : naCls}>{hp?.pastSurgeries || "N/A"}</div>
            </div>
            <div>
              <div className={labelCls}>Medical conditions</div>
              <div className="grid grid-cols-3 gap-y-2 gap-x-4 mt-1.5">
                {CONDITIONS.map(({ key, label }) => (
                  <ConditionBox key={key} label={label} editing={false}
                    checked={!!(hp as Record<string, unknown>)?.[key]} />
                ))}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Instructor notes ── */}
      <SectionCard
        title="Instructor notes"
        editing={notesEditing}
        onEdit={() => setNotesEditing(true)}
        onSave={saveNotes}
        onCancel={() => setNotesEditing(false)}
        saving={notesSaving}
      >
        {notesEditing ? (
          <form ref={notesFormRef} className="flex flex-col gap-4">
            <div>
              <label className={labelCls}>Assessment summary</label>
              <textarea name="assessmentSummary" rows={3} defaultValue={hp?.assessmentSummary ?? ""}
                placeholder="Forward head posture noted; limited thoracic rotation; strong core engagement but hip flexors appear tight…"
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Training plan</label>
              <textarea name="trainingPlan" rows={4} defaultValue={hp?.trainingPlan ?? ""}
                placeholder="Focus on posterior chain activation and spinal decompression. Phase 1: Breathing & Alignment (Weeks 1–4)…"
                className={inputCls} />
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <div className={labelCls}>Assessment summary</div>
              <div className={hp?.assessmentSummary ? valueCls : naCls}>{hp?.assessmentSummary || "N/A"}</div>
            </div>
            <div>
              <div className={labelCls}>Training plan</div>
              <div className={hp?.trainingPlan ? valueCls : naCls}>{hp?.trainingPlan || "N/A"}</div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}