import type { Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

// Augment NextAuth's default types with the custom fields this app stores on the
// session user and the JWT (set in the callbacks in src/lib/auth.ts).
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role | string;
      cityId: string;
      image?: string | null;
    };
  }

  interface User {
    role?: Role | string;
    cityId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role | string;
    cityId?: string;
  }
}
