"use client";

import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow, format } from "date-fns";

export default function ConstituentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const constituentId = params?.id as string;

  const constituentQuery = trpc.constituents.getConstituent.useQuery(
    { id: constituentId },
    {
      enabled: !!constituentId,
      staleTime: 60 * 1000,
    }
  );

  if (!constituentId) {
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
        <p className="text-muted-foreground">Constituent not found</p>
      </div>
    );
  }

  if (constituentQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="outline" disabled className="w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="space-y-4">
          <Skeleton className="h-12 w-48 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  if (constituentQuery.error || !constituentQuery.data) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()} className="w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <p className="text-red-600 dark:text-red-400">
          {constituentQuery.error?.message || "Constituent not found"}
        </p>
      </div>
    );
  }

  const constituent = constituentQuery.data;
  const cases = constituent.cases || [];

  const getPrivacyStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "DO_NOT_CONTACT":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "DELETION_REQUESTED":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "DELETED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "ASSIGNED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "RESOLVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="w-fit"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{constituent.name}</CardTitle>
              <CardDescription>
                ID: {constituent.id}
              </CardDescription>
            </div>
            <Badge className={getPrivacyStatusColor(constituent.privacyStatus)}>
              {constituent.privacyStatus.replace(/_/g, " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {constituent.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{constituent.email}</p>
                </div>
              </div>
            )}

            {constituent.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{constituent.phone}</p>
                </div>
              </div>
            )}

            {constituent.preferredLanguage && (
              <div>
                <p className="text-sm text-muted-foreground">Preferred Language</p>
                <p className="font-medium">{constituent.preferredLanguage}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {format(new Date(constituent.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>

          {constituent.ward && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">Ward</p>
              <p className="font-medium">{constituent.ward}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Cases</CardTitle>
          <CardDescription>
            {cases.length} case{cases.length !== 1 ? "s" : ""} from this constituent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <p className="text-muted-foreground">No cases</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((caseItem: any) => (
                    <TableRow
                      key={caseItem.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() =>
                        router.push(`/dashboard/cases/${caseItem.id}`)
                      }
                    >
                      <TableCell className="font-mono text-sm">
                        {caseItem.referenceNumber}
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {caseItem.subject}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(caseItem.status)}>
                          {caseItem.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(caseItem.createdAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
