import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { compareSync } from 'bcryptjs';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      department: string;
      managerId: string | null;
      avatarColor: string;
    };
  }
  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    managerId: string | null;
    avatarColor: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    department: string;
    managerId: string | null;
    avatarColor: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        seedDatabase();
        const db = getDb();
        const user = db
          .prepare('SELECT * FROM users WHERE email = ?')
          .get(credentials.email) as {
          id: string;
          name: string;
          email: string;
          password_hash: string;
          role: string;
          department: string;
          manager_id: string | null;
          avatar_color: string;
        } | undefined;

        if (!user) return null;
        const valid = compareSync(credentials.password, user.password_hash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          managerId: user.manager_id,
          avatarColor: user.avatar_color,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.department = user.department;
        token.managerId = user.managerId;
        token.avatarColor = user.avatarColor;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.department = token.department;
      session.user.managerId = token.managerId;
      session.user.avatarColor = token.avatarColor;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'atomquest-hackathon-secret-key-2026',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
