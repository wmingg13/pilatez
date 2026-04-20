// src/actions/admin-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { prisma } from "@/lib/prisma";
import { auth, usernameToEmail } from "@/lib/auth";
import { headers } from "next/headers";
import type { ActionState } from "@/types";

const scryptAsync = promisify(scrypt);

const CreateAdminSchema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(2, "Username must be at least 2 characters")
              .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, _ . -"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${hash.toString("hex")}:${salt}`;
}

async function requireMasterAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "MASTER_ADMIN") throw new Error("Forbidden");
  return session.user;
}

export async function createAdmin(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterAdmin();

  const raw = {
    name:     formData.get("name")     as string,
    username: formData.get("username") as string,
    password: formData.get("password") as string,
  };

  const parsed = CreateAdminSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      message: "Validation failed.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Generate internal email from username
  const email = usernameToEmail(parsed.data.username);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, message: `Username "${parsed.data.username}" is already taken.` };
  }

  try {
    const hashedPassword = await hashPassword(parsed.data.password);
    const userId         = randomBytes(12).toString("hex");

    await prisma.user.create({
      data: {
        id:            userId,
        name:          parsed.data.name,
        email,                        // internal email, never shown to user
        emailVerified: true,
        role:          "ADMIN",
      },
    });

    await prisma.account.create({
      data: {
        id:         randomBytes(12).toString("hex"),
        accountId:  userId,
        providerId: "credential",
        userId,
        password:   hashedPassword,
      },
    });
  } catch (err: unknown) {
    console.error("createAdmin error:", err);
    return { success: false, message: "Failed to create admin. Please try again." };
  }

  revalidatePath("/admin/admins");
  return { success: true, message: `Admin "${parsed.data.name}" created.` };
}

export async function deleteAdmin(id: string): Promise<ActionState> {
  const currentUser = await requireMasterAdmin();
  if (currentUser.id === id) {
    return { success: false, message: "You cannot delete your own account." };
  }
  try {
    await prisma.user.delete({ where: { id } });
  } catch {
    return { success: false, message: "Failed to delete admin." };
  }
  revalidatePath("/admin/admins");
  return { success: true, message: "Admin account deleted." };
}