// src/components/members/status-badge.tsx
import { MembershipStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const CONFIG: Record<MembershipStatus, { label: string; className: string }> = {
  ACTIVE:   { label: "Active",   className: "bg-emerald-100 text-emerald-700" },
  INACTIVE: { label: "Inactive", className: "bg-[#e8e5ec] text-[#7a7887]" },
};

export function StatusBadge({ status }: { status: MembershipStatus }) {
  const { label, className } = CONFIG[status];
  return (
    <span className={cn("inline-block rounded-full px-3 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  );
}