import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'subtle' | 'bordered';
  className?: string;
  id?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  variant = 'default',
  className = '',
  id,
  ...props
}) => {
  let bgClass = 'bg-theme-surface border border-theme';
  if (variant === 'subtle') bgClass = 'bg-theme-subtle border border-theme';
  if (variant === 'bordered') bgClass = 'bg-transparent border border-theme';

  return (
    <div
      id={id}
      className={`rounded-lg ${bgClass} transition-colors ${className}`}
      {...props}
    >
      {header && (
        <div className="px-5 py-3.5 border-b border-theme flex items-center justify-between font-medium">
          {header}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-theme bg-theme-subtle/50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
};
