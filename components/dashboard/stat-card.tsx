import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  positive?: boolean;
  icon: React.ReactNode;
}

export function StatCard({ label, value, change, positive = true, icon }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          {icon}
        </div>
        <span className={cn(
          'flex items-center gap-1 text-xs font-medium',
          positive ? 'text-green-600' : 'text-red-500'
        )}>
          <TrendingUp size={12} />
          {change}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-sm text-gray-500">{label}</p>
    </div>
  );
}
