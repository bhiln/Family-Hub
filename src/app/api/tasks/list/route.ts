import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accounts = await prisma.account.findMany({
    where: { 
      userId: (session.user as any).id,
      provider: "google"
    },
  });

  if (accounts.length === 0) {
    return NextResponse.json({ error: "No Google accounts linked" }, { status: 400 });
  }

  const allTasks: any[] = [];

  for (const account of accounts) {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ 
      access_token: account.access_token as string,
      refresh_token: account.refresh_token as string
    });

    const tasks = google.tasks({ version: "v1", auth });

    try {
      const taskListsResponse = await tasks.tasklists.list({ maxResults: 10 });
      const lists = taskListsResponse.data.items || [];

      for (const list of lists) {
        const tasksResponse = await tasks.tasks.list({
          tasklist: list.id!,
          maxResults: 20,
          showCompleted: false,
        });

        if (tasksResponse.data.items) {
          const tasksWithListId = tasksResponse.data.items.map(t => ({
            ...t,
            taskListId: list.id, // Attach the list ID
            accountId: account.id // Attach the internal account ID
          }));
          allTasks.push(...tasksWithListId);
        }
      }
    } catch (error) {
      console.error(`Error fetching tasks for account ${account.id}:`, error);
    }
  }

  return NextResponse.json(allTasks);
}
