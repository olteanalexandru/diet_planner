



export const UserStatsCard: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({
    icon,
    label,
    value
  }) => (
    <div className="flex flex-col items-center p-4 rounded-lg bg-space-800">
      <div className="text-cyber-primary mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-100">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );