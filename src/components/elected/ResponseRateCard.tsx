'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card } from '@/components/ui/card';

interface ResponseRateCardProps {
  districtAvg: number;
  cityWideAvg: number;
  districtName: string;
}

export function ResponseRateCard({
  districtAvg,
  cityWideAvg,
  districtName,
}: ResponseRateCardProps) {
  const data = [
    {
      name: 'Average Response Time',
      [districtName]: districtAvg,
      'City-Wide': cityWideAvg,
    },
  ];

  const isBetterThanAverage = districtAvg < cityWideAvg;

  return (
    <Card className="p-6 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Response Time Comparison
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {isBetterThanAverage ? (
            <span className="text-green-600 dark:text-green-400 font-medium">
              Your district is {(cityWideAvg - districtAvg).toFixed(1)} hours faster than average
            </span>
          ) : (
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              City average is {(districtAvg - cityWideAvg).toFixed(1)} hours faster than your district
            </span>
          )}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              color: '#f3f4f6',
            }}
            formatter={(value) => [`${value.toFixed(1)} hours`, '']}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar dataKey={districtName} radius={[8, 8, 0, 0]}>
            <Cell fill={isBetterThanAverage ? '#10b981' : '#f59e0b'} />
          </Bar>
          <Bar dataKey="City-Wide" radius={[8, 8, 0, 0]}>
            <Cell fill="#3b82f6" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            {districtName}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {districtAvg.toFixed(1)}h
          </p>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            City-Wide Average
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {cityWideAvg.toFixed(1)}h
          </p>
        </div>
      </div>
    </Card>
  );
}
