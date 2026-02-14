import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");

  if (!accountId) {
    return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
  }

  try {
    // Ensure the account belongs to the current user before deleting
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: (session.user as any).id,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found or unauthorized" }, { status: 404 });
    }

    await prisma.account.delete({
      where: { id: accountId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unlinking account:", error);
    return NextResponse.json({ error: "Failed to unlink account" }, { status: 500 });
  }
}
