import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getGoogleClient } from "@/lib/google";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { title, notes, accountId } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    const { client: tasks } = await getGoogleClient((session.user as any).id, "tasks", accountId) as any;

    // Get the default task list
    const taskLists = await tasks.tasklists.list({ maxResults: 1 });
    const taskListId = taskLists.data.items?.[0]?.id;

    if (!taskListId) {
      return NextResponse.json({ error: "No task list found" }, { status: 404 });
    }

    const response = await tasks.tasks.insert({
      tasklist: taskListId,
      requestBody: {
        title,
        notes,
      },
    });

    console.log("Task created successfully:", response.data);
    return NextResponse.json({ ...response.data, taskListId });
  } catch (error: any) {
    console.error("Error creating task:", error);
    // Log detailed Google API error
    if (error.response) {
      console.error("Google API Error Data:", error.response.data);
    }
    return NextResponse.json({ error: "Failed to create task", details: error.message }, { status: 500 });
  }
}
