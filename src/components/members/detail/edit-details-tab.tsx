// src/components/members/detail/edit-details-tab.tsx
"use client";

import { useActionState, useEffect } from "react";
import { MembershipStatus, type Instructor } from "@prisma/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateMember, deleteMember } from "@/actions/member-actions";
import { Portal } from "@/components/ui/portal";
import { useState, useTransition } from "react";
import type { ActionState } from "@/types";

type MemberData = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  membershipStatus: MembershipStatus;
  joinedAt: Date;
  instructorId: string | null;
  instructor: Instructor | null;
};

const initialState: ActionState = { success: false, message: "" };

const inputClass =
  "w-full bg-[#f5f3f0] border border-[#e0ddd5] rounded-lg px-3 py-2 text-sm text-[#2d2b45] placeholder:text-[#c0bcc8] outline-none focus:ring-2 focus:ring-[#4a3d72]/20 focus:border-[#4a3d72] transition-all";
const labelClass = "block text-xs text-[#7a7887] mb-1.5 font-medium";

interface Props {
  member: MemberData;
  instructors: Instructor[];
}

export function EditDetailsTab({ member, instructors }: Props) {
  const router = useRouter();
  const boundAction = updateMember.bind(null, member.id);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      router.refresh();
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, router]);

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteMember(member.id);
      if (result.success) {
        toast.success("Member deleted.");
        router.push("/admin/members");
      } else {
        toast.error(result.message);
      }
    });
  }

  const joinedAt = new Date(member.joinedAt).toISOString().split("T")[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Edit form */}
      <div className="bg-white rounded-2xl border border-[#e0ddd5] p-6">
        <div className="text-sm font-medium text-[#2d2b45] mb-5">Member details</div>
        <form action={formAction} className="space-y-0">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelClass}>Full name</label>
              <input name="name" required defaultValue={member.name} className={inputClass} />
              {state.errors?.name && <p className="text-xs text-red-500 mt-1">{state.errors.name[0]}</p>}
            </div>
            <div>
              <label className={labelClass}>Phone number</label>
              <input name="phone" required defaultValue={member.phone ?? ""} placeholder="098-655-8888" className={inputClass} />
              {state.errors?.phone && <p className="text-xs text-red-500 mt-1">{state.errors.phone[0]}</p>}
            </div>
            <div>
              <label className={labelClass}>
                Email address <span className="text-[#a09aad] font-normal">(optional)</span>
              </label>
              <input name="email" type="email" defaultValue={member.email ?? ""} placeholder="name@example.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Membership status</label>
              <select name="membershipStatus" defaultValue={member.membershipStatus} className={inputClass}>
                <option value={MembershipStatus.ACTIVE}>Active</option>
                <option value={MembershipStatus.INACTIVE}>Inactive</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Instructor <span className="text-[#a09aad] font-normal">(optional)</span></label>
              <select name="instructorId" defaultValue={member.instructorId ?? ""} className={inputClass}>
                <option value="">— No instructor —</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Join date</label>
              <input name="joinedAt" type="date" required defaultValue={joinedAt} className={inputClass} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#f0ede8]">
            <button
              type="button"
              onClick={() => router.push("/admin/members")}
              className="px-5 py-2 rounded-full border border-[#e0ddd5] text-xs text-[#7a7887] hover:bg-[#f5f3f0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-full bg-[#4a3d72] hover:bg-[#3a2f5c] text-white text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-200 p-6">
        <div className="text-sm font-medium text-red-600 mb-1">Danger zone</div>
        <div className="text-xs text-[#a09aad] mb-4">
          Permanently delete this member and all associated photos. This action cannot be undone.
        </div>
        <button
          onClick={() => setDeleteOpen(true)}
          className="px-4 py-2 rounded-full border border-red-200 text-red-600 text-xs hover:bg-red-50 transition-colors"
        >
          Delete member
        </button>
      </div>

      {/* Confirm delete modal */}
      {deleteOpen && (
        <Portal>
          <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteOpen(false)} />
            <div className="relative bg-white rounded-2xl border border-[#e0ddd5] shadow-xl p-6 w-full max-w-sm mx-4">
              <h3 className="font-serif text-lg text-[#2d2b45] mb-2">Delete {member.name}?</h3>
              <p className="text-sm text-[#7a7887] mb-6">
                This will permanently delete this member and all associated photos. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteOpen(false)} disabled={isDeleting}
                  className="flex-1 border border-[#e0ddd5] text-[#7a7887] rounded-full py-2 text-sm hover:bg-[#f5f3f0] transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-full py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isDeleting ? "Deleting…" : "Yes, delete"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}