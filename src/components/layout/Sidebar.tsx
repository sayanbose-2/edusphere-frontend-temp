import { NavLink } from 'react-router-dom';
import { BsBoxArrowRight, BsMortarboardFill } from 'react-icons/bs';
import * as Icons from 'react-icons/bs';
import { useAuth } from '@/contexts/AuthContext';
import { getMenuForRole } from '@/utils/sidebarMenu';
import { formatEnum } from '@/utils/formatters';

interface Props { collapsed: boolean; }

export function Sidebar({ collapsed }: Props) {
  const { user, logout } = useAuth();
  const menu = user ? getMenuForRole(user.roles) : [];

  const icon = (name: string) => {
    const I = (Icons as Record<string, React.ComponentType<{ size?: number }>>)[name];
    return I ? <I size={14} /> : null;
  };

  const initials = (user?.name ?? '?')
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const roleLabel = user?.roles[0] ? formatEnum(user.roles[0]) : '';

  const items: React.ReactNode[] = [];
  let lastSection = '__none__';

  menu.forEach((item, i) => {
    if (!collapsed && item.section && item.section !== lastSection) {
      items.push(<div key={`sec-${i}`} className="sidebar-section">{item.section}</div>);
      lastSection = item.section;
    } else if (!item.section) {
      lastSection = '__none__';
    }

    items.push(
      <NavLink
        key={item.path}
        to={item.path}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
      >
        <span className="flex-shrink-0">{icon(item.icon)}</span>
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );
  });

  return (
    <aside
      className={`sidebar transition-[width] duration-200 ease-in-out ${collapsed ? 'w-14' : 'w-[252px]'}`}
    >
      {/* Header */}
      <div className={`sidebar-header ${collapsed ? 'justify-center' : ''}`}>
        <div className="sidebar-logo">
          <BsMortarboardFill size={17} color="#fff" />
        </div>
        {!collapsed && <span className="sidebar-brand">EduSphere</span>}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">{items}</nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && user && (
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-gray-100 whitespace-nowrap overflow-hidden text-ellipsis">
                {user.name}
              </div>
              <div className="text-xs text-gray-600 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                {roleLabel}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={`sidebar-link ${collapsed ? 'justify-center' : ''}`}
        >
          <BsBoxArrowRight size={14} className="flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
