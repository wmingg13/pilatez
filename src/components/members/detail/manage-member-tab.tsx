// src/components/members/detail/manage-member-tab.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { deleteMember } from "@/actions/member-actions";
import { Portal } from "@/components/ui/portal";

interface Props {
  memberId: string;
  memberName: string;
}

export function ManageMemberTab({ memberId, memberName }: Props) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDelete]   = useTransition();

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteMember(memberId);
      if (result.success) {
        toast.success("Member deleted.");
        router.push("/admin/members");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div>
      <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-red-100">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-sm font-medium text-red-600">Danger zone</span>
        </div>
        <div className="px-5 py-5">
          <div className="text-sm font-medium text-[#2d2b45] mb-1">Delete this member</div>
          <div className="text-xs text-[#a09aad] mb-5 leading-relaxed">
            Permanently deletes <span className="text-[#2d2b45] font-medium">{memberName}</span> and
            all associated photos, health profile, and records.
            This action cannot be undone.
          </div>
          <button
            onClick={() => setDeleteOpen(true)}
            className="px-4 py-2 rounded-full border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
          >
            Delete member
          </button>
        </div>
      </div>

      {deleteOpen && (
        <Portal>
          <div style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div
              style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.3)" }}
              onClick={() => !isDeleting && setDeleteOpen(false)}
            />
            <div className="relative bg-white rounded-2xl border border-[#e0ddd5] p-6 w-full max-w-sm mx-4">
              <h3 className="font-serif text-lg text-[#2d2b45] mb-2">Delete {memberName}?</h3>
              <p className="text-sm text-[#7a7887] mb-6 leading-relaxed">
                This will permanently delete this member and all their associated data.
                This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 border border-[#e0ddd5] text-[#7a7887] rounded-full py-2 text-sm hover:bg-[#f5f3f0] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-full py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
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