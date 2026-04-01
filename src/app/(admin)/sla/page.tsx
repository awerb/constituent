"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit2, Trash2, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function SLAPage() {
  const slaQuery = trpc.admin.getSLAConfig.useQuery(undefined, {
    staleTime: 60 * 1000,
  });

  if (slaQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">SLA Configuration</h1>
          <Skeleton className="w-32 h-10 rounded-lg" />
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const slaConfigs = slaQuery.data || [];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SLA Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Define service level agreements for different case types
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New SLA
        </Button>
      </div>

      {/* Info */}
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            SLA (Service Level Agreement) defines the maximum response time for
            cases based on priority and department. Cases that exceed the SLA
            are marked as breached and highlighted in red.
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {slaConfigs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No SLA configurations yet</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create First SLA
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="w-32">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Response Time
                    </div>
                  </TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slaConfigs.map((sla: any) => (
                  <TableRow key={sla.id}>
                    <TableCell className="font-medium">{sla.name}</TableCell>
                    <TableCell>{sla.priority || "All"}</TableCell>
                    <TableCell>{sla.department?.name || "All"}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {sla.responseDays} day{sla.responseDays !== 1 ? "s" : ""}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Default SLA */}
      <Card>
        <CardHeader>
          <CardTitle>Default Response Time</CardTitle>
          <CardDescription>
            Applied when no specific SLA rule matches
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultDays">Days</Label>
            <Input
              id="defaultDays"
              type="number"
              placeholder="5"
              min="1"
              max="30"
              defaultValue="5"
            />
            <p className="text-xs text-muted-foreground">
              Number of business days to respond
            </p>
          </div>
          <Button>Save Default SLA</Button>
        </CardContent>
      </Card>
    </div>
  );
}
