import { TrendingUp, TrendingDown, Flag, ThumbsUp, AlertCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface DistrictSummaryProps {
  flagsThisWeek: number;
  applaudsThisWeek: number;
  openCases: number;
  avgResponseTime: number;
  flagsTrend: 'up' | 'down' | 'flat';
  applaudsTrend: 'up' | 'down' | 'flat';
}

export function DistrictSummary({
  flagsThisWeek,
  applaudsThisWeek,
  openCases,
  avgResponseTime,
  flagsTrend,
  applaudsTrend,
}: DistrictSummaryProps) {
  const getTrendIcon = (trend: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      case 'flat':
        return <div className="w-4 h-4 border-b border-gray-400" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'flat', isNegative?: boolean) => {
    if (trend === 'flat') return 'text-gray-500';
    if (isNegative) {
      return trend === 'up' ? 'text-red-500' : 'text-green-500';
    }
    return trend === 'up' ? 'text-green-500' : 'text-red-500';
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendLabel,
    isNegative,
  }: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    trend: 'up' | 'down' | 'flat';
    trendLabel: string;
    isNegative?: boolean;
  }) => (
    <Card className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className={`text-xs font-medium ${getTrendColor(trend, isNegative)}`}>
              {getTrendIcon(trend)}
            </span>
            <span className={`text-xs font-medium ${getTrendColor(trend, isNegative)}`}>
              {trendLabel}
            </span>
          </div>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Flagged Issues"
        value={flagsThisWeek}
        icon={Flag}
        trend={flagsTrend}
        trendLabel={
          flagsTrend === 'up'
            ? '+5% from last week'
            : flagsTrend === 'down'
              ? '-3% from last week'
              : 'No change'
        }
        isNegative
      />
      <StatCard
        title="Applauded Actions"
        value={applaudsThisWeek}
        icon={ThumbsUp}
        trend={applaudsTrend}
        trendLabel={
          applaudsTrend === 'up'
            ? '+8% from last week'
            : applaudsTrend === 'down'
              ? '-2% from last week'
              : 'No change'
        }
      />
      <StatCard
        title="Open Cases"
        value={openCases}
        icon={AlertCircle}
        trend="flat"
        trendLabel="Active and pending"
      />
      <StatCard
        title="Avg Response Time"
        value={avgResponseTime}
        icon={Clock}
        trend="down"
        trendLabel="hours"
      />
    </div>
  );
}
