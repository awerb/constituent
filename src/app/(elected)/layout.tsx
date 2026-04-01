import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function ElectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  // Check if user is elected official or higher
  const userRole = (session.user as any).role as Role;
  if (![Role.ELECTED_OFFICIAL, Role.ADMIN, Role.SUPER_ADMIN].includes(userRole)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={session.user} electedMode={true} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
