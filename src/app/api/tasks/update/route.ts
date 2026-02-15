import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getGoogleClient } from "@/lib/google";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { taskId, taskListId, status, title, notes, accountId } = body;

  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  try {
    const { client: tasks } = await getGoogleClient((session.user as any).id, "tasks", accountId) as any;

    // Use provided taskListId or fetch default
    let finalTaskListId = taskListId;
    if (!finalTaskListId) {
       const taskLists = await tasks.tasklists.list({ maxResults: 1 });
       finalTaskListId = taskLists.data.items?.[0]?.id;
    }

    const response = await tasks.tasks.patch({
      tasklist: finalTaskListId,
      task: taskId,
      requestBody: {
        status, // 'needsAction' or 'completed'
        title,
        notes
      },
    });

    console.log("Task updated successfully:", response.data);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error updating task:", error);
    if (error.response) {
      console.error("Google API Error Data:", error.response.data);
    }
    return NextResponse.json({ error: "Failed to update task", details: error.message }, { status: 500 });
  }
}
