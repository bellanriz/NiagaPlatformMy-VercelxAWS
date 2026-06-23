import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const result = await query<{
          id: string;
          email: string;
          name: string;
          role: string;
          org_id: string;
          org_name: string;
          org_slug: string;
          password_hash: string;
        }>(
          `SELECT u.id, u.email, u.name, u.role, u.org_id, u.password_hash,
                  o.name as org_name, o.slug as org_slug
           FROM users u
           JOIN organizations o ON u.org_id = o.id
           WHERE u.email = $1 AND u.is_active = true`,
          [email]
        );

        if (result.rows.length === 0) return null;

        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;

        // Update last login
        await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [
          user.id,
        ]);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.org_id,
          orgName: user.org_name,
          orgSlug: user.org_slug,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.orgId = (user as any).orgId;
        token.orgName = (user as any).orgName;
        token.orgSlug = (user as any).orgSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).orgId = token.orgId;
        (session.user as any).orgName = token.orgName;
        (session.user as any).orgSlug = token.orgSlug;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
});
