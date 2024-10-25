
import React from 'react';

interface UserStatsProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

export const UserStats: React.FC<UserStatsProps> = ({ label, value, icon }) => (
  <div className="bg-space-800 rounded-lg p-4 text-center">
    <div className="flex items-center justify-center mb-2">
      {icon}
    </div>
    <div className="text-2xl font-bold text-cyber-primary">{value}</div>
    <div className="text-sm text-gray-400">{label}</div>
  </div>
);