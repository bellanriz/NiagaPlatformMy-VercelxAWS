import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const result = await query<{
          id: string
          email: string
          password_hash: string
          name: string
          role: string
          org_id: string
          org_name: string
          org_slug: string
        }>(
          `SELECT u.id, u.email, u.password_hash, u.name, u.role, u.org_id,
                  o.name as org_name, o.slug as org_slug
           FROM users u
           JOIN organizations o ON o.id = u.org_id
           WHERE u.email = $1`,
          [email]
        )

        const user = result.rows[0]
        if (!user) return null

        const passwordMatch = await bcrypt.compare(password, user.password_hash)
        if (!passwordMatch) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.org_id,
          orgName: user.org_name,
          orgSlug: user.org_slug,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as Record<string, unknown>).role as string
        token.orgId = (user as Record<string, unknown>).orgId as string
        token.orgName = (user as Record<string, unknown>).orgName as string
        token.orgSlug = (user as Record<string, unknown>).orgSlug as string
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        ;(session.user as Record<string, unknown>).role = token.role
        ;(session.user as Record<string, unknown>).orgId = token.orgId
        ;(session.user as Record<string, unknown>).orgName = token.orgName
        ;(session.user as Record<string, unknown>).orgSlug = token.orgSlug
      }
      return session
    },
  },
})
