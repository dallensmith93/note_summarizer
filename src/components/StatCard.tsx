import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="stat-card">
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
      {icon ? <span className="stat-icon">{icon}</span> : null}
    </div>
  );
}
