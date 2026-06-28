import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// PUT /api/fund-usage/[id] - Update fund usage report (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Hanya admin yang dapat mengubah laporan penggunaan dana" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await db.fundUsage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Laporan penggunaan dana tidak ditemukan" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { description, amount, date, documentUrl } = body;

    if (!description || !amount) {
      return NextResponse.json(
        { error: "Field wajib: description, amount" },
        { status: 400 }
      );
    }

    const fundUsage = await db.fundUsage.update({
      where: { id },
      data: {
        description,
        amount: Number(amount),
        date: date ? new Date(date) : existing.date,
        // documentUrl hanya diganti kalau ada nilai baru yang dikirim;
        // kalau tidak ada file baru diupload saat edit, bukti lama tetap dipertahankan.
        documentUrl: documentUrl !== undefined ? documentUrl : existing.documentUrl,
      },
    });

    return NextResponse.json({ fundUsage }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/fund-usage/[id] - Delete fund usage report (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Hanya admin yang dapat menghapus laporan penggunaan dana" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await db.fundUsage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Laporan penggunaan dana tidak ditemukan" },
        { status: 404 }
      );
    }

    await db.fundUsage.delete({ where: { id } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}