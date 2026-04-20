// src/lib/helpers.ts
// Avatar, date and text helpers — split from utils.ts so Docker cache
// can never serve a stale version of these specific exports.

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-[#e8e3f2] text-[#4a3d72]",
  "bg-[#e3eef8] text-[#2a5a8a]",
  "bg-[#eaf3f0] text-[#2a7a5a]",
  "bg-[#fdeee8] text-[#8a5a2a]",
  "bg-[#f0e8f5] text-[#7a2a8a]",
  "bg-[#e8f5ee] text-[#2a7a4a]",
  "bg-[#f5f0e8] text-[#7a6a2a]",
];

export function avatarColor(id: string): string {
  const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}