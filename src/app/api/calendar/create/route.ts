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
  const { summary, description, start, end, location, accountId } = body;

  if (!summary || !start || !end) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const { client: calendar } = await getGoogleClient((session.user as any).id, "calendar", accountId) as any;

    const event: any = {
      summary,
      start: { dateTime: start },
      end: { dateTime: end },
    };
    
    if (description) event.description = description;
    if (location) event.location = location;

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    console.log("Event created successfully:", response.data);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error creating event:", error);
    if (error.response) {
      console.error("Google API Error Data:", error.response.data);
    }
    return NextResponse.json({ error: "Failed to create event", details: error.message }, { status: 500 });
  }
}
