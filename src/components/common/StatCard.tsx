import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  textColor: string;
}

export default function StatCard({ label, value, icon: Icon, color, textColor }: StatCardProps) {
  return (
    <div className={`bg-gradient-to-br ${color} ${textColor} p-4 rounded-xl shadow-md`}>
      <Icon className="w-5 h-5 opacity-80 mb-2" />
      <p className="text-[10px] uppercase font-mono tracking-wider opacity-80 leading-tight">{label}</p>
      <p className="text-lg font-display font-black mt-0.5">{value}</p>
    </div>
  );
}
