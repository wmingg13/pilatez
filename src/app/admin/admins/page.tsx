// src/app/admin/admins/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminsTable } from "@/components/admins/admins-table";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  // Only MASTER_ADMIN may access this page
  if (session?.user.role !== "MASTER_ADMIN") redirect("/admin/members");

  const admins = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <h1 className="font-serif text-3xl text-[#2d2b45] mb-6 tracking-tight">
        Admin Accounts
      </h1>
      <AdminsTable admins={admins} />
    </div>
  );
}
