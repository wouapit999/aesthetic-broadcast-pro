"use client";

export function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: string;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
    </div>
  );
}

export function StatsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  );
}
