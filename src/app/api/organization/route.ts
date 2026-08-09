import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/organizations - Ambil semua nama organisasi yang pernah diinput
export async function GET() {
  try {
    const organizations = await db.organization.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    });

    // Return array of strings supaya cocok dengan parsing di frontend
    return NextResponse.json(organizations.map((o) => o.name));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/organizations - Simpan nama organisasi baru (kalau belum ada)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "Nama organisasi wajib diisi" }, { status: 400 });
    }

    // upsert: kalau nama sudah ada, tidak error & tidak duplikat
    const organization = await db.organization.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    return NextResponse.json({ organization }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}