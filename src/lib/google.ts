import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export async function getGoogleClient(userId: string, service: "calendar" | "tasks", accountId?: string) {
  let account;

  console.log(`getGoogleClient called for userId: ${userId}, service: ${service}, accountId: ${accountId}`);

  if (accountId) {
    account = await prisma.account.findUnique({
      where: { id: accountId },
    });
  } else {
    // Default to the first Google account linked to the user
    account = await prisma.account.findFirst({
      where: { userId, provider: "google" },
    });
  }

  if (!account) {
    console.error("No linked Google account found for user:", userId);
    throw new Error("No linked Google account found");
  }

  console.log(`Using account: ${account.id} (${account.providerAccountId})`);

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  auth.setCredentials({
    access_token: account.access_token as string,
    refresh_token: account.refresh_token as string,
  });

  if (service === "calendar") {
    return { client: google.calendar({ version: "v3", auth }), account };
  } else {
    return { client: google.tasks({ version: "v1", auth }), account };
  }
}
