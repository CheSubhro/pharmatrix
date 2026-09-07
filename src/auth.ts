
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyPassword } from "@/services/auth.service";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        const user = await User.findOne({ email });

        if (!user) {
          return null;
        }

        if (!user.isActive) {
          return null;
        }

        const isPasswordValid = await verifyPassword(
          password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.role = user.role;
    }

    return token;
  },

  async session({ session, token }) {
    if (session.user && token.sub) {
      session.user.id = token.sub;
      session.user.role = token.role!;
    }

    return session;
  },
},

  pages: {
    signIn: "/login",
  },
});