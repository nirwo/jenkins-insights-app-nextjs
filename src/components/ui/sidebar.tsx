'use client';

import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { combineClasses } from '@/lib/utils';

// Bootstrap sidebar component
export function Sidebar({ 
  children, 
  className, 
  expanded = true,
  onToggle
}: { 
  children: React.ReactNode; 
  className?: string;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const isMobile = useIsMobile();
  
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    }
  };

  const sidebarClass = combineClasses(
    'sidebar bg-dark text-light',
    expanded ? 'expanded' : 'collapsed',
    className
  );

  return (
    <div className={sidebarClass}>
      <div className="sidebar-header d-flex justify-content-between align-items-center p-3">
        <h5 className="m-0">{expanded ? 'Jenkins Insights' : 'JI'}</h5>
        <button 
          className="btn btn-sm btn-outline-light" 
          onClick={handleToggle}
          aria-label="Toggle Sidebar"
        >
          <i className={`bi bi-${expanded ? 'arrow-bar-left' : 'arrow-bar-right'}`}></i>
        </button>
      </div>
      <div className="sidebar-content overflow-auto">
        {children}
      </div>
    </div>
  );
}

export function SidebarNav({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={combineClasses('nav flex-column', className)}>
      {children}
    </div>
  );
}

export function SidebarNavItem({ 
  children, 
  active, 
  href, 
  icon,
  onClick,
  className 
}: { 
  children: React.ReactNode; 
  active?: boolean;
  href?: string;
  icon?: string;
  onClick?: () => void;
  className?: string;
}) {
  const classes = combineClasses(
    'nav-link d-flex align-items-center gap-2 p-2',
    active ? 'active' : '',
    className
  );

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick}>
        {icon && <i className={`bi bi-${icon}`}></i>}
        <span>{children}</span>
      </a>
    );
  }

  return (
    <div className={classes} onClick={onClick} role="button" tabIndex={0}>
      {icon && <i className={`bi bi-${icon}`}></i>}
      <span>{children}</span>
    </div>
  );
}

export function SidebarSection({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={combineClasses('sidebar-section mb-3', className)}>
      {title && <h6 className="sidebar-heading px-3 mt-4 mb-1 text-muted">{title}</h6>}
      <div className="sidebar-section-content">
        {children}
      </div>
    </div>
  );
}

export function SidebarDivider() {
  return <hr className="sidebar-divider my-2" />;
}

export function SidebarFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={combineClasses('sidebar-footer mt-auto p-3', className)}>
      {children}
    </div>
  );
}