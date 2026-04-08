import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarW = collapsed ? 56 : 252;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} width={sidebarW} />
      <div style={{ marginLeft: sidebarW, flex: 1, transition: 'margin-left 0.2s ease', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopNavbar onToggleSidebar={() => setCollapsed(c => !c)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
