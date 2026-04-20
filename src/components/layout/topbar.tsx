// src/components/layout/topbar.tsx
"use client";

import Image from "next/image";
import { initials, avatarColor } from "@/lib/helpers";
import { cn } from "@/lib/utils";

interface TopbarProps {
  user: { id: string; name: string; email: string; role?: string };
}

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="h-14 bg-white border-b border-[#e8e5dc] flex items-center justify-between px-6 flex-shrink-0">
      {/* Logo — top-left of content area */}
      <div className="flex items-center h-10">
        <Image
          src="/logo.png"
          alt="Let'z Pilates"
          width={120}
          height={40}
          className="object-contain h-9 w-auto"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>

      {/* User info — right */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-medium text-[#2d2b45] leading-none">{user.name}</p>
          <p className="text-[10px] text-[#a09aad] mt-0.5">
            {user.role === "MASTER_ADMIN" ? "Admin" : "Admin"}
          </p>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0",
          avatarColor(user.id)
        )}>
          {initials(user.name)}
        </div>
      </div>
    </header>
  );
}