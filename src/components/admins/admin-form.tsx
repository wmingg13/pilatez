// src/components/admins/admin-form.tsx
"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createAdmin } from "@/actions/admin-actions";
import type { ActionState } from "@/types";

const initialState: ActionState = { success: false, message: "" };
const inputClass = "w-full bg-[#f5f3f0] border border-[#e0ddd5] rounded-lg px-3 py-2 text-sm text-[#2d2b45] placeholder:text-[#c0bcc8] outline-none focus:ring-2 focus:ring-[#4a3d72]/20 focus:border-[#4a3d72] transition-all";
const labelClass = "block text-sm text-[#4a4758] mb-1.5 font-medium";
const errorClass = "text-xs text-red-500 mt-1";

export function AdminForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, formAction, isPending] = useActionState(createAdmin, initialState);

  useEffect(() => {
    if (state.success) { toast.success(state.message); onSuccess?.(); }
    else if (state.message && !state.success) toast.error(state.message);
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className={labelClass}>Full Name</label>
        <input id="name" name="name" required placeholder="Jane Smith" className={inputClass} />
        {state.errors?.name && <p className={errorClass}>{state.errors.name[0]}</p>}
      </div>
      <div>
        <label htmlFor="username" className={labelClass}>Username</label>
        <input
          id="username" name="username" required
          placeholder="jane_smith"
          autoComplete="off"
          className={inputClass}
        />
        {state.errors?.username && <p className={errorClass}>{state.errors.username[0]}</p>}
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Password</label>
        <input
          id="password" name="password" type="password"
          required minLength={8} placeholder="Min. 8 characters"
          className={inputClass}
        />
        {state.errors?.password && <p className={errorClass}>{state.errors.password[0]}</p>}
      </div>
      <p className="text-xs text-[#a09aad]">
        The new admin can sign in immediately with these credentials.
      </p>
      <button
        type="submit" disabled={isPending}
        className="w-full bg-[#4a3d72] hover:bg-[#3a2f5c] disabled:opacity-60 text-white rounded-full py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? "Creating admin…" : "Create Admin"}
      </button>
    </form>
  );
}