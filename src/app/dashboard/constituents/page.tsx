"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ConstituentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const constituentsQuery = trpc.constituents.listConstituents.useQuery(
    {
      limit: 100,
      offset: 0,
      search: search || undefined,
    },
    { staleTime: 60 * 1000 }
  );

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

  if (constituentsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Constituents</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Skeleton className="h-10 w-full pl-10" />
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const constituents = constituentsQuery.data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Constituents</h1>
        <p className="text-muted-foreground mt-2">
          {constituents.length} constituent{constituents.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search constituents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        {constituents.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No constituents found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Cases</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Privacy Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {constituents.map((constituent: any) => (
                  <TableRow
                    key={constituent.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() =>
                      router.push(`/dashboard/constituents/${constituent.id}`)
                    }
                  >
                    <TableCell className="font-medium">
                      {constituent.name}
                    </TableCell>
                    <TableCell className="text-sm">{constituent.email}</TableCell>
                    <TableCell className="text-sm">
                      {constituent.phone || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {constituent._count?.cases || 0}
                    </TableCell>
                    <TableCell className="text-sm">
                      {constituent.preferredLanguage || "English"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPrivacyStatusColor(constituent.privacyStatus)}>
                        {constituent.privacyStatus.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
