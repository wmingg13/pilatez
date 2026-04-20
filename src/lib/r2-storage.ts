// src/lib/r2-storage.ts
// Cloudflare R2 storage — PRIVATE bucket with presigned URLs.
//
// Folder key structure (generated once per member, stored in Member.r2FolderKey):
//   <8-char-uid>_<memberName>_<instructorName>
//
// Object key structure per upload:
//   <folderKey>/<8-char-uid>_<section>_<YYYY-MM-DD>.<ext>
//
// Using a stored folder key prevents duplicate-name collisions between members
// and between instructors with the same name.

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------
function getR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

// ---------------------------------------------------------------------------
// UID helpers
// ---------------------------------------------------------------------------
const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

function shortUid(length = 8): string {
  let uid = "";
  for (let i = 0; i < length; i++) {
    uid += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return uid;
}

const sanitise = (s: string) =>
  s.trim().replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_");

/**
 * Generate a unique folder key for a member.
 * Format: <8-char-uid>_<memberName>_<instructorName>
 * Call once when creating a member, store in Member.r2FolderKey, reuse forever.
 */
export function generateMemberFolderKey(memberName: string, instructorName: string): string {
  const uid  = shortUid(8);
  const mPart = sanitise(memberName).slice(0, 30);
  const iPart = sanitise(instructorName || "no_instructor").slice(0, 20);
  return `${uid}_${mPart}_${iPart}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface UploadResult {
  fileId:     string; // R2 object key — stored as driveFileId in DB
  drivePath:  string; // same value — stored as drivePath in DB
  fileName:   string; // e.g. a3kx9m2q_front_2026-04-13.jpg
  webViewUrl: string; // empty — presigned URLs generated on demand
}

/**
 * Upload an image buffer to R2.
 *
 * @param folderKey  - Member.r2FolderKey (pre-generated, stored in DB).
 *                     Pass the stored value so the same folder is always used
 *                     regardless of name changes.
 */
export async function uploadImageToR2(
  buffer:      Buffer,
  mimeType:    string,
  section:     string,
  folderKey:   string,   // from Member.r2FolderKey
  memberName:  string,   // for R2 metadata only
  instructorName: string,
  uploadDate:  Date = new Date()
): Promise<UploadResult> {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME!;

  const dateStr  = uploadDate.toISOString().split("T")[0];
  const ext      = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const uid      = shortUid(8);
  const fileName = `${uid}_${section.toLowerCase()}_${dateStr}.${ext}`;
  const objectKey = `${folderKey}/${fileName}`;

  console.log(`[R2] uploading → bucket=${bucket} key=${objectKey}`);

  await client.send(new PutObjectCommand({
    Bucket:      bucket,
    Key:         objectKey,
    Body:        buffer,
    ContentType: mimeType,
    Metadata: {
      memberName,
      instructorName: instructorName || "no_instructor",
      section:        section.toLowerCase(),
      uploadDate:     uploadDate.toISOString(),
      folderKey,
      fileName,
    },
  }));

  console.log(`[R2] upload complete → key=${objectKey}`);

  return {
    fileId:     objectKey,
    drivePath:  objectKey,
    fileName,
    webViewUrl: "",
  };
}

/**
 * Generate a presigned URL for a private R2 object (15 min TTL by default).
 */
export async function getPresignedImageUrl(
  objectKey:        string,
  expiresInSeconds: number = 900
): Promise<string> {
  const client = getR2Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: objectKey }),
    { expiresIn: expiresInSeconds }
  );
}

/**
 * Batch-generate presigned URLs for multiple object keys.
 */
export async function getPresignedImageUrls(
  objectKeys:       string[],
  expiresInSeconds: number = 900
): Promise<Record<string, string>> {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME!;

  const entries = await Promise.all(
    objectKeys.map(async (key) => {
      const url = await getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn: expiresInSeconds }
      );
      return [key, url] as [string, string];
    })
  );

  return Object.fromEntries(entries);
}

/**
 * Delete an object from R2.
 */
export async function deleteFileFromR2(objectKey: string): Promise<void> {
  const client = getR2Client();
  console.log(`[R2] deleting → key=${objectKey}`);
  await client.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key:    objectKey,
  }));
  console.log(`[R2] deleted → key=${objectKey}`);
}

/**
 * Check if an object exists in R2.
 */
export async function fileExistsInR2(objectKey: string): Promise<boolean> {
  try {
    await getR2Client().send(new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key:    objectKey,
    }));
    return true;
  } catch {
    return false;
  }
}