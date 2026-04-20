// src/components/members/edit-member-form.tsx
"use client";

import { useActionState, useEffect } from "react";
import { MembershipStatus, type Instructor } from "@prisma/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateMember } from "@/actions/member-actions";
import type { ActionState } from "@/types";

type MemberWithInstructor = {
  id: string; name: string; phone: string | null; email: string | null;
  membershipStatus: MembershipStatus; joinedAt: Date; instructorId: string | null;
};

const initialState: ActionState = { success: false, message: "" };

const inputClass =
  "w-full bg-[#f5f3f0] border border-[#e0ddd5] rounded-lg px-3 py-2 text-sm text-[#2d2b45] placeholder:text-[#c0bcc8] outline-none focus:ring-2 focus:ring-[#4a3d72]/20 focus:border-[#4a3d72] transition-all";
const labelClass = "block text-sm text-[#4a4758] mb-1.5 font-medium";
const errorClass = "text-xs text-red-500 mt-1";

interface EditMemberFormProps {
  member: MemberWithInstructor;
  instructors: Instructor[];
}

export function EditMemberForm({ member, instructors }: EditMemberFormProps) {
  const router = useRouter();
  const boundAction = updateMember.bind(null, member.id);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      router.push("/admin/members");
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, router]);

  const joinedAt = new Date(member.joinedAt).toISOString().split("T")[0];

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className={labelClass}>Full Name</label>
        <input id="name" name="name" required defaultValue={member.name} className={inputClass} />
        {state.errors?.name && <p className={errorClass}>{state.errors.name[0]}</p>}
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>Phone Number</label>
        <input id="phone" name="phone" required defaultValue={member.phone ?? ""} placeholder="098-655-8888" className={inputClass} />
        {state.errors?.phone && <p className={errorClass}>{state.errors.phone[0]}</p>}
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email Address <span className="text-[#a09aad] font-normal">(optional)</span>
        </label>
        <input id="email" name="email" type="email" defaultValue={member.email ?? ""} placeholder="juliette@example.com" className={inputClass} />
        {state.errors?.email && <p className={errorClass}>{state.errors.email[0]}</p>}
      </div>

      <div>
        <label htmlFor="membershipStatus" className={labelClass}>Membership Status</label>
        <select id="membershipStatus" name="membershipStatus" defaultValue={member.membershipStatus} className={inputClass}>
          <option value={MembershipStatus.ACTIVE}>Active</option>
          <option value={MembershipStatus.INACTIVE}>Inactive</option>
        </select>
      </div>

      <div>
        <label htmlFor="instructorId" className={labelClass}>
          Instructor <span className="text-[#a09aad] font-normal">(optional)</span>
        </label>
        <select id="instructorId" name="instructorId" defaultValue={member.instructorId ?? ""} className={inputClass}>
          <option value="">— No instructor —</option>
          {instructors.map((ins) => (
            <option key={ins.id} value={ins.id}>{ins.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="joinedAt" className={labelClass}>Join Date</label>
        <input id="joinedAt" name="joinedAt" type="date" required defaultValue={joinedAt} className={inputClass} />
        {state.errors?.joinedAt && <p className={errorClass}>{state.errors.joinedAt[0]}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.push("/admin/members")}
          className="flex-1 border border-[#e0ddd5] text-[#7a7887] rounded-full py-2.5 text-sm hover:bg-[#f5f3f0] transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={isPending}
          className="flex-1 bg-[#4a3d72] hover:bg-[#3a2f5c] disabled:opacity-60 text-white rounded-full py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}