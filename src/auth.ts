import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { credentialsSchema } from "@/server/authModel";
import { getUserJwt } from "@/server/authRepository";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, // Trust proxy headers from Caddy
  providers: [
    Credentials({
      async authorize(credentials) {
        // Validate credentials with Zod schema
        const validatedFields = credentialsSchema.safeParse(credentials);

        if (validatedFields.success) {
          return validatedFields.data;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") return false;
      return user.isActive;
    },
    async jwt({ token, trigger }) {
      if (!token.sub) return token;

      // Only fetch user data on sign in or when explicitly updating (not on every token check)
      // This prevents database calls in Edge runtime middleware
      if (trigger === "signIn" || trigger === "update") {
        const user = await getUserJwt(token.sub);

        // If user not found or inactive, clear the token to invalidate the session
        if (!user || !user.isActive) {
          // Return empty token which will cause sign out
          return {} as typeof token;
        }

        // Update token with current user data
        token.id = user.id;
        token.npk = user.npk;
        token.role = user.role;
        token.isActive = user.isActive;
      }

      return token;
    },
    async session({ session, token }) {
      // If token is invalid, return null to invalidate session
      if (!token || !token.id) {
        throw new Error("Invalid session");
      }

      if (session.user) {
        session.user.id = token.id as string;
        session.user.npk = token.npk as string;
        session.user.role = token.role as string;
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    },
  },
  // Configure session strategy and token settings
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: "authjs.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: false },
    },
    callbackUrl: {
      name: "authjs.callback-url",
      options: { sameSite: "lax", path: "/", secure: false },
    },
    csrfToken: {
      name: "authjs.csrf-token",
      options: { sameSite: "lax", path: "/", secure: false },
    },
  },
});
