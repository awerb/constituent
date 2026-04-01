import { Flag, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FlaggedItem {
  id: string;
  title: string;
  flagCount: number;
  department: string;
  caseStatus: 'open' | 'in_progress' | 'resolved' | 'closed';
}

interface TopFlaggedProps {
  items: FlaggedItem[];
}

export function TopFlagged({ items }: TopFlaggedProps) {
  const statusConfig: Record<
    string,
    {
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      color: string;
    }
  > = {
    open: {
      icon: AlertCircle,
      label: 'Open',
      color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    },
    in_progress: {
      icon: Clock,
      label: 'In Progress',
      color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    },
    resolved: {
      icon: CheckCircle,
      label: 'Resolved',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    },
    closed: {
      icon: CheckCircle,
      label: 'Closed',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    },
  };

  const displayItems = items.slice(0, 10);

  return (
    <Card className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Top Flagged Issues This Month
      </h3>

      <div className="space-y-3">
        {displayItems.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
            No flagged issues this month
          </p>
        ) : (
          displayItems.map((item, index) => {
            const statusConfig_ = statusConfig[item.caseStatus];
            const StatusIcon = statusConfig_.icon;

            return (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors border border-gray-100 dark:border-slate-800"
              >
                {/* Rank */}
                <div className="min-w-fit">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold text-sm">
                    {index + 1}
                  </span>
                </div>

                {/* Title and Department */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {item.department}
                  </p>
                </div>

                {/* Flag Count */}
                <div className="flex items-center gap-2 min-w-fit">
                  <Flag className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.flagCount}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="min-w-fit">
                  <Badge className={statusConfig_.color}>
                    <StatusIcon className="w-3 h-3 mr-1 inline" />
                    {statusConfig_.label}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
