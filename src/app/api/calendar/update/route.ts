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
  const { eventId, summary, description, start, end, location, accountId } = body;

  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
  }

  try {
    const { client: calendar } = await getGoogleClient((session.user as any).id, "calendar", accountId) as any;

    const eventPatch: any = {};
    if (summary) eventPatch.summary = summary;
    if (description !== undefined) eventPatch.description = description;
    if (location !== undefined) eventPatch.location = location;
    if (start) eventPatch.start = { dateTime: start };
    if (end) eventPatch.end = { dateTime: end };

    const response = await calendar.events.patch({
      calendarId: "primary",
      eventId: eventId,
      requestBody: eventPatch,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}
