// src/actions/member-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { MembershipStatus } from "@prisma/client";
import type { ActionState } from "@/types";

const MemberSchema = z.object({
  name:             z.string().min(2, "Name must be at least 2 characters"),
  phone:            z.string().min(1, "Phone number is required"),
  email:            z.string().email("Invalid email address").optional().or(z.literal("")),
  age:              z.coerce.number({ required_error: "Age is required", invalid_type_error: "Age must be a number" }).int().min(1, "Age must be at least 1").max(120, "Age must be 120 or under"),
  remarks:          z.string().optional(),
  membershipStatus: z.nativeEnum(MembershipStatus),
  joinedAt:         z.string().min(1, "Join date is required"),
  instructorId:     z.string().optional(),
});

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session.user;
}

export async function getMembers() {
  return prisma.member.findMany({
    orderBy: { joinedAt: "desc" },
    include: { instructor: true },
  });
}

export async function getMemberById(id: string) {
  return prisma.member.findUnique({
    where: { id },
    include: { instructor: true },
  });
}

export async function createMember(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();

  const raw = {
    name:             formData.get("name") as string,
    phone:            formData.get("phone") as string,
    email:            (formData.get("email") as string) || undefined,
    age:              (formData.get("age") as string) || undefined,
    remarks:          (formData.get("remarks") as string) || undefined,
    membershipStatus: (formData.get("membershipStatus") as MembershipStatus) ?? MembershipStatus.ACTIVE,
    joinedAt:         formData.get("joinedAt") as string,
    instructorId:     (formData.get("instructorId") as string) || undefined,
  };

  const parsed = MemberSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await prisma.member.create({
      data: {
        name:             parsed.data.name,
        phone:            parsed.data.phone,
        email:            parsed.data.email || null,
        age:              parsed.data.age ? Number(parsed.data.age) : null,
        remarks:          parsed.data.remarks || null,
        membershipStatus: parsed.data.membershipStatus,
        joinedAt:         new Date(parsed.data.joinedAt),
        instructorId:     parsed.data.instructorId || null,
        createdById:      admin.id,
        updatedById:      admin.id,
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return { success: false, message: "A member with this email already exists." };
    }
    return { success: false, message: "Failed to create member. Please try again." };
  }

  revalidatePath("/admin/members");
  return { success: true, message: `${parsed.data.name} has been added.` };
}

export async function updateMember(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();

  const raw = {
    name:             formData.get("name") as string,
    phone:            formData.get("phone") as string,
    email:            (formData.get("email") as string) || undefined,
    age:              (formData.get("age") as string) || undefined,
    remarks:          (formData.get("remarks") as string) || undefined,
    membershipStatus: formData.get("membershipStatus") as MembershipStatus,
    joinedAt:         formData.get("joinedAt") as string,
    instructorId:     (formData.get("instructorId") as string) || undefined,
  };

  const parsed = MemberSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await prisma.member.update({
      where: { id },
      data: {
        name:             parsed.data.name,
        phone:            parsed.data.phone,
        email:            parsed.data.email || null,
        age:              parsed.data.age ? Number(parsed.data.age) : null,
        remarks:          parsed.data.remarks || null,
        membershipStatus: parsed.data.membershipStatus,
        joinedAt:         new Date(parsed.data.joinedAt),
        instructorId:     parsed.data.instructorId || null,
        updatedById:      admin.id,
      },
    });
  } catch {
    return { success: false, message: "Failed to update member." };
  }

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
  return { success: true, message: "Member updated successfully." };
}

export async function deleteMember(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.member.delete({ where: { id } });
  } catch {
    return { success: false, message: "Failed to delete member." };
  }
  revalidatePath("/admin/members");
  return { success: true, message: "Member deleted." };
}