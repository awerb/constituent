"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Copy, Download, TrendingUp } from "lucide-react";
import { useState } from "react";

interface BudgetJustificationProps {
  cityName: string;
  monthlyVolume: number;
  staffCount: number;
}

export function BudgetJustification({
  cityName,
  monthlyVolume,
  staffCount,
}: BudgetJustificationProps) {
  const [copied, setCopied] = useState(false);

  // Calculate metrics
  const hoursPerResponseManual = 0.25; // 15 minutes
  const hourlyRate = 30; // Conservative estimate
  const currentMonthlyHours = monthlyVolume * hoursPerResponseManual;
  const currentMonthlyCost = currentMonthlyHours * hourlyRate;
  const currentAnnualCost = currentMonthlyCost * 12;

  // With system: 50% efficiency gain
  const withSystemMonthlyHours = currentMonthlyHours * 0.5;
  const withSystemMonthlyCost = withSystemMonthlyHours * hourlyRate;
  const withSystemAnnualCost = withSystemMonthlyCost * 12;

  // Time saved
  const monthlyTimeSaved = currentMonthlyHours - withSystemMonthlyHours;
  const monthlyValueSaved = monthlyTimeSaved * hourlyRate;
  const annualValueSaved = monthlyValueSaved * 12;

  // System costs (conservative estimate)
  const monthlySystemCost = 50; // Including hosting, AI, email
  const annualSystemCost = monthlySystemCost * 12;

  // Net benefit
  const monthlyNetBenefit = monthlyValueSaved - monthlySystemCost;
  const annualNetBenefit = annualValueSaved - annualSystemCost;
  const paybackMonths = monthlySystemCost / monthlyValueSaved;

  // Chart data for comparison
  const comparisonData = [
    {
      name: "Manual Process",
      hours: currentMonthlyHours,
      cost: currentMonthlyCost,
    },
    {
      name: "With System",
      hours: withSystemMonthlyHours,
      cost: withSystemMonthlyCost,
    },
  ];

  // ROI projection
  const projectionData = [
    { month: "Month 1", cumulative: monthlyNetBenefit },
    { month: "Month 3", cumulative: monthlyNetBenefit * 3 },
    { month: "Month 6", cumulative: monthlyNetBenefit * 6 },
    { month: "Month 12", cumulative: monthlyNetBenefit * 12 },
  ];

  const generatePDFContent = () => {
    return `
BUDGET JUSTIFICATION
Constituent Response Management System
For: ${cityName}
Date: ${new Date().toLocaleDateString()}

EXECUTIVE SUMMARY
================================================================================

The Constituent Response Management System will improve service delivery to
residents while reducing staff time and administrative burden. This investment
will pay for itself in less than ${paybackMonths.toFixed(1)} month(s) through staff productivity gains.

CURRENT SITUATION (MANUAL PROCESS)
================================================================================

Case Volume:            ${monthlyVolume} cases per month
Staff Size:             ${staffCount} people
Hours per Response:     ${hoursPerResponseManual * 60} minutes
Total Monthly Hours:    ${currentMonthlyHours.toFixed(1)} hours
Staff Hourly Cost:      $${hourlyRate}/hour

Annual Staff Cost for Case Management:  $${currentAnnualCost.toFixed(2)}

CHALLENGES WITH MANUAL PROCESS:
- Inconsistent response quality and timing
- Limited ability to track case status
- Difficult to prioritize follow-ups
- Email and spreadsheets are error-prone
- No audit trail for compliance
- Staff spend significant time on administrative tasks

PROPOSED SOLUTION
================================================================================

Implement Constituent Response Management System to:
- Centralize all constituent communications
- Automatically route cases to appropriate departments
- Track case status from submission to resolution
- Provide response templates to ensure consistency
- Generate reports for council and constituents
- Create audit trail for compliance and transparency

PROJECTED IMPACT WITH SYSTEM
================================================================================

Monthly Case Volume:        ${monthlyVolume} cases
Staff Efficiency Gain:      50% (faster with templates and automation)

Monthly Hours Required:     ${withSystemMonthlyHours.toFixed(1)} hours
Equivalent Annual Hours:    ${(withSystemMonthlyHours * 12).toFixed(1)} hours

Hours Saved Per Month:      ${monthlyTimeSaved.toFixed(1)} hours
Annual Hours Freed Up:      ${(monthlyTimeSaved * 12).toFixed(1)} hours

FINANCIAL ANALYSIS
================================================================================

ANNUAL SAVINGS (Staff Time):
  Staff time currently spent:    ${currentAnnualCost.toFixed(2)}
  Staff time with system:        ${withSystemAnnualCost.toFixed(2)}
  Time value freed for other work: $${annualValueSaved.toFixed(2)}

SYSTEM COSTS (Annual):
  Monthly Cost:    $${monthlySystemCost.toFixed(2)}
  Annual Cost:     $${annualSystemCost.toFixed(2)}

NET BENEFIT (Annual):
  Gross Savings:   $${annualValueSaved.toFixed(2)}
  System Cost:     -$${annualSystemCost.toFixed(2)}
  Net Benefit:     $${annualNetBenefit.toFixed(2)}

Return on Investment: ${((annualNetBenefit / annualSystemCost) * 100).toFixed(0)}%
Payback Period: ${paybackMonths < 1 ? "Less than 1 month" : paybackMonths.toFixed(1) + " months"}

INTANGIBLE BENEFITS (NOT QUANTIFIED ABOVE)
================================================================================

1. CONSTITUENT SATISFACTION
   - Faster response times (guaranteed within SLA)
   - Consistent, professional communication
   - Ability to track case status 24/7
   - Automated status updates reduce follow-up calls

2. STAFF EFFICIENCY & MORALE
   - Reduced repetitive administrative work
   - Clear case routing eliminates confusion
   - Response templates prevent "blank page" syndrome
   - Reduced email chaos and lost requests

3. OPERATIONAL EXCELLENCE
   - Complete audit trail for compliance and FOIA
   - Data-driven insights about constituent issues
   - Better resource allocation to problem areas
   - Performance metrics for council reporting

4. RISK REDUCTION
   - No more lost or misfiled constituent requests
   - Compliance-ready record keeping
   - Reduced legal/liability exposure
   - Transparent process prevents complaints

5. SCALABILITY
   - Handle growing case volume without hiring
   - Easier to onboard new staff
   - Works for multiple departments simultaneously
   - Extensible for future integrations

COST COMPARISON WITH ALTERNATIVES
================================================================================

Option 1: Status Quo (No System)
  Annual Cost: $${currentAnnualCost.toFixed(2)} (staff time only)
  Drawback: Inefficient, error-prone, inconsistent service

Option 2: Custom Development
  Annual Cost: $15,000+ development + $150+ per month hosting
  Drawback: Time-consuming, specialized staff needed, ongoing maintenance

Option 3: Constituent Response System (RECOMMENDED)
  Annual Cost: $${annualSystemCost.toFixed(2)}
  Benefit: $${annualNetBenefit.toFixed(2)} net annual savings
  Advantage: Ready to use, no development, built-in best practices

IMPLEMENTATION TIMELINE
================================================================================

Week 1:    System setup, staff training
Week 2-3:  Data migration from email/spreadsheets
Week 4:    Go-live, monitor and adjust
Month 2+:  Realize efficiency gains

STAFFING IMPACT
================================================================================

The system does NOT require IT staff to operate:
- Simple web-based interface, no special technical knowledge needed
- One person (${staffCount > 1 ? "any staff member" : "your admin"}) can manage the system
- Setup takes under 3 hours with the automated installer
- Monthly maintenance: under 30 minutes

TIME FREED UP FOR:
- More meaningful constituent engagement
- Community outreach
- Process improvement initiatives
- Proactive issue identification and resolution
- Better relationships with residents

RECOMMENDATION
================================================================================

Invest in the Constituent Response Management System to:

1. Immediately reduce staff burden by ${monthlyTimeSaved.toFixed(0)} hours/month
2. Improve constituent service quality and satisfaction
3. Reduce compliance and legal risk with audit trails
4. Gain valuable data about constituent needs
5. Achieve positive ROI in ${paybackMonths < 1 ? "first month" : paybackMonths.toFixed(1) + " months"}

The investment of $${annualSystemCost.toFixed(2)}/year will return $${annualNetBenefit.toFixed(2)}
in value, making this a sound business decision that also improves
resident services.

NEXT STEPS
================================================================================

1. Budget Review: Present this analysis to council
2. Stakeholder Meeting: Discuss with all department heads
3. Demo: Request a live demonstration of the system
4. Setup: Implement during low-volume period (if applicable)
5. Training: 1-hour staff training session
6. Evaluate: Measure actual time savings at 3-month mark

CONTACT & SUPPORT
================================================================================

For questions about this system or budget request:
Email: budget@transparentcity.co
Website: https://constituent-response.com
Documentation: https://constituent-response.com/docs/budget

---

This budget justification was generated by Constituent Response
${new Date().toLocaleDateString()}
`;
  };

  const generateTextContent = () => {
    let text = `BUDGET JUSTIFICATION - ${cityName}
Generated: ${new Date().toLocaleDateString()}

KEY METRICS
===========

Annual Savings (Staff Time): $${annualValueSaved.toFixed(2)}
Annual System Cost: $${annualSystemCost.toFixed(2)}
Net Annual Benefit: $${annualNetBenefit.toFixed(2)}
Return on Investment: ${((annualNetBenefit / annualSystemCost) * 100).toFixed(0)}%
Payback Period: ${paybackMonths < 1 ? "Less than 1 month" : paybackMonths.toFixed(1) + " months"}

CURRENT SITUATION
=================

Monthly Case Volume: ${monthlyVolume}
Staff Size: ${staffCount}
Time per Response: ${hoursPerResponseManual * 60} minutes
Annual Staff Cost: $${currentAnnualCost.toFixed(2)}

WITH SYSTEM
===========

Staff Hours Freed: ${(monthlyTimeSaved * 12).toFixed(0)} hours/year
System Cost: $${annualSystemCost.toFixed(2)}/year
Net Benefit: $${annualNetBenefit.toFixed(2)}/year

BENEFITS
========

- Faster constituent responses
- Reduced staff burden
- Better service quality
- Compliance-ready audit trails
- Scalable to growing volume
- No IT expertise required

Return this form to your city council for budget approval.

Questions? Email: setup@transparentcity.co
`;

    return text;
  };

  const downloadPDF = () => {
    const content = generatePDFContent();
    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-justification-${cityName.replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const copyToClipboard = () => {
    const content = generateTextContent();
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Budget Justification</h2>
        <p className="text-gray-600">
          Present this analysis to your city council for budget approval
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Annual Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${annualValueSaved.toFixed(0)}</div>
            <p className="text-xs text-gray-500 mt-2">Staff time value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">System Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${annualSystemCost.toFixed(0)}</div>
            <p className="text-xs text-gray-500 mt-2">Annual investment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Net Benefit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">${annualNetBenefit.toFixed(0)}</div>
            <p className="text-xs text-gray-500 mt-2">First year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {((annualNetBenefit / annualSystemCost) * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-gray-500 mt-2">Return on investment</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Savings Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Time Comparison</CardTitle>
          <CardDescription>Monthly hours required for constituent response</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: "Cost ($)", angle: 90, position: "insideRight" }}
              />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="hours" fill="#3b82f6" name="Monthly Hours" />
              <Bar yAxisId="right" dataKey="cost" fill="#10b981" name="Monthly Cost ($)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ROI Projection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            ROI Projection (Year 1)
          </CardTitle>
          <CardDescription>Cumulative net benefit over 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis label={{ value: "Cumulative Benefit ($)", angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Bar dataKey="cumulative" fill="#10b981" name="Net Benefit" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payback Analysis */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-900">Payback Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white rounded border border-green-200">
              <span className="font-semibold">Monthly Value Created</span>
              <span className="text-lg font-bold text-green-700">${monthlyValueSaved.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded border border-green-200">
              <span className="font-semibold">Monthly System Cost</span>
              <span className="text-lg font-bold">${monthlySystemCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-100 rounded border border-green-300">
              <span className="font-bold">Net Monthly Benefit</span>
              <span className="text-2xl font-bold text-green-700">
                ${monthlyNetBenefit.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="p-4 bg-white rounded border border-green-200">
            <p className="text-green-900 font-semibold mb-2">Payback Period</p>
            <p className="text-green-800">
              {paybackMonths < 1
                ? "Less than 1 month"
                : `${paybackMonths.toFixed(1)} months`}
              {" - "}
              <span className="font-semibold">
                This investment will pay for itself in less than {paybackMonths < 1 ? "30 days" : "one year"}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Key Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Benefits</CardTitle>
          <CardDescription>Beyond financial savings</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Badge className="mt-1">1</Badge>
              <div>
                <p className="font-semibold">Faster Constituent Response Times</p>
                <p className="text-sm text-gray-600">
                  Automated case routing and templates mean residents get faster responses
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Badge className="mt-1">2</Badge>
              <div>
                <p className="font-semibold">Compliance & Audit Ready</p>
                <p className="text-sm text-gray-600">
                  Complete audit trail for FOIA and legal compliance
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Badge className="mt-1">3</Badge>
              <div>
                <p className="font-semibold">Data-Driven Decisions</p>
                <p className="text-sm text-gray-600">
                  Reports show trends and help prioritize resource allocation
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Badge className="mt-1">4</Badge>
              <div>
                <p className="font-semibold">Scalability</p>
                <p className="text-sm text-gray-600">
                  Handle growing case volume without hiring additional staff
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Badge className="mt-1">5</Badge>
              <div>
                <p className="font-semibold">No IT Expertise Required</p>
                <p className="text-sm text-gray-600">
                  Anyone can operate the system; no specialized technical skills needed
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Download/Copy Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={downloadPDF} className="flex gap-2">
          <Download className="w-4 h-4" />
          Download Budget Justification
        </Button>
        <Button
          onClick={copyToClipboard}
          variant="outline"
          className="flex gap-2"
        >
          <Copy className="w-4 h-4" />
          {copied ? "Copied!" : "Copy to Clipboard"}
        </Button>
      </div>

      {/* Help Text */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Presenting to Council?</span>
            {" "}Download the full budget justification document above. Share these metrics:
            annual savings of ${annualValueSaved.toFixed(0)}, system cost of $
            {annualSystemCost.toFixed(0)}, and net first-year benefit of $
            {annualNetBenefit.toFixed(0)}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
