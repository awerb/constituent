import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { city: true },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        if (!user.isActive) {
          throw new Error("User account is inactive");
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!passwordMatch) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          cityId: user.cityId,
        };
      },
    }),
    ...(process.env.EMAIL_FROM
      ? [
          EmailProvider({
            server: {
              host: process.env.EMAIL_SERVER_HOST || "",
              port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
              auth: {
                user: process.env.EMAIL_SERVER_USER || "",
                pass: process.env.EMAIL_SERVER_PASSWORD || "",
              },
            },
            from: process.env.EMAIL_FROM,
            async sendVerificationRequest({
              identifier: email,
              url,
              provider,
            }) {
              const { nodemailer } = await import("nodemailer");
              const transport = nodemailer.createTransport({
                host: process.env.EMAIL_SERVER_HOST,
                port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
                auth: {
                  user: process.env.EMAIL_SERVER_USER,
                  pass: process.env.EMAIL_SERVER_PASSWORD,
                },
              });

              const result = await transport.sendMail({
                to: email,
                from: process.env.EMAIL_FROM,
                subject: "Sign in to Constituent Response",
                html: `<p>Click the link below to sign in:</p><p><a href="${url}">${url}</a></p>`,
                text: `Sign in link: ${url}`,
              });

              if (result.error) {
                throw new Error("Nodemailer error: send failed");
              }
            },
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account, profile, isNewUser }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role || Role.AGENT;
        token.cityId = (user as { cityId: string }).cityId;
      }

      // Refresh user data on each session check
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, cityId: true, isActive: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.cityId = dbUser.cityId;
          if (!dbUser.isActive) {
            return null;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub || "";
        (session.user as { role: Role }).role = (token.role as Role) || Role.AGENT;
        (session.user as { cityId: string }).cityId = (token.cityId as string) || "";
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      // Allow sign in if user exists and is active
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isActive: true },
        });

        return !!dbUser?.isActive;
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after sign in
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      return baseUrl;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log sign-in event
      if (user?.id && user.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { cityId: true },
          });

          if (dbUser) {
            await prisma.auditLog.create({
              data: {
                cityId: dbUser.cityId,
                userId: user.id,
                action: "SIGN_IN",
                resourceType: "User",
                resourceId: user.id,
              },
            });
          }
        } catch (error) {
          console.error("Failed to log sign-in event:", error);
        }
      }
    },
  },
};

export async function getSessionWithUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { department: true, city: true },
  });

  return { ...session, user };
}
