'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarNav, SidebarNavItem, SidebarSection, SidebarDivider, SidebarFooter } from './ui/sidebar';
import { combineClasses } from '@/lib/utils';
import { useJenkins } from '@/lib/jenkins-context';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { activeConnection } = useJenkins();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  const handleToggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };
  
  return (
    <div className="d-flex h-100">
      {/* Bootstrap Sidebar for desktop */}
      <Sidebar 
        expanded={sidebarExpanded} 
        onToggle={handleToggleSidebar}
        className="d-none d-md-block"
      >
        <SidebarNav>
          <SidebarSection>
            <SidebarNavItem 
              href="/" 
              active={isActive('/')} 
              icon="speedometer2"
            >
              Dashboard
            </SidebarNavItem>
            
            <SidebarNavItem 
              href="/jobs" 
              active={isActive('/jobs')} 
              icon="list-check"
            >
              Jobs
            </SidebarNavItem>
            
            <SidebarNavItem 
              href="/troubleshooting" 
              active={isActive('/troubleshooting')} 
              icon="tools"
            >
              Troubleshooting
            </SidebarNavItem>
            
            <SidebarNavItem 
              href="/advanced-troubleshooting" 
              active={isActive('/advanced-troubleshooting')} 
              icon="wrench-adjustable"
            >
              Advanced Troubleshooting
            </SidebarNavItem>
          </SidebarSection>
          
          <SidebarDivider />
          
          <SidebarSection title={sidebarExpanded ? "Settings & Info" : ""}>
            <SidebarNavItem 
              href="/settings" 
              active={isActive('/settings')} 
              icon="gear"
            >
              Settings
            </SidebarNavItem>
          </SidebarSection>
        </SidebarNav>
        
        {activeConnection && sidebarExpanded && (
          <SidebarFooter>
            <div className="d-flex align-items-center">
              <span className={`badge bg-${activeConnection.color || 'primary'} me-2`}></span>
              <small className="text-truncate">{activeConnection.name}</small>
            </div>
          </SidebarFooter>
        )}
      </Sidebar>
      
      {/* Main content area with Bootstrap grid */}
      <div className={combineClasses(
        'content',
        sidebarExpanded ? 'content-expanded' : 'content-collapsed'
      )}>
        <div className="container-fluid py-3">
          {children}
        </div>
      </div>
      
      {/* Bottom navigation for mobile */}
      <div className="mobile-nav d-md-none">
        <div className="container">
          <div className="row">
            <div className="col text-center">
              <Link href="/" className={combineClasses('nav-link', isActive('/') ? 'active' : '')}>
                <i className="bi bi-speedometer2 d-block mb-1"></i>
                <small>Dashboard</small>
              </Link>
            </div>
            <div className="col text-center">
              <Link href="/jobs" className={combineClasses('nav-link', isActive('/jobs') ? 'active' : '')}>
                <i className="bi bi-list-check d-block mb-1"></i>
                <small>Jobs</small>
              </Link>
            </div>
            <div className="col text-center">
              <Link href="/troubleshooting" className={combineClasses('nav-link', isActive('/troubleshooting') ? 'active' : '')}>
                <i className="bi bi-tools d-block mb-1"></i>
                <small>Troubleshoot</small>
              </Link>
            </div>
            <div className="col text-center">
              <Link href="/settings" className={combineClasses('nav-link', isActive('/settings') ? 'active' : '')}>
                <i className="bi bi-gear d-block mb-1"></i>
                <small>Settings</small>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
