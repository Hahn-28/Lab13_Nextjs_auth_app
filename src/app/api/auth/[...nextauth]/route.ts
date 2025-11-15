import { getUserByEmail, isLocked, recordFailedAttempt, resetFailedAttempts, verifyPassword } from "@/lib/users";
import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_ID as string,
            clientSecret: process.env.GITHUB_SECRET as string,
        }),
        CredentialsProvider({
            name: 'Credenciales',
            credentials: {
                email: { label: 'Email', type: 'email', placeholder: 'tu@correo.com' },
                password: { label: 'Contraseña', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                const user = getUserByEmail(credentials.email);
                if (!user) return null; // usuario no encontrado
                if (isLocked(user)) {
                    // bloqueado actualmente
                    return null;
                }
                const ok = await verifyPassword(user, credentials.password);
                if (!ok) {
                    recordFailedAttempt(user);
                    return null;
                }
                resetFailedAttempts(user);
                return { id: user.id, email: user.email };
            }
        })
    ],
    pages: {
        signIn: '/signIn'
    },
    session: { strategy: 'jwt' },
    callbacks: {
        async jwt({ token, user }) {
            // Cuando se crea el token incluir id del usuario
            if (user) {
                token.id = (user as any).id;
            }
            return token;
        },
        async session({ session, token }) {
            // Propagar id al objeto session.user
            if (token?.id && session.user) {
                (session.user as any).id = token.id as string;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

