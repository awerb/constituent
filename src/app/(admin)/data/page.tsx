"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

export default function DataPage() {
  const exportQuery = trpc.admin.prepareDataExport.useQuery(undefined, {
    staleTime: 120 * 1000,
  });

  const privacyQueue = trpc.admin.getPrivacyQueue.useQuery(undefined, {
    staleTime: 60 * 1000,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "FAILED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  if (exportQuery.isLoading || privacyQueue.isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Data Management</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const exportData = exportQuery.data;
  const requests = privacyQueue.data || [];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Data Management</h1>
        <p className="text-muted-foreground mt-2">
          Export data and manage privacy requests
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="export" className="space-y-4">
        <TabsList className="grid w-auto grid-cols-3">
          <TabsTrigger value="export">Data Export</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Requests</TabsTrigger>
          <TabsTrigger value="foia">FOIA</TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export All Data</CardTitle>
              <CardDescription>
                Download a complete snapshot of your system data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Cases</p>
                  <p className="text-2xl font-bold">{exportData?.caseCount || 0}</p>
                </div>
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Constituents</p>
                  <p className="text-2xl font-bold">
                    {exportData?.constituentCount || 0}
                  </p>
                </div>
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Messages</p>
                  <p className="text-2xl font-bold">
                    {exportData?.messageCount || 0}
                  </p>
                </div>
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Users</p>
                  <p className="text-2xl font-bold">{exportData?.userCount || 0}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full" size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  Export as CSV
                </Button>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export as JSON
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  Exports are provided in compliance with data protection
                  regulations. Ensure proper data handling and security.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Requests Tab */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Requests</CardTitle>
              <CardDescription>
                {requests.length} request{requests.length !== 1 ? "s" : ""} pending
                review
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No pending privacy requests
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Request Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request: any) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.email}
                          </TableCell>
                          <TableCell>
                            {request.requestType === "export"
                              ? "Export Data"
                              : "Delete Data"}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(
                              new Date(request.createdAt),
                              "MMM d, yyyy"
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(
                              new Date(request.dueDate),
                              "MMM d, yyyy"
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FOIA Tab */}
        <TabsContent value="foia">
          <Card>
            <CardHeader>
              <CardTitle>FOIA Requests</CardTitle>
              <CardDescription>
                Track Freedom of Information Act requests
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No FOIA requests pending
              </p>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Manage FOIA
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
