"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown,
  ChevronUp,
  DollarSign,
  Download,
  Lightbulb,
  Server,
  Zap,
} from "lucide-react";

interface CostEstimatorProps {
  monthlyVolume?: number;
  staffCount?: number;
  citiesHosted?: number;
  aiDraftsThisMonth?: number;
}

export function CostEstimator({
  monthlyVolume = 50,
  staffCount = 3,
  citiesHosted = 1,
  aiDraftsThisMonth = 20,
}: CostEstimatorProps) {
  const [showTips, setShowTips] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);

  // Cost calculations
  const costPerDraft = 0.01;
  const aiCost = aiDraftsThisMonth * costPerDraft;

  // Hosting cost (self-hosted is free, cloud estimated at ~$50-200/month)
  const isCloudHosted = false;
  const hostingCost = isCloudHosted ? 100 : 0; // Assuming self-hosted

  // Email cost (Gmail SMTP is free for < 500/day, estimate SendGrid at ~$10/month if needed)
  const emailCost = 0; // Using Gmail SMTP

  // Total monthly cost
  const totalMonthlyCost = hostingCost + aiCost + emailCost;

  // Calculate potential savings
  const hoursPerResponseManual = 0.25; // 15 minutes
  const hourlyRate = 30; // Conservative estimate for admin/staff
  const responsesPerMonth = monthlyVolume;
  const timeSpentPerMonth = responsesPerMonth * hoursPerResponseManual;
  const costOfTimeSpent = timeSpentPerMonth * hourlyRate;

  // Cost savings with system
  const timeSpentWithSystem = timeSpentPerMonth * 0.5; // 50% time savings with templates/AI
  const timeSaved = timeSpentPerMonth - timeSpentWithSystem;
  const moneySaved = timeSaved * hourlyRate;

  const costSavingsPercentage =
    costOfTimeSpent > 0 ? Math.round((moneySaved / costOfTimeSpent) * 100) : 0;

  // ROI calculation
  const monthlyROI = moneySaved - totalMonthlyCost;
  const annualROI = monthlyROI * 12;

  // Cost reduction tips
  const costReductionTips = [
    {
      title: "Disable AI Drafting",
      description: "Use response templates instead of AI drafts",
      monthlySavings: aiCost,
    },
    {
      title: "Use Gmail SMTP",
      description: "Send emails through Gmail instead of SendGrid (free for < 500/day)",
      monthlySavings: 10,
    },
    {
      title: "Self-Host Database",
      description: "Run PostgreSQL on your existing server instead of cloud database",
      monthlySavings: 50,
    },
  ];

  const downloadCostSummary = () => {
    const content = `CONSTITUENT RESPONSE - COST SUMMARY
${"=".repeat(60)}

MONTHLY COST BREAKDOWN
${"-".repeat(60)}

Hosting:           ${isCloudHosted ? "$" + hostingCost.toFixed(2) : "Self-hosted (free)"}
AI Drafting:       $${aiCost.toFixed(2)} (${aiDraftsThisMonth} drafts x $${costPerDraft})
Email:             ${emailCost === 0 ? "Gmail SMTP (free)" : "$" + emailCost.toFixed(2)}
${"-".repeat(60)}
TOTAL MONTHLY:     $${totalMonthlyCost.toFixed(2)}
ANNUAL COST:       $${(totalMonthlyCost * 12).toFixed(2)}

TIME SAVINGS
${"-".repeat(60)}

Cases handled/month:         ${responsesPerMonth}
Time per response:           ${hoursPerResponseManual * 60} minutes
Total time/month (manual):   ${timeSpentPerMonth.toFixed(1)} hours
Total time/month (w/system): ${timeSpentWithSystem.toFixed(1)} hours
Time saved monthly:          ${timeSaved.toFixed(1)} hours
${"-".repeat(60)}

VALUE OF TIME SAVED
Staff hourly rate:           $${hourlyRate}/hour
Annual time savings value:   $${(moneySaved * 12).toFixed(2)}

ROI ANALYSIS
${"-".repeat(60)}

Monthly Benefit (time saved): $${moneySaved.toFixed(2)}
Monthly Cost:                 $${totalMonthlyCost.toFixed(2)}
${"-".repeat(60)}
Monthly ROI:                  $${monthlyROI.toFixed(2)}
Annual ROI:                   $${annualROI.toFixed(2)}

BREAKEVEN POINT
${"-".repeat(60)}

Your system will pay for itself in less than 1 month through
staff time savings alone. This does not account for:
- Improved constituent satisfaction (faster responses)
- Reduced follow-up contacts
- Better data organization and searchability
- Compliance and audit trail benefits

COST REDUCTION OPPORTUNITIES
${"-".repeat(60)}

1. Disable AI Drafting: Save $${aiCost.toFixed(2)}/month
   Use response templates instead

2. Use Gmail SMTP: Save up to $10/month
   Configure Gmail SMTP (free for < 500 emails/day)

3. Self-Host Database: Save up to $50/month
   Run PostgreSQL on existing infrastructure

Generated: ${new Date().toLocaleDateString()}
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cost-summary.txt";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Main Cost Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Monthly Cost Breakdown
          </CardTitle>
          <CardDescription>Your current infrastructure costs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cost Items */}
          <div className="space-y-4">
            {/* Hosting */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-semibold">Hosting</div>
                  <div className="text-sm text-gray-600">
                    {isCloudHosted ? "Cloud (estimated)" : "Self-hosted"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">
                  {isCloudHosted ? "$" + hostingCost.toFixed(2) : "Free"}
                </div>
                <Badge variant="outline" className="mt-1">
                  {isCloudHosted ? "Cloud" : "Included"}
                </Badge>
              </div>
            </div>

            {/* AI Drafts */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-semibold">AI Drafting</div>
                  <div className="text-sm text-gray-600">{aiDraftsThisMonth} drafts this month</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">${aiCost.toFixed(2)}</div>
                <Badge variant="outline" className="mt-1">
                  ~${costPerDraft}/draft
                </Badge>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-semibold">Email Service</div>
                  <div className="text-sm text-gray-600">
                    {emailCost === 0 ? "Using Gmail SMTP" : "SendGrid or similar"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">
                  {emailCost === 0 ? "Free" : "$" + emailCost.toFixed(2)}
                </div>
                <Badge variant="outline" className="mt-1">
                  {emailCost === 0 ? "Included" : "Paid"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="font-semibold">Monthly Total</div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-700">${totalMonthlyCost.toFixed(2)}</div>
              <div className="text-sm text-blue-600">${(totalMonthlyCost * 12).toFixed(2)}/year</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROI Card */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-900">Return on Investment</CardTitle>
          <CardDescription className="text-green-800">
            Time savings value vs. system cost
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="text-sm text-gray-600 mb-2">Monthly Time Saved</div>
              <div className="text-2xl font-bold text-green-700">{timeSaved.toFixed(1)} hrs</div>
              <div className="text-xs text-gray-500 mt-2">
                {Math.round(timeSaved * 60)} minutes per case average
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="text-sm text-gray-600 mb-2">Value of Time Saved</div>
              <div className="text-2xl font-bold text-green-700">${moneySaved.toFixed(2)}/mo</div>
              <div className="text-xs text-gray-500 mt-2">${(moneySaved * 12).toFixed(2)}/year</div>
            </div>

            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="text-sm text-gray-600 mb-2">Monthly ROI</div>
              <div
                className={`text-2xl font-bold ${
                  monthlyROI >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                ${monthlyROI.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-2">${annualROI.toFixed(2)}/year</div>
            </div>
          </div>

          {/* ROI Message */}
          <div className="p-4 bg-white rounded-lg border border-green-200">
            <p className="text-green-900">
              <span className="font-semibold">Your team saves ${moneySaved.toFixed(2)}/month</span>
              {" "}through faster constituent response handling. After deducting system costs of
              ${totalMonthlyCost.toFixed(2)}, your monthly gain is{" "}
              <span className="font-bold text-green-700">${monthlyROI.toFixed(2)}</span>.
            </p>
          </div>

          {/* Calculation Details */}
          <div
            className="border-t border-green-200 pt-4"
            onClick={() => setShowBreakdown(!showBreakdown)}
          >
            <button className="w-full flex items-center justify-between hover:bg-green-100 p-2 rounded">
              <span className="font-semibold text-green-900">How is this calculated?</span>
              {showBreakdown ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {showBreakdown && (
              <div className="mt-4 text-sm space-y-3 text-gray-700">
                <div>
                  <div className="font-semibold">Base numbers:</div>
                  <div className="ml-4 text-gray-600">
                    • {responsesPerMonth} cases/month
                    <br />
                    • {hoursPerResponseManual * 60} minutes per response (manual)
                    <br />
                    • ${hourlyRate}/hour staff cost
                  </div>
                </div>
                <div>
                  <div className="font-semibold">Time saved with this system:</div>
                  <div className="ml-4 text-gray-600">
                    • Without system: {timeSpentPerMonth.toFixed(1)} hours/month
                    <br />
                    • With system: {timeSpentWithSystem.toFixed(1)} hours/month (50% faster)
                    <br />
                    • Time saved: {timeSaved.toFixed(1)} hours/month
                  </div>
                </div>
                <div>
                  <div className="font-semibold">Monthly ROI:</div>
                  <div className="ml-4 text-gray-600">
                    • Value of time saved: ${moneySaved.toFixed(2)}
                    <br />
                    • System cost: ${totalMonthlyCost.toFixed(2)}
                    <br />- Net monthly benefit: ${monthlyROI.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cost Reduction Tips */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => setShowTips(!showTips)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              Ways to Reduce Costs
            </CardTitle>
            {showTips ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
          <CardDescription>Optional optimizations for smaller budgets</CardDescription>
        </CardHeader>

        {showTips && (
          <CardContent className="space-y-4">
            {costReductionTips.map((tip, index) => (
              <div key={index} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-amber-900">{tip.title}</div>
                    <div className="text-sm text-amber-800">{tip.description}</div>
                  </div>
                  <Badge variant="outline" className="ml-2 whitespace-nowrap">
                    Save ${tip.monthlySavings.toFixed(2)}/mo
                  </Badge>
                </div>
              </div>
            ))}

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mt-4">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">💡 Pro Tip:</span> Response templates are often
                more effective than AI drafts and are completely free to use. Set up templates
                for your most common issue types to save AI costs.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Download Button */}
      <div className="flex justify-center">
        <Button
          onClick={downloadCostSummary}
          className="flex gap-2"
          variant="outline"
        >
          <Download className="w-4 h-4" />
          Download Cost Summary for Council
        </Button>
      </div>
    </div>
  );
}
