import { ThumbsUp, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ApplaudedItem {
  id: string;
  title: string;
  applaudCount: number;
  department: string;
}

interface TopApplaudedProps {
  items: ApplaudedItem[];
}

export function TopApplauded({ items }: TopApplaudedProps) {
  const displayItems = items.slice(0, 10);

  return (
    <Card className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Top Applauded Actions This Month
      </h3>

      <div className="space-y-3">
        {displayItems.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
            No applauded actions yet
          </p>
        ) : (
          displayItems.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors border border-gray-100 dark:border-slate-800"
            >
              {/* Rank */}
              <div className="min-w-fit">
                <div className="inline-flex items-center justify-center">
                  {index === 0 ? (
                    <Award className="w-8 h-8 text-yellow-500" />
                  ) : index === 1 ? (
                    <Award className="w-8 h-8 text-gray-400" />
                  ) : index === 2 ? (
                    <Award className="w-8 h-8 text-orange-600" />
                  ) : (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold text-sm">
                      {index + 1}
                    </span>
                  )}
                </div>
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

              {/* Applaud Count */}
              <div className="flex items-center gap-2 min-w-fit">
                <ThumbsUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.applaudCount}
                </span>
              </div>

              {/* Badge */}
              <div className="min-w-fit">
                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  Praised
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
