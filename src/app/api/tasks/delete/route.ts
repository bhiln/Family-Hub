import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getGoogleClient } from "@/lib/google";

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");
  const taskListIdParam = searchParams.get("taskListId");
  const accountId = searchParams.get("accountId") || undefined;

  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  try {
    const { client: tasks } = await getGoogleClient((session.user as any).id, "tasks", accountId) as any;

    let finalTaskListId = taskListIdParam;
    if (!finalTaskListId) {
       const taskLists = await tasks.tasklists.list({ maxResults: 1 });
       finalTaskListId = taskLists.data.items?.[0]?.id;
    }

    await tasks.tasks.delete({
      tasklist: finalTaskListId,
      task: taskId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
