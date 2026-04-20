// src/actions/photo-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  uploadImageToR2,
  deleteFileFromR2,
  getPresignedImageUrl,
  getPresignedImageUrls,
  generateMemberFolderKey,
} from "@/lib/r2-storage";
import { ImageSection } from "@prisma/client";
import type { ActionState } from "@/types";

const SECTION_MAP: Record<string, ImageSection> = {
  front: ImageSection.FRONT,
  back:  ImageSection.BACK,
  left:  ImageSection.LEFT,
  right: ImageSection.RIGHT,
};

const PRESIGN_TTL = 900; // 15 minutes

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session.user;
}

// ---------------------------------------------------------------------------
// UPLOAD
// ---------------------------------------------------------------------------
export async function uploadMemberPhoto(
  memberId:   string,
  section:    string,
  fileBuffer: Buffer,
  mimeType:   string,
  remark:     string,
  uploadDate: Date = new Date()
): Promise<ActionState & { photo?: { id: string; url: string } }> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { success: false, message: "Unauthorized" };
  }

  const sectionEnum = SECTION_MAP[section.toLowerCase()];
  if (!sectionEnum) {
    return { success: false, message: `Invalid section: ${section}` };
  }

  const member = await prisma.member.findUnique({
    where:   { id: memberId },
    include: { instructor: true },
  });
  if (!member) return { success: false, message: "Member not found" };

  const instructorName = member.instructor?.name ?? "no_instructor";

  // Retrieve or generate the folder key for this member.
  // Generated once and stored so the same R2 folder is always used,
  // even if the member's name or instructor changes later.
  let folderKey = member.r2FolderKey;
  if (!folderKey) {
    folderKey = generateMemberFolderKey(member.name, instructorName);
    await prisma.member.update({
      where: { id: memberId },
      data:  { r2FolderKey: folderKey },
    });
    console.log(`[R2] generated folderKey=${folderKey} for member=${memberId}`);
  }

  try {
    const { fileId, drivePath, fileName } = await uploadImageToR2(
      fileBuffer,
      mimeType,
      section,
      folderKey,
      member.name,
      instructorName,
      uploadDate
    );

    const photo = await prisma.memberPhoto.create({
      data: {
        memberId,
        section:         sectionEnum,
        driveFileId:     fileId,    // R2 object key
        drivePath,                  // same as fileId
        driveWebViewUrl: "",        // not used — presigned URLs generated on demand
        fileName,                   // e.g. a3kx9m2q_front_2026-04-13.jpg
        remark:          remark.trim() || null,
        uploadedAt:      uploadDate,
        uploadedById:    admin.id,
      },
    });

    const url = await getPresignedImageUrl(fileId, PRESIGN_TTL);

    revalidatePath(`/admin/members/${memberId}`);

    return {
      success: true,
      message: `${section} image uploaded successfully.`,
      photo:   { id: photo.id, url },
    };
  } catch (err) {
    console.error("uploadMemberPhoto error:", err);
    return { success: false, message: "Failed to upload image. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// GET ALL PHOTOS FOR MEMBER
// ---------------------------------------------------------------------------
export async function getMemberPhotos(memberId: string) {
  try {
    await requireAdmin();
  } catch {
    return [];
  }

  const photos = await prisma.memberPhoto.findMany({
    where:   { memberId },
    orderBy: { uploadedAt: "desc" },
  });

  if (photos.length === 0) return [];

  const presignedMap = await getPresignedImageUrls(
    photos.map((p) => p.driveFileId),
    PRESIGN_TTL
  );

  return photos.map((p) => ({
    id:        p.id,
    section:   p.section.toLowerCase() as "front" | "back" | "left" | "right",
    fileName:  p.fileName,
    remark:    p.remark,
    uploadedAt: p.uploadedAt,
    url:       presignedMap[p.driveFileId] ?? "",
    objectKey: p.driveFileId,
    drivePath: p.drivePath,
  }));
}

// ---------------------------------------------------------------------------
// GET PHOTOS BY SECTION — used by compare tab
// ---------------------------------------------------------------------------
export async function getMemberPhotosBySection(memberId: string, section: string) {
  try {
    await requireAdmin();
  } catch {
    return [];
  }

  const sectionEnum = SECTION_MAP[section.toLowerCase()];
  if (!sectionEnum) return [];

  const photos = await prisma.memberPhoto.findMany({
    where:   { memberId, section: sectionEnum },
    orderBy: { uploadedAt: "desc" },
  });

  if (photos.length === 0) return [];

  const presignedMap = await getPresignedImageUrls(
    photos.map((p) => p.driveFileId),
    PRESIGN_TTL
  );

  return photos.map((p) => ({
    id:         p.id,
    section:    p.section.toLowerCase() as string,
    fileName:   p.fileName,
    remark:     p.remark,
    uploadedAt: p.uploadedAt,
    url:        presignedMap[p.driveFileId] ?? "",
    drivePath:  p.drivePath,
  }));
}

// ---------------------------------------------------------------------------
// DELETE PHOTO
// ---------------------------------------------------------------------------
export async function deleteMemberPhoto(photoId: string): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, message: "Unauthorized" };
  }

  const photo = await prisma.memberPhoto.findUnique({ where: { id: photoId } });
  if (!photo) return { success: false, message: "Photo not found" };

  try {
    await deleteFileFromR2(photo.driveFileId);
  } catch (err) {
    console.warn("[R2] delete warning:", err);
  }

  await prisma.memberPhoto.delete({ where: { id: photoId } });
  revalidatePath(`/admin/members/${photo.memberId}`);

  return { success: true, message: "Photo deleted." };
}