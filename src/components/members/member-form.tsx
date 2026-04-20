// src/components/members/member-form.tsx
"use client";

import { useActionState, useEffect } from "react";
import { MembershipStatus, type Instructor } from "@prisma/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createMember } from "@/actions/member-actions";
import type { ActionState } from "@/types";

const initialState: ActionState = { success: false, message: "" };

const inputClass =
  "w-full bg-[#f5f3f0] border border-[#e0ddd5] rounded-lg px-3 py-2 text-sm text-[#2d2b45] placeholder:text-[#c0bcc8] outline-none focus:ring-2 focus:ring-[#4a3d72]/20 focus:border-[#4a3d72] transition-all";
const labelClass = "block text-sm text-[#4a4758] mb-1.5 font-medium";
const errorClass = "text-xs text-red-500 mt-1";

interface MemberFormProps {
  instructors: Instructor[];
  onSuccess?: () => void;
}

export function MemberForm({ instructors, onSuccess }: MemberFormProps) {
  const [state, formAction, isPending] = useActionState(createMember, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      onSuccess?.();
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={formAction} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="name" className={labelClass}>Full Name</label>
        <input id="name" name="name" required placeholder="Juliette Tan" className={inputClass} />
        {state.errors?.name && <p className={errorClass}>{state.errors.name[0]}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className={labelClass}>Phone Number</label>
        <input id="phone" name="phone" required placeholder="098-655-8888" className={inputClass} />
        {state.errors?.phone && <p className={errorClass}>{state.errors.phone[0]}</p>}
      </div>

      {/* Age */}
      <div>
        <label htmlFor="age" className={labelClass}>Age</label>
        <input id="age" name="age" type="number" required min={1} max={120} placeholder="e.g. 28" className={inputClass} />
        {state.errors?.age && <p className={errorClass}>{state.errors.age[0]}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className={labelClass}>
          Email Address <span className="text-[#a09aad] font-normal">(optional)</span>
        </label>
        <input id="email" name="email" type="email" placeholder="juliette@example.com" className={inputClass} />
        {state.errors?.email && <p className={errorClass}>{state.errors.email[0]}</p>}
      </div>

      {/* Membership Status */}
      <div>
        <label htmlFor="membershipStatus" className={labelClass}>Membership Status</label>
        <select id="membershipStatus" name="membershipStatus" defaultValue={MembershipStatus.ACTIVE} className={inputClass}>
          <option value={MembershipStatus.ACTIVE}>Active</option>
          <option value={MembershipStatus.INACTIVE}>Inactive</option>
        </select>
      </div>

      {/* Instructor */}
      <div>
        <label htmlFor="instructorId" className={labelClass}>
          Instructor <span className="text-[#a09aad] font-normal">(optional)</span>
        </label>
        <select id="instructorId" name="instructorId" defaultValue="" className={inputClass}>
          <option value="">— No instructor —</option>
          {instructors.map((ins) => (
            <option key={ins.id} value={ins.id}>{ins.name}</option>
          ))}
        </select>
      </div>

      {/* Join Date */}
      <div>
        <label htmlFor="joinedAt" className={labelClass}>Join Date</label>
        <input id="joinedAt" name="joinedAt" type="date" required defaultValue={today} className={inputClass} />
        {state.errors?.joinedAt && <p className={errorClass}>{state.errors.joinedAt[0]}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#4a3d72] hover:bg-[#3a2f5c] disabled:opacity-60 text-white rounded-full py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors mt-2"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? "Adding member…" : "Add Member"}
      </button>
    </form>
  );
}