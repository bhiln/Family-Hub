import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }: any) {
      return true;
    },
    async session({ session, user }: any) {
      if (session.user) {
        (session.user as any).id = user.id;
        
        // Fetch all linked Google accounts for this user
        const accounts = await prisma.account.findMany({
          where: { userId: user.id, provider: "google" },
        });

        // De-duplicate accounts by providerAccountId
        const seen = new Set();
        const uniqueAccounts = accounts.filter(acc => {
          if (seen.has(acc.providerAccountId)) return false;
          seen.add(acc.providerAccountId);
          return true;
        });
        
        (session as any).accounts = uniqueAccounts.map(acc => ({
          id: acc.id,
          email: acc.email || session.user.email,
          image: acc.image || session.user.image,
          name: acc.name || session.user.name
        }));

        const primaryAccount = uniqueAccounts[0];
        if (primaryAccount) {
          session.accessToken = primaryAccount.access_token;
        }
      }
      return session;
    },
  },
  events: {
    async linkAccount({ account, profile }: any) {
      // This is called when a new account is linked to a user
      await prisma.account.update({
        where: { id: account.id },
        data: {
          email: profile.email,
          name: profile.name,
          image: profile.picture || profile.image,
        },
      });
    },
    async createUser({ user }: any) {
      // Logic for when a user is first created could go here if needed
    }
  },
  pages: {
    signIn: "/auth/signin",
  },
};
