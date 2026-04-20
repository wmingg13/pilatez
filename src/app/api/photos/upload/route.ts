// src/app/api/photos/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { uploadMemberPhoto } from "@/actions/photo-actions";

export async function POST(request: NextRequest) {
  try {
    const form     = await request.formData();
    const file     = form.get("file") as File | null;
    const memberId = form.get("memberId") as string | null;
    const section  = form.get("section") as string | null;
    const remark   = (form.get("remark") as string | null) ?? "";

    if (!file || !memberId || !section) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: file, memberId, section" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadMemberPhoto(
      memberId,
      section,
      buffer,
      file.type || "image/jpeg",
      remark,
      new Date()
    );

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error during upload." },
      { status: 500 }
    );
  }
}