import React from "react";

interface PageHeaderProps {
  icon: React.ElementType;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export default function PageHeader({ icon: Icon, title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-stsn-beige rounded-xl shadow-sm gap-4">
      <div>
        <h2 className="text-xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
          <Icon className="w-5 h-5 text-stsn-brown" />
          {title}
        </h2>
        <p className="text-stone-500 text-xs mt-1">{description}</p>
      </div>
      {children}
    </div>
  );
}
