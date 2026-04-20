// src/components/members/delete-dialog.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { deleteMember } from "@/actions/member-actions";
import { Portal } from "@/components/ui/portal";

export function DeleteDialog({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteMember(id);
      if (result.success) {
        toast.success(`${name} has been removed.`);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-md text-[#a09aad] hover:text-red-500 hover:bg-red-50 transition-colors"
        title="Delete member"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {open && (
        <Portal>
          <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => !isPending && setOpen(false)}
            />
            <div className="relative bg-white rounded-2xl border border-[#e0ddd5] shadow-xl p-6 w-full max-w-sm mx-4">
              <h3 className="font-serif text-lg text-[#2d2b45] mb-2">
                Remove {name}?
              </h3>
              <p className="text-sm text-[#7a7887] mb-6">
                This will permanently delete this member record. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="flex-1 border border-[#e0ddd5] text-[#7a7887] rounded-full py-2 text-sm hover:bg-[#f5f3f0] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-full py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isPending ? "Deleting…" : "Yes, delete"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
