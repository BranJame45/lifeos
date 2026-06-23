import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
}

export default function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const base = 'px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50';
  const variants = { primary: 'bg-emerald-600 text-white hover:bg-emerald-700', secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200', ghost: 'text-gray-600 hover:bg-gray-100' };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
}
