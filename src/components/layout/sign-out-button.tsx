// src/components/layout/sign-out-button.tsx
"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm text-[#7a7887] hover:bg-[#f5f3f0] hover:text-[#2d2b45] transition-colors"
    >
      <LogOut className="h-4 w-4 flex-shrink-0" />
      Sign out
    </button>
  );
}
