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

  // Get all linked Google accounts for this user
  const accounts = await prisma.account.findMany({
    where: { 
      userId: (session.user as any).id,
      provider: "google"
    },
  });

  if (accounts.length === 0) {
    return NextResponse.json({ error: "No Google accounts linked" }, { status: 400 });
  }

  const allEvents: any[] = [];

  for (const account of accounts) {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ 
      access_token: account.access_token as string,
      refresh_token: account.refresh_token as string
    });

    const calendar = google.calendar({ version: "v3", auth });

    try {
      // 1. Fetch calendar list to get calendar-level colors
      const calendarListRes = await calendar.calendarList.list();
      const calendarColors: Record<string, string> = {};
      
      if (calendarListRes.data.items) {
        calendarListRes.data.items.forEach((cal) => {
           if (cal.id && cal.backgroundColor) {
             calendarColors[cal.id] = cal.backgroundColor;
           }
        });
      }

      // 2. Fetch events from primary calendar
      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 20,
        singleEvents: true,
        orderBy: "startTime",
      });

      if (response.data.items) {
        // 3. Attach calendar color if event color is missing
        const eventsWithColors = response.data.items.map((event) => ({
          ...event,
          accountId: account.id, // Attach internal account ID for operations
          calendarColor: calendarColors["primary"] || calendarColors[event.organizer?.email || ""] || "#4285F4" 
        }));
        allEvents.push(...eventsWithColors);
      }
    } catch (error) {
      console.error(`Error fetching events for account ${account.id}:`, error);
    }
  }

  // Sort aggregated events by start time
  allEvents.sort((a, b) => {
    const startA = a.start?.dateTime || a.start?.date;
    const startB = b.start?.dateTime || b.start?.date;
    return new Date(startA).getTime() - new Date(startB).getTime();
  });

  return NextResponse.json(allEvents);
}
