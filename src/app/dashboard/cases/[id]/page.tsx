"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { CaseDetail } from "@/components/cases/CaseDetail";
import type { CaseWithRelations } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const caseId = params?.id as string;
  const currentUserId = (session?.user as { id?: string } | undefined)?.id ?? "";

  const caseQuery = trpc.cases.getById.useQuery(
    { id: caseId },
    {
      enabled: !!caseId,
      staleTime: 30 * 1000,
    }
  );

  const setViewerMutation = trpc.cases.setViewing.useMutation();

  // Register viewer for collision detection
  useEffect(() => {
    if (!caseId) {
      return;
    }
    setViewerMutation.mutate({ caseId, isViewing: true });

    return () => {
      setViewerMutation.mutate({ caseId, isViewing: false });
    };
  }, [caseId]);

  if (!caseId) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <p className="text-muted-foreground">Case not found</p>
      </div>
    );
  }

  if (caseQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="outline" disabled className="w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="space-y-4">
          <Skeleton className="h-12 w-48 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  if (caseQuery.error || !caseQuery.data) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()} className="w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">
            {caseQuery.error?.message || "Case not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()} className="w-fit">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <CaseDetail
        caseData={caseQuery.data as unknown as CaseWithRelations}
        currentUserId={currentUserId}
      />
    </div>
  );
}
