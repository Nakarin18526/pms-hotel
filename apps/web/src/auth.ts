import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET,
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Credentials({
      id: "guest-credentials",
      name: "Guest Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const r = await fetch(`${API}/api/auth/guest/login`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: creds?.email,
            password: creds?.password,
          }),
        });
        if (!r.ok) return null;
        const data = await r.json();
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          apiToken: data.token,
        } as any;
      },
    }),
    Credentials({
      id: "admin-credentials",
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const r = await fetch(`${API}/api/auth/admin/login`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: creds?.email,
            password: creds?.password,
          }),
        });
        if (!r.ok) return null;
        const data = await r.json();
        // Decode adminRole from the JWT (issued by API based on email).
        // We parse rather than refetch — already in token.
        let adminRole: "SUPER_ADMIN" | "STAFF" = "SUPER_ADMIN";
        try {
          const payloadB64 = data.token.split(".")[1];
          const payload = JSON.parse(
            Buffer.from(payloadB64, "base64").toString("utf-8"),
          );
          if (payload.adminRole === "STAFF") adminRole = "STAFF";
        } catch {
          /* fall back to SUPER_ADMIN */
        }
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          adminRole,
          apiToken: data.token,
        } as any;
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                // Force account chooser every time so user can pick a different email
                prompt: "select_account",
              },
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        const r = await fetch(`${API}/api/auth/guest/google`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            idToken: account.id_token ?? "",
          }),
        });
        if (!r.ok) return false;
        const data = await r.json();
        (user as any).id = data.user.id;
        (user as any).role = "GUEST";
        (user as any).apiToken = data.token;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role ?? "GUEST";
        token.adminRole = (user as any).adminRole;
        token.apiToken = (user as any).apiToken;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).user = {
        ...session.user,
        id: token.id,
        role: token.role,
        adminRole: token.adminRole,
      };
      (session as any).apiToken = token.apiToken;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
