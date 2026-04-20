// src/components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, ShieldCheck, PersonStanding } from "lucide-react";
import { SignOutButton } from "./sign-out-button";

interface SidebarProps {
  role: "MASTER_ADMIN" | "ADMIN";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const navLink = (href: string, label: string, Icon: React.ElementType) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
        pathname.startsWith(href)
          ? "bg-[#f0edf8] text-[#4a3d72] font-medium"
          : "text-[#7a7887] hover:bg-[#f5f3f0] hover:text-[#2d2b45]"
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {label}
    </Link>
  );

  return (
    <aside className="w-[200px] min-w-[200px] bg-white border-r border-[#e8e5dc] flex flex-col">
      <div className="px-4 py-3 border-b border-[#e8e5dc] flex items-center justify-center min-h-[56px]">
        <Image
          src="/logo.png"
          alt="Let'z Pilates"
          width={160}
          height={56}
          className="object-contain h-12 w-auto max-w-full"
          onError={(e) => {
            // Fallback to text if logo not found
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent && !parent.querySelector("span")) {
              const span = document.createElement("span");
              span.className = "font-serif text-lg text-[#2d2b45] tracking-tight";
              span.innerHTML = "Let'z <span style='color:#4a3d72'>Pilates</span>";
              parent.appendChild(span);
            }
          }}
        />
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navLink("/admin/members", "Members", Users)}
        {role === "MASTER_ADMIN" && (
          <>
            {navLink("/admin/admins",      "Admins",      ShieldCheck)}
            {navLink("/admin/instructors", "Instructors", PersonStanding)}
          </>
        )}
      </nav>

      <div className="px-3 py-3 border-t border-[#e8e5dc]">
        <SignOutButton />
      </div>
    </aside>
  );
}