import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
  id?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'w-[480px]',
  id = 'geovision-drawer',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div id={id} className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[2px]">
      <div
        className={`h-full ${width} max-w-[95vw] bg-theme-surface border-l border-theme shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-theme flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-theme-main">{title}</h2>
            {subtitle && <p className="text-xs text-theme-muted mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-theme-muted hover:text-theme-main hover:bg-theme-subtle rounded-md transition-colors"
            title="Close drawer"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 text-sm space-y-6">{children}</div>
      </div>
    </div>
  );
};
