// src/components/instructors/instructors-panel.tsx
"use client";

import { useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { createInstructor, deleteInstructor } from "@/actions/instructor-actions";
import type { ActionState } from "@/types";
import type { Instructor } from "@prisma/client";

type InstructorWithCount = Instructor & { _count: { members: number } };

const initialState: ActionState = { success: false, message: "" };

const inputClass =
  "flex-1 bg-[#f5f3f0] border border-[#e0ddd5] rounded-lg px-3 py-2 text-sm text-[#2d2b45] placeholder:text-[#c0bcc8] outline-none focus:ring-2 focus:ring-[#4a3d72]/20 focus:border-[#4a3d72] transition-all";

export function InstructorsPanel({ instructors }: { instructors: InstructorWithCount[] }) {
  const [state, formAction, isPending] = useActionState(createInstructor, initialState);
  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    if (state.success) toast.success(state.message);
    else if (state.message && !state.success) toast.error(state.message);
  }, [state]);

  function handleDelete(id: string, name: string) {
    startDelete(async () => {
      const result = await deleteInstructor(id);
      if (result.success) toast.success(`${name} removed.`);
      else toast.error(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Add form */}
      <div className="bg-white rounded-xl border border-[#e8e5dc] p-5">
        <p className="text-sm font-medium text-[#2d2b45] mb-3">Add Instructor</p>
        <form action={formAction} className="flex gap-2">
          <input
            name="name"
            required
            placeholder="e.g. Sarah Tan"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-1.5 bg-[#4a3d72] hover:bg-[#3a2f5c] disabled:opacity-60 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap"
          >
            {isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <UserPlus className="h-4 w-4" />}
            Add
          </button>
        </form>
        {state.errors?.name && (
          <p className="text-xs text-red-500 mt-1">{state.errors.name[0]}</p>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-[#e8e5dc] overflow-hidden">
        {instructors.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#a09aad]">
            No instructors yet. Add one above.
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#4a3d72]">
                <th className="px-5 py-3 text-left text-[10px] font-medium text-white/85 uppercase tracking-widest">Name</th>
                <th className="px-5 py-3 text-left text-[10px] font-medium text-white/85 uppercase tracking-widest">Members</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {instructors.map((instructor, i) => (
                <tr
                  key={instructor.id}
                  className={`border-b border-[#f0ede8] hover:bg-[#faf9f7] transition-colors ${i === instructors.length - 1 ? "border-b-0" : ""}`}
                >
                  <td className="px-5 py-3 font-medium text-[#2d2b45]">{instructor.name}</td>
                  <td className="px-5 py-3 text-[#a09aad] text-xs">
                    {instructor._count.members} member{instructor._count.members !== 1 ? "s" : ""}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleDelete(instructor.id, instructor.name)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-md text-[#a09aad] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}