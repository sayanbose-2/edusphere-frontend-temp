import { NavLink } from 'react-router-dom';
import { BsBoxArrowRight, BsMortarboardFill } from 'react-icons/bs';
import * as Icons from 'react-icons/bs';
import { useAuth } from '@/contexts/AuthContext';
import { getMenuForRole } from '@/utils/sidebarMenu';

interface SidebarProps {
  collapsed: boolean;
  width: number;
}

export function Sidebar({ collapsed, width }: SidebarProps) {
  const { user, logout } = useAuth();
  const menu = user ? getMenuForRole(user.roles) : [];

  const getIcon = (name: string) => {
    const Icon = (Icons as Record<string, React.ComponentType<{ size?: number }>>)[name];
    return Icon ? <Icon size={15} /> : null;
  };

  // Build a list of rendered items with section labels injected
  const renderedItems: React.ReactNode[] = [];
  let lastSection: string | undefined = '__none__';

  menu.forEach((item, i) => {
    const currentSection = item.section;
    if (!collapsed && currentSection && currentSection !== lastSection) {
      renderedItems.push(
        <div key={`section-${currentSection}-${i}`} className="sidebar-section-label">
          {currentSection}
        </div>
      );
      lastSection = currentSection;
    } else if (!currentSection) {
      lastSection = '__none__';
    }

    renderedItems.push(
      <NavLink
        key={item.path}
        to={item.path}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        style={collapsed ? { justifyContent: 'center', padding: '10px 0', margin: '1px 8px' } : undefined}
      >
        <span style={{ flexShrink: 0 }}>{getIcon(item.icon)}</span>
        {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
      </NavLink>
    );
  });

  return (
    <aside
      className="sidebar"
      style={{
        width,
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s',
        zIndex: 1040,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid var(--sidebar-border)',
          gap: 10,
          flexShrink: 0,
          background: 'var(--sidebar-bg-deep)',
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '8px',
            background: 'var(--sidebar-active)',
            border: '1px solid var(--sidebar-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <BsMortarboardFill size={15} style={{ color: 'var(--sidebar-gold)' }} />
        </div>
        {!collapsed && (
          <span
            style={{
              fontWeight: 700,
              fontSize: '0.92rem',
              color: 'var(--sidebar-text-active)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.1px',
            }}
          >
            EduSphere
          </span>
        )}
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px 0' }}>
        {renderedItems}
      </nav>

      {/* User info + Logout */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--sidebar-border)', flexShrink: 0, background: 'var(--sidebar-bg-deep)' }}>
        {!collapsed && user && (
          <div
            style={{
              padding: '8px 12px',
              marginBottom: 4,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--sidebar-hover)',
              border: '1px solid var(--sidebar-border)',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--sidebar-text-active)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--sidebar-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="sidebar-link"
          style={{
            width: '100%',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            justifyContent: collapsed ? 'center' : undefined,
          }}
        >
          <BsBoxArrowRight size={15} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
