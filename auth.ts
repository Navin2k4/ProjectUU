import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { db } from "./lib/db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getUserById } from "./data/user";
import "next-auth/jwt"
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User{
    role: UserRole;
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  pages:{
    error: "/auth/error",
    signIn: "/auth/login",
  },
  session: { strategy: "jwt" },
  events:{
    async linkAccount({user}){
      await db.user.update({
        where:{id: user.id},
        data:{emailVerified: new Date()}
      })
    }
  },
  callbacks: {
    async signIn({user, account}){
      // Allow Oauth without Email verification
      if(account?.provider !== "credentials") return true;

      const existingUser = await getUserById(user.id as string);
      // Prevent Signin without email verification
      
      if(!existingUser?.emailVerified) return false;
      
      //TODO: 2FA
      
      return true;
    },
    async session({ token, session }) {
      console.log({
        sessionToken: token,
        session,
      });
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role;
      }
      return session;
    },
    // Everuthing starts from the token
    async jwt({ token }) {
      if (!token.sub) return token;
      const existingUser = await getUserById(token.sub);
      if (!existingUser) return token;
      token.role = existingUser.role;
      return token;
    },
  },
  adapter: PrismaAdapter(db),
  ...authConfig,
});
