import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// POST /api/upload - Upload file(s)
// Supports single or multiple files
// Form field name: "file" for single, "files" for multiple
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    // Support both single "file" and multiple "files"
    const singleFile = formData.get("file") as File | null;
    const multipleFiles = formData.getAll("files") as File[];

    const filesToProcess: File[] = [];
    if (singleFile) filesToProcess.push(singleFile);
    if (multipleFiles.length > 0) filesToProcess.push(...multipleFiles);

    if (filesToProcess.length === 0) {
      return NextResponse.json({ error: "Tidak ada file yang diupload" }, { status: 400 });
    }

    // Validate file types
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    for (const file of filesToProcess) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Tipe file tidak didukung: ${file.name}. Gunakan JPG, PNG, WEBP, atau PDF.` },
          { status: 400 }
        );
      }
      // Max 5MB per file
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File terlalu besar: ${file.name}. Maksimal 5MB.` },
          { status: 400 }
        );
      }
    }

    // Create upload directory if not exists
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const uploadedUrls: string[] = [];

    for (const file of filesToProcess) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const ext = file.name.split(".").pop();
      const filename = `${timestamp}-${randomStr}.${ext}`;

      const filepath = join(uploadDir, filename);
      await writeFile(filepath, buffer);

      uploadedUrls.push(`/uploads/${filename}`);
    }

    // Return single URL or array depending on upload type
    if (singleFile && uploadedUrls.length === 1) {
      return NextResponse.json({ url: uploadedUrls[0] }, { status: 201 });
    }

    return NextResponse.json({ urls: uploadedUrls }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}