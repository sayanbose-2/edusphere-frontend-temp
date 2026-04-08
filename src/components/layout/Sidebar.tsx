import { NavLink } from 'react-router-dom';
import { BsBoxArrowRight, BsMortarboardFill } from 'react-icons/bs';
import * as Icons from 'react-icons/bs';
import { useAuth } from '@/contexts/AuthContext';
import { getMenuForRole } from '@/utils/sidebarMenu';
import { formatEnum } from '@/utils/formatters';

interface Props { collapsed: boolean; width: number; }

export function Sidebar({ collapsed, width }: Props) {
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
        style={collapsed ? { justifyContent: 'center', margin: '1px 5px', width: 'calc(100% - 10px)', padding: '8px 0' } : undefined}
      >
        <span style={{ flexShrink: 0 }}>{icon(item.icon)}</span>
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );
  });

  return (
    <aside
      className="sidebar"
      style={{ width, transition: 'width 0.2s ease' }}
    >
      {/* Header */}
      <div className="sidebar-header" style={{ justifyContent: collapsed ? 'center' : undefined }}>
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
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#CDD9E5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div style={{ fontSize: 10, color: '#3D444D', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {roleLabel}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="sidebar-link"
          style={{ justifyContent: collapsed ? 'center' : undefined }}
        >
          <BsBoxArrowRight size={14} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
