// src/components/admins/admins-table.tsx
"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2, ShieldCheck, Shield } from "lucide-react";
import { toast } from "sonner";
import { deleteAdmin } from "@/actions/admin-actions";
import { AdminForm } from "./admin-form";
import { Portal } from "@/components/ui/portal";
import { formatDate, initials, avatarColor } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@prisma/client";

interface AdminRow {
  id: string;
  name: string;
  email: string;  // internal — derive username from it
  role: AdminRole;
  createdAt: Date;
}

export function AdminsTable({ admins }: { admins: AdminRow[] }) {
  const [addOpen, setAddOpen]       = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, name: string) {
    startTransition(async () => {
      const result = await deleteAdmin(id);
      if (result.success) {
        toast.success(`${name} has been removed.`);
      } else {
        toast.error(result.message);
      }
      setDeletingId(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#a09aad]">{admins.length} admin account{admins.length !== 1 ? "s" : ""}</span>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 bg-[#4a3d72] hover:bg-[#3a2f5c] text-white rounded-full h-9 px-4 text-sm font-medium transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Admin
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e8e5dc] overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#4a3d72]">
              {["Name", "Username", "Role", "Created", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-medium text-white/85 uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {admins.map((admin, i) => (
              <tr
                key={admin.id}
                className={cn(
                  "border-b border-[#f0ede8] hover:bg-[#faf9f7] transition-colors",
                  i === admins.length - 1 && "border-b-0"
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0", avatarColor(admin.id))}>
                      {initials(admin.name)}
                    </div>
                    <span className="font-medium text-[#2d2b45]">{admin.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#7a7887]">{admin.email}</td>
                <td className="px-4 py-3">
                  {admin.role === "MASTER_ADMIN" ? (
                    <span className="inline-flex items-center gap-1 bg-[#f0edf8] text-[#4a3d72] text-xs font-medium px-2.5 py-1 rounded-full">
                      <ShieldCheck className="h-3 w-3" />Master Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-[#f5f3f0] text-[#7a7887] text-xs font-medium px-2.5 py-1 rounded-full">
                      <Shield className="h-3 w-3" />Admin
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-[#a09aad]">{formatDate(admin.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    {admin.role !== "MASTER_ADMIN" && (
                      <button
                        onClick={() => setDeletingId(admin.id)}
                        className="p-1.5 rounded-md text-[#a09aad] hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Admin Modal */}
      {addOpen && (
        <Portal>
          <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
            <div className="relative bg-white rounded-2xl border border-[#e0ddd5] shadow-xl p-6 w-full max-w-md mx-4">
              <div className="mb-5">
                <h2 className="font-serif text-xl text-[#2d2b45]">Create Admin Account</h2>
                <p className="text-xs text-[#a09aad] mt-0.5">New admin will have access to all member management features.</p>
              </div>
              <AdminForm onSuccess={() => setAddOpen(false)} />
              <button onClick={() => setAddOpen(false)} className="absolute top-4 right-4 text-[#a09aad] hover:text-[#2d2b45] text-lg leading-none">✕</button>
            </div>
          </div>
        </Portal>
      )}

      {/* Delete Confirm Modal */}
      {deletingId && (
        <Portal>
          <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !isPending && setDeletingId(null)} />
            <div className="relative bg-white rounded-2xl border border-[#e0ddd5] shadow-xl p-6 w-full max-w-sm mx-4">
              <h3 className="font-serif text-lg text-[#2d2b45] mb-2">Remove this admin?</h3>
              <p className="text-sm text-[#7a7887] mb-6">They will immediately lose access to the dashboard.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  disabled={isPending}
                  className="flex-1 border border-[#e0ddd5] text-[#7a7887] rounded-full py-2 text-sm hover:bg-[#f5f3f0] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const admin = admins.find((a) => a.id === deletingId);
                    if (admin) handleDelete(admin.id, admin.name);
                  }}
                  disabled={isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-full py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isPending ? "Removing…" : "Yes, remove"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}