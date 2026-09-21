import React from 'react';

export type ChipVariant = 
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'simulated'
  | 'neutral';

interface ChipProps {
  id?: string;
  label: string;
  variant?: ChipVariant;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  id,
  label,
  variant = 'default',
  icon,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5 gap-1.5' 
    : 'text-xs px-2.5 py-1 gap-1.5';

  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses = 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/30';
      break;
    case 'success':
      variantClasses = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
      break;
    case 'warning':
      variantClasses = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30';
      break;
    case 'danger':
      variantClasses = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30';
      break;
    case 'info':
      variantClasses = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30';
      break;
    case 'simulated':
      variantClasses = 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30 font-mono tracking-wider text-[10px] uppercase font-bold';
      break;
    case 'neutral':
      variantClasses = 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border border-gray-500/20';
      break;
    default:
      variantClasses = 'bg-theme-subtle text-theme-main border border-theme';
      break;
  }

  return (
    <span
      id={id}
      className={`inline-flex items-center font-medium rounded-full whitespace-nowrap select-none ${sizeClasses} ${variantClasses} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
    </span>
  );
};
