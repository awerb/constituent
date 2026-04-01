import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SetupWizard } from "@/components/SetupWizard";

export default async function SetupPage() {
  // Check if setup is needed (no city exists)
  const cityCount = await prisma.city.count();

  if (cityCount > 0) {
    redirect("/dashboard");
  }

  return (
    <div className="w-full">
      <SetupWizard />
    </div>
  );
}
