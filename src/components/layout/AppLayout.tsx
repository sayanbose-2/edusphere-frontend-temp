import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} />
      <div className={`flex flex-col flex-1 transition-all duration-200 ${collapsed ? 'ml-14' : 'ml-[252px]'}`}>
        <TopNavbar onToggleSidebar={() => setCollapsed(c => !c)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
