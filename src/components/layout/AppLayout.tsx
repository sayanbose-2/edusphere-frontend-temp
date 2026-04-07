import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNavbar } from '@/components/layout/TopNavbar';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarW = collapsed ? 64 : 248;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} width={sidebarW} />

      <div style={{ marginLeft: sidebarW, flex: 1, transition: 'margin-left 0.25s', minWidth: 0 }}>
        <TopNavbar onToggleSidebar={() => setCollapsed(c => !c)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
