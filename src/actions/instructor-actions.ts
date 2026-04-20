// src/actions/instructor-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { ActionState } from "@/types";

const InstructorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

async function requireMasterAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "MASTER_ADMIN") throw new Error("Forbidden");
  return session.user;
}

export async function getInstructors() {
  return prisma.instructor.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { members: true } } },
  });
}

export async function createInstructor(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterAdmin();

  const parsed = InstructorSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await prisma.instructor.create({ data: { name: parsed.data.name } });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return { success: false, message: "An instructor with this name already exists." };
    }
    return { success: false, message: "Failed to create instructor." };
  }

  revalidatePath("/admin/instructors");
  return { success: true, message: `${parsed.data.name} added as instructor.` };
}

export async function deleteInstructor(id: string): Promise<ActionState> {
  await requireMasterAdmin();

  try {
    await prisma.instructor.delete({ where: { id } });
  } catch {
    return { success: false, message: "Failed to delete instructor." };
  }

  revalidatePath("/admin/instructors");
  return { success: true, message: "Instructor removed." };
}