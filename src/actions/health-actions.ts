// src/actions/health-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PilatesExperience } from "@prisma/client";
import type { ActionState } from "@/types";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session.user;
}

export async function getMemberHealthProfile(memberId: string) {
  return prisma.memberHealthProfile.findUnique({ where: { memberId } });
}

// ---------------------------------------------------------------------------
// Update health & fitness history (items 1-7)
// ---------------------------------------------------------------------------
export async function updateHealthProfile(
  memberId: string,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, message: "Unauthorized" };
  }

  const EXPERIENCE_MAP: Record<string, PilatesExperience> = {
    NONE:               PilatesExperience.NONE,
    LESS_THAN_6_MONTHS: PilatesExperience.LESS_THAN_6_MONTHS,
    ONE_TO_THREE_YEARS: PilatesExperience.ONE_TO_THREE_YEARS,
    MORE_THAN_3_YEARS:  PilatesExperience.MORE_THAN_3_YEARS,
  };

  const rawExp = formData.get("pilatesExperience") as string | null;
  const pilatesExperience = rawExp ? EXPERIENCE_MAP[rawExp] ?? null : null;

  const data = {
    pilatesExperience,
    fitnessGoal:            (formData.get("fitnessGoal") as string)?.trim()            || null,
    physicalConsiderations: (formData.get("physicalConsiderations") as string)?.trim() || null,
    currentMedications:     (formData.get("currentMedications") as string)?.trim()     || null,
    currentInjuries:        (formData.get("currentInjuries") as string)?.trim()        || null,
    pastSurgeries:          (formData.get("pastSurgeries") as string)?.trim()          || null,
    condHerniatedDisk:       formData.get("condHerniatedDisk")       === "true",
    condHighBloodPressure:   formData.get("condHighBloodPressure")   === "true",
    condDiabetes:            formData.get("condDiabetes")            === "true",
    condHypoglycemia:        formData.get("condHypoglycemia")        === "true",
    condNumbness:            formData.get("condNumbness")            === "true",
    condBackpain:            formData.get("condBackpain")            === "true",
    condOsteoporosis:        formData.get("condOsteoporosis")        === "true",
    condPregnancy:           formData.get("condPregnancy")           === "true",
    condVertigo:             formData.get("condVertigo")             === "true",
    condShoulderImpingement: formData.get("condShoulderImpingement") === "true",
    condStenosis:            formData.get("condStenosis")            === "true",
    condScoliosis:           formData.get("condScoliosis")           === "true",
    condCarpalTunnel:        formData.get("condCarpalTunnel")        === "true",
    condCancer:              formData.get("condCancer")              === "true",
  };

  try {
    await prisma.memberHealthProfile.upsert({
      where:  { memberId },
      update: data,
      create: { memberId, ...data },
    });

    revalidatePath(`/admin/members/${memberId}`);
    return { success: true, message: "Health profile updated." };
  } catch (err) {
    console.error("updateHealthProfile error:", err);
    return { success: false, message: "Failed to update health profile." };
  }
}

// ---------------------------------------------------------------------------
// Update instructor notes (items 8-9)
// ---------------------------------------------------------------------------
export async function updateInstructorNotes(
  memberId: string,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, message: "Unauthorized" };
  }

  const data = {
    assessmentSummary: (formData.get("assessmentSummary") as string)?.trim() || null,
    trainingPlan:      (formData.get("trainingPlan") as string)?.trim()      || null,
  };

  try {
    await prisma.memberHealthProfile.upsert({
      where:  { memberId },
      update: data,
      create: { memberId, ...data },
    });

    revalidatePath(`/admin/members/${memberId}`);
    return { success: true, message: "Instructor notes updated." };
  } catch (err) {
    console.error("updateInstructorNotes error:", err);
    return { success: false, message: "Failed to update instructor notes." };
  }
}