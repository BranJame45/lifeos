import { ReactNode } from 'react';

interface CardProps { title?: string; children: ReactNode; className?: string; }

export default function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      {children}
    </div>
  );
}
