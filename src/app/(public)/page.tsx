import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, FileText, Search } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";

async function getCityName() {
  const cities = await prisma.city.findMany({
    take: 1,
    orderBy: { createdAt: "asc" },
  });
  return cities[0]?.name || "Our City";
}

export default async function PublicLandingPage() {
  const cityName = await getCityName();

  return (
    <div className="space-y-16 py-12">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-balance">
            Contact {cityName}
          </h1>
          <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
            Submit concerns, check case status, or manage your data with ease.
            We're here to help resolve your requests efficiently.
          </p>
        </div>
      </section>

      {/* Action Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Submit a Concern */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Submit a Concern</CardTitle>
              <CardDescription>
                Tell us about your issue and we'll help resolve it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Submit a new request or concern to the appropriate city department.
                You'll receive a reference number to track progress.
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="/submit">
                  Submit Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Check Case Status */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Check Case Status</CardTitle>
              <CardDescription>
                Track the progress of your existing request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Use your reference number to check the current status of your
                submitted request and any updates.
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="/status">
                  Check Status
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Privacy Request */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Privacy Request</CardTitle>
              <CardDescription>
                Export or delete your personal data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Exercise your privacy rights by requesting to download or delete
                all your personal data from our system.
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="/privacy">
                  Privacy Request
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-muted/50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">How It Works</h2>
            <p className="text-muted-foreground">
              We're committed to responding to your requests quickly and
              transparently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">1</div>
              <h3 className="font-semibold">Submit</h3>
              <p className="text-sm text-muted-foreground">
                Fill out a simple form with your concern or request details
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">2</div>
              <h3 className="font-semibold">Track</h3>
              <p className="text-sm text-muted-foreground">
                Use your reference number to monitor progress in real time
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">3</div>
              <h3 className="font-semibold">Resolve</h3>
              <p className="text-sm text-muted-foreground">
                We'll work with you and relevant departments to resolve your issue
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
