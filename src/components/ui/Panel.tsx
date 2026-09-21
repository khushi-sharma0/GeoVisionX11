import React from 'react';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  floating?: boolean;
  className?: string;
  id?: string;
}

export const Panel: React.FC<PanelProps> = ({
  children,
  floating = false,
  className = '',
  id,
  ...props
}) => {
  const panelStyle = floating
    ? 'globe-overlay-panel shadow-xl rounded-lg'
    : 'bg-theme-surface border border-theme rounded-lg';

  return (
    <div id={id} className={`${panelStyle} ${className}`} {...props}>
      {children}
    </div>
  );
};
