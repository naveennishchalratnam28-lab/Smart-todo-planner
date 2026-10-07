import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { IDayPlan } from '../types';

interface WorkloadChartProps {
  dailyPlans: IDayPlan[];
  dailyHoursLimit: number;
}

export const WorkloadChart: React.FC<WorkloadChartProps> = ({
  dailyPlans,
  dailyHoursLimit,
}) => {
  // Format data for chart (first 7 days or next working days)
  const chartData = dailyPlans.slice(0, 7).map(day => {
    const shortDate = day.date.slice(5); // MM-DD
    const dayShort = day.dayName.slice(0, 3);
    return {
      label: `${dayShort} ${shortDate}`,
      scheduled: day.scheduledHours,
      available: day.availableHours,
      effective: day.effectiveHours,
      isOverloaded: day.isOverloaded,
      isWorkingDay: day.isWorkingDay,
      utilization: day.utilizationPercent,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 p-3 rounded-xl shadow-xl text-xs border border-gray-700/50">
          <div className="font-bold text-sm mb-1">{label}</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-300 dark:text-gray-600">Planned Work:</span>
              <span className="font-semibold text-indigo-400 dark:text-indigo-600">
                {data.scheduled} hrs
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-300 dark:text-gray-600">Daily Max:</span>
              <span className="font-semibold">{data.available} hrs</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-300 dark:text-gray-600">Buffer Target:</span>
              <span className="font-semibold text-emerald-400 dark:text-emerald-600">
                {data.effective} hrs
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-700/60 dark:border-gray-300/60">
              <span className="text-gray-300 dark:text-gray-600">Load:</span>
              <span
                className={`font-bold ${
                  data.isOverloaded
                    ? 'text-rose-400 dark:text-rose-600'
                    : 'text-emerald-400 dark:text-emerald-600'
                }`}
              >
                {data.utilization}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            unit="h"
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={dailyHoursLimit}
            stroke="#f43f5e"
            strokeDasharray="4 4"
            label={{
              value: `Limit (${dailyHoursLimit}h)`,
              position: 'top',
              fill: '#f43f5e',
              fontSize: 10,
            }}
          />
          <Bar dataKey="scheduled" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.isOverloaded
                    ? '#f43f5e'
                    : entry.scheduled > entry.effective
                    ? '#f59e0b'
                    : '#6366f1'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
