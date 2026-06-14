"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Mail } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useMagicLink, setUseMagicLink] = useState(false);

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsMagicLinkLoading(true);

    try {
      const result = await signIn("email", {
        email: credentials.email,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        setError(null);
        setCredentials({ email: "", password: "" });
        setUseMagicLink(false);
        alert("Check your email for a sign-in link!");
      }
    } catch (err) {
      setError("An error occurred sending the magic link");
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>
          {useMagicLink
            ? "Enter your email to receive a sign-in link"
            : "Enter your credentials to access your dashboard"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={useMagicLink ? handleMagicLinkSignIn : handlePasswordSignIn}
          className="space-y-4"
        >
          {error && (
            <div className="flex gap-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={credentials.email}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
              required
              disabled={isLoading || isMagicLinkLoading}
              autoComplete="email"
            />
          </div>

          {!useMagicLink && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
                disabled={isLoading || isMagicLinkLoading}
                autoComplete="current-password"
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || isMagicLinkLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing In...
              </>
            ) : isMagicLinkLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending Link...
              </>
            ) : useMagicLink ? (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Magic Link
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setUseMagicLink(!useMagicLink);
              setError(null);
              setCredentials((prev) => ({ ...prev, password: "" }));
            }}
            disabled={isLoading || isMagicLinkLoading}
          >
            {useMagicLink
              ? "Use Password Instead"
              : "Sign in with Magic Link"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/auth/setup" className="text-primary hover:underline">
            Start Setup
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
