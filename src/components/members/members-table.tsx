// src/components/members/members-table.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, X } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { DeleteDialog } from "./delete-dialog";
import { MemberForm } from "./member-form";
import { Portal } from "@/components/ui/portal";
import { formatDate, initials, avatarColor } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type { Member, Instructor } from "@prisma/client";

type MemberWithInstructor = Member & { instructor: Instructor | null };
type InstructorWithCount  = Instructor & { _count: { members: number } };

interface MembersTableProps {
  members:     MemberWithInstructor[];
  instructors: InstructorWithCount[];
}

type SortFilter = "all" | "az" | "new";

export function MembersTable({ members, instructors }: MembersTableProps) {
  const [search, setSearch]                   = useState("");
  const [selected, setSelected]               = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen]                 = useState(false);
  const [sort, setSort]                       = useState<SortFilter>("all");
  const [page, setPage]                       = useState(1);
  const [instructorFilter, setInstructorFilter] = useState<string>("all");
  const PER_PAGE = 10;

  // Unassigned member count
  const unassignedCount = useMemo(
    () => members.filter((m) => !m.instructorId).length,
    [members]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = members.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(q) ||
        (m.email ?? "").toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        (m.instructor?.name ?? "").toLowerCase().includes(q);

      const matchesInstructor =
        instructorFilter === "all" ||
        (instructorFilter === "none" ? !m.instructorId : m.instructor?.name === instructorFilter);

      return matchesSearch && matchesInstructor;
    });

    if (sort === "az")  list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "new") list = [...list].sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
    return list;
  }, [members, search, sort, instructorFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const allChecked = paginated.length > 0 && paginated.every((m) => selected.has(m.id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) paginated.forEach((m) => next.delete(m.id));
      else            paginated.forEach((m) => next.add(m.id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectInstructor(name: string) {
    setInstructorFilter(name);
    setPage(1);
  }

  function clearFilter() {
    setInstructorFilter("all");
    setPage(1);
  }

  const SORT_TABS: { key: SortFilter; label: string }[] = [
    { key: "all", label: "All Members" },
    { key: "az",  label: "A to Z" },
    { key: "new", label: "New to Old" },
  ];

  const activeInstructorLabel =
    instructorFilter === "none"
      ? "Unassigned"
      : instructorFilter !== "all"
        ? instructorFilter
        : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Top toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex bg-[#e0ddd5] rounded-lg p-1 gap-0.5">
            {SORT_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setSort(key); setPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs transition-colors",
                  sort === key
                    ? "bg-white text-[#2d2b45] font-medium shadow-sm"
                    : "text-[#7a7887] hover:text-[#2d2b45]"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-xs text-[#a09aad]">Total / {members.length} members</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#a09aad] pointer-events-none" />
            <input
              type="search"
              placeholder="Search members…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 pr-3 h-9 w-48 bg-[#f5f3f0] border border-[#e0ddd5] rounded-full text-sm text-[#2d2b45] placeholder:text-[#a09aad] outline-none focus:ring-2 focus:ring-[#4a3d72]/20 focus:border-[#4a3d72]"
            />
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 bg-[#4a3d72] hover:bg-[#3a2f5c] text-white rounded-full h-9 px-4 text-sm font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Member
          </button>
        </div>
      </div>

      {/* Instructor filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[#a09aad] font-medium flex-shrink-0">Instructor</span>

        {/* All chip */}
        <button
          onClick={() => selectInstructor("all")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors",
            instructorFilter === "all"
              ? "bg-[#4a3d72] border-[#4a3d72] text-white"
              : "bg-white border-[#e0ddd5] text-[#7a7887] hover:border-[#c4bdd8] hover:text-[#4a3d72]"
          )}
        >
          All
          <span className={cn("text-[10px]", instructorFilter === "all" ? "opacity-75" : "text-[#a09aad]")}>
            {members.length}
          </span>
        </button>

        {/* Per-instructor chips */}
        {instructors.map((inst) => (
          <button
            key={inst.id}
            onClick={() => selectInstructor(inst.name)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors",
              instructorFilter === inst.name
                ? "bg-[#4a3d72] border-[#4a3d72] text-white"
                : "bg-white border-[#e0ddd5] text-[#7a7887] hover:border-[#c4bdd8] hover:text-[#4a3d72]"
            )}
          >
            <div className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium flex-shrink-0",
              instructorFilter === inst.name ? "bg-white/20 text-white" : "bg-[#e8e3f2] text-[#4a3d72]"
            )}>
              {initials(inst.name)}
            </div>
            {inst.name}
            <span className={cn("text-[10px]", instructorFilter === inst.name ? "opacity-75" : "text-[#a09aad]")}>
              {inst._count.members}
            </span>
          </button>
        ))}

        {/* Unassigned chip — only show if there are unassigned members */}
        {unassignedCount > 0 && (
          <button
            onClick={() => selectInstructor("none")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors",
              instructorFilter === "none"
                ? "bg-[#4a3d72] border-[#4a3d72] text-white"
                : "bg-white border-[#e0ddd5] text-[#7a7887] hover:border-[#c4bdd8] hover:text-[#4a3d72]"
            )}
          >
            <div className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium flex-shrink-0",
              instructorFilter === "none" ? "bg-white/20 text-white" : "bg-[#f5f3f0] text-[#a09aad]"
            )}>
              —
            </div>
            Unassigned
            <span className={cn("text-[10px]", instructorFilter === "none" ? "opacity-75" : "text-[#a09aad]")}>
              {unassignedCount}
            </span>
          </button>
        )}

        {/* Active filter badge + clear */}
        {activeInstructorLabel && (
          <div className="flex items-center gap-1.5 ml-1">
            <span className="flex items-center gap-1.5 text-xs bg-[#f0edf8] text-[#4a3d72] px-2.5 py-1 rounded-full">
              {activeInstructorLabel}
              <button onClick={clearFilter} className="opacity-60 hover:opacity-100 transition-opacity">
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-xs text-[#a09aad] -mt-2">
        Showing {filtered.length} of {members.length} member{members.length !== 1 ? "s" : ""}
        {activeInstructorLabel ? ` · filtered by ${activeInstructorLabel}` : ""}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e8e5dc] overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#4a3d72]">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 rounded border-white/40 accent-white cursor-pointer"
                />
              </th>
              {["Name", "Phone", "Email", "Status", "Instructor", "Joined Date", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-medium text-white/85 uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-[#f0edf8] flex items-center justify-center">
                      <Search className="h-4 w-4 text-[#c4bdd8]" />
                    </div>
                    <div className="text-sm font-medium text-[#2d2b45]">No members found</div>
                    <div className="text-xs text-[#a09aad]">
                      {search && activeInstructorLabel
                        ? `No match for "${search}" under ${activeInstructorLabel}`
                        : search
                          ? `No members match "${search}"`
                          : activeInstructorLabel
                            ? `No members under ${activeInstructorLabel}`
                            : "No members yet. Add one above."}
                    </div>
                    {(search || activeInstructorLabel) && (
                      <button
                        onClick={() => { setSearch(""); clearFilter(); }}
                        className="text-xs text-[#4a3d72] underline underline-offset-2 mt-1"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((member, i) => (
                <tr
                  key={member.id}
                  className={cn(
                    "border-b border-[#f0ede8] hover:bg-[#faf9f7] transition-colors",
                    i === paginated.length - 1 && "border-b-0"
                  )}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(member.id)}
                      onChange={() => toggleOne(member.id)}
                      className="h-3.5 w-3.5 rounded border-[#ccc8d8] accent-[#4a3d72] cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0", avatarColor(member.id))}>
                        {initials(member.name)}
                      </div>
                      <span className="font-medium text-[#2d2b45]">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#7a7887] text-sm">{member.phone}</td>
                  <td className="px-4 py-3 text-[#7a7887] text-xs">{member.email ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={member.membershipStatus} /></td>
                  <td className="px-4 py-3 text-sm">
                    {member.instructor?.name
                      ? <span className="text-[#7a7887]">{member.instructor.name}</span>
                      : <span className="text-[#c0bcc8] text-xs italic">Unassigned</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-[#a09aad] text-xs">{formatDate(member.joinedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/members/${member.id}`}
                        className="p-1.5 rounded-md text-[#a09aad] hover:text-[#4a3d72] hover:bg-[#f0edf8] transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <DeleteDialog id={member.id} name={member.name} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-[#a09aad] px-1">
        <span>
          {selected.size > 0 ? `${selected.size} selected · ` : ""}
          Showing {filtered.length === 0 ? 0 : Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–
          {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} members
        </span>
        {totalPages > 1 && (
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="w-7 h-7 rounded-md border border-[#e0ddd5] flex items-center justify-center hover:bg-[#f0edf8] disabled:opacity-40">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={cn("w-7 h-7 rounded-md border text-xs flex items-center justify-center transition-colors",
                  p === page ? "bg-[#4a3d72] text-white border-[#4a3d72]" : "border-[#e0ddd5] text-[#7a7887] hover:bg-[#f0edf8]")}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-7 h-7 rounded-md border border-[#e0ddd5] flex items-center justify-center hover:bg-[#f0edf8] disabled:opacity-40">›</button>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {addOpen && (
        <Portal>
          <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
            <div className="relative bg-white rounded-2xl border border-[#e0ddd5] shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="mb-5">
                <h2 className="font-serif text-xl text-[#2d2b45]">Add New Member</h2>
                <p className="text-xs text-[#a09aad] mt-0.5">Fill in the details below to create a member record.</p>
              </div>
              <MemberForm instructors={instructors} onSuccess={() => setAddOpen(false)} />
              <button onClick={() => setAddOpen(false)} className="absolute top-4 right-4 text-[#a09aad] hover:text-[#2d2b45] text-lg leading-none">✕</button>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}