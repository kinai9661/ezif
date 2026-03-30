import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getAdminPasswordHash, setAdminPasswordHash } from '../../../lib/kv';
import { createHash } from 'crypto';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async signIn({ user }: any) {
      // 檢查 Google 帳號是否在白名單中
      const allowedEmails = (process.env.GOOGLE_ALLOWED_EMAILS || '').split(',').map(e => e.trim());
      if (allowedEmails.length > 0 && !allowedEmails.includes(user.email)) {
        return false;
      }
      return true;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.email = token.email;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
