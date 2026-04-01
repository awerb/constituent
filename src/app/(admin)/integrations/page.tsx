"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit2, Trash2, Copy, Eye, EyeOff } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function IntegrationsPage() {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const webhooksQuery = trpc.admin.listWebhooks.useQuery(undefined, {
    staleTime: 60 * 1000,
  });

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (webhooksQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Integrations</h1>
          <Skeleton className="w-32 h-10 rounded-lg" />
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const webhooks = webhooksQuery.data || [];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground mt-2">
            Configure webhooks and external integrations
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Webhook
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Webhooks</CardTitle>
            <CardDescription>Send case events to external systems</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Newsletter Integration</CardTitle>
            <CardDescription>
              Import flagged items from your newsletter
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>
            {webhooks.length} webhook{webhooks.length !== 1 ? "s" : ""} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No webhooks configured</p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Webhook
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook: any) => (
                <div
                  key={webhook.id}
                  className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{webhook.url}</h4>
                      <p className="text-sm text-muted-foreground">
                        Events: {webhook.events?.join(", ") || "All"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={webhook.isActive ? "default" : "secondary"}
                        className={
                          webhook.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                        }
                      >
                        {webhook.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Secret</label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets[webhook.id] ? "text" : "password"}
                        value={webhook.secret}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSecretVisibility(webhook.id)}
                        className="w-10 h-10 p-0"
                      >
                        {showSecrets[webhook.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(webhook.secret);
                        }}
                        className="w-10 h-10 p-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last delivered: {webhook.lastDeliveredAt || "Never"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Newsletter */}
      <Card>
        <CardHeader>
          <CardTitle>Newsletter Integration</CardTitle>
          <CardDescription>
            Automatically import flagged newsletter items as cases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Enable Newsletter Import</p>
              <p className="text-sm text-muted-foreground">
                Flagged items will be imported as new cases
              </p>
            </div>
            <Switch />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newsletterKey">Newsletter API Key</Label>
            <Input
              id="newsletterKey"
              type="password"
              placeholder="••••••••••••••••"
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from your newsletter provider
            </p>
          </div>

          <Button>Save Newsletter Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
