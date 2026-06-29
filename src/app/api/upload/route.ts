import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

// Konfigurasi Cloudinary menggunakan environment variables
// Pastikan CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
// sudah diisi di file .env.local
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/upload - Upload file(s) ke Cloudinary
// Supports single or multiple files
// Form field name: "file" untuk single, "files" untuk multiple
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    // Optional: tentukan folder tujuan di Cloudinary lewat form field "folder"
    // Contoh dari frontend: formData.append("folder", "donations")
    // Kalau tidak dikirim, defaultnya masuk ke folder "polinescare/misc"
    const folderInput = (formData.get("folder") as string | null) ?? "misc";
    const targetFolder = `polinescare/${folderInput}`;

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

    const uploadedUrls: string[] = [];

    for (const file of filesToProcess) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate nama file unik (tetap dipertahankan biar tidak ada konflik nama)
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const publicId = `${timestamp}-${randomStr}`;

      // Upload buffer ke Cloudinary
      // resource_type: "auto" -> Cloudinary otomatis deteksi apakah ini image atau pdf/raw file
      const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: targetFolder,
              public_id: publicId,
              resource_type: "auto",
              // Otomatis compress gambar tanpa mengubah kualitas yang terlihat
              quality: "auto",
            },
            (error, result) => {
              if (error) return reject(error);
              if (!result) return reject(new Error("Upload ke Cloudinary gagal, tidak ada hasil"));
              resolve(result as { secure_url: string });
            }
          )
          .end(buffer);
      });

      uploadedUrls.push(uploadResult.secure_url);
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