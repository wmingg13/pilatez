// src/types/index.ts
import type { Member, user, AdminRole, MembershipStatus } from "@prisma/client";

export type { Member, user as AdminUser, AdminRole, MembershipStatus };

export type ActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  image?: string | null;
};
