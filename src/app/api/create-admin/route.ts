// app/api/create-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    return null;
  }
  return session;
}

// GET /api/create-admin → daftar semua admin
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 403 });
  }

  const admins = await db.user.findMany({
    where: { role: "admin" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ admins });
}

// POST /api/create-admin → tambah admin baru
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json(
      { error: "Anda tidak memiliki akses untuk menambah admin." },
      { status: 403 }
    );
  }

  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email, dan password wajib diisi." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await db.user.create({
      data: { name, email, password: hashedPassword, role: "admin", isVerified: true },
    });

    return NextResponse.json({
      message: "Admin baru berhasil ditambahkan.",
      admin: { id: newAdmin.id, name: newAdmin.name, email: newAdmin.email },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menambahkan admin." },
      { status: 500 }
    );
  }
}