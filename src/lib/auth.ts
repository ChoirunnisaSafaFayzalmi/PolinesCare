import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id;
      token.role = (user as { role?: string }).role ?? "user";
    }
    return token;
  },
  async session({ session, token }) {
    if (session.user) {
      (session.user as { id?: string }).id = token.id as string;
      (session.user as { role?: string }).role = token.role as string;
    }
    return session;
  },
},
session: {
  strategy: "jwt",
},
pages: {
  signIn: "/login",
},
secret: process.env.NEXTAUTH_SECRET || "polines-care-secret-key-change-in-production",
};

export const auth = () => getServerSession(authOptions);
// baris export signIn/signOut dihapus
// export { signIn, signOut } from "next-auth";
