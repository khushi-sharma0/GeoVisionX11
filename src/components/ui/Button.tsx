import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  className = '',
  disabled,
  title,
  ...props
}) => {
  let sizeClasses = 'text-sm px-3.5 py-1.5 rounded-md';
  if (size === 'sm') sizeClasses = 'text-xs px-2.5 py-1 rounded';
  if (size === 'lg') sizeClasses = 'text-base px-5 py-2.5 rounded-lg';

  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses = 'bg-theme-primary text-white hover:opacity-90 active:scale-[0.99] shadow-sm';
      break;
    case 'secondary':
      variantClasses = 'bg-theme-subtle text-theme-main hover:bg-theme-base border border-theme';
      break;
    case 'outline':
      variantClasses = 'border border-theme text-theme-main hover:bg-theme-subtle bg-transparent';
      break;
    case 'accent':
      variantClasses = 'bg-theme-accent text-white hover:opacity-90 active:scale-[0.99] shadow-sm';
      break;
    case 'danger':
      variantClasses = 'bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.99]';
      break;
    case 'ghost':
      variantClasses = 'text-theme-muted hover:text-theme-main hover:bg-theme-subtle bg-transparent';
      break;
  }

  const disabledClasses = disabled || loading 
    ? 'opacity-50 cursor-not-allowed pointer-events-none' 
    : 'cursor-pointer transition-colors transition-transform';

  return (
    <button
      {...props}
      disabled={disabled || loading}
      title={disabled && title ? title : props.title}
      className={`inline-flex items-center justify-center font-medium gap-2 select-none ${sizeClasses} ${variantClasses} ${disabledClasses} ${className}`}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
    </button>
  );
};
