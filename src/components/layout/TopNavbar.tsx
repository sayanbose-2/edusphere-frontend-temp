import { BsList, BsBell, BsMoon, BsSun, BsCheckAll } from 'react-icons/bs';
import { Dropdown } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getMenuForRole } from '@/utils/sidebarMenu';

interface Props { onToggleSidebar: () => void; }

export function TopNavbar({ onToggleSidebar }: Props) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const menu = user ? getMenuForRole(user.roles) : [];
  const currentItem = menu.find(item =>
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  );
  const pageTitle = currentItem?.label ?? 'EduSphere';

  const initials = (user?.name ?? '?')
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="topbar">
      <button className="icon-btn" onClick={onToggleSidebar} title="Toggle sidebar">
        <BsList size={17} />
      </button>

      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginLeft: 4 }}>
        {pageTitle}
      </span>

      <div style={{ flex: 1 }} />

      {/* Theme toggle */}
      <button className="icon-btn" onClick={toggleTheme} title={theme === 'light' ? 'Dark mode' : 'Light mode'}>
        {theme === 'light' ? <BsMoon size={14} /> : <BsSun size={14} />}
      </button>

      {/* Notifications */}
      <Dropdown align="end">
        <Dropdown.Toggle as="button" className="icon-btn" style={{ position: 'relative' }}>
          <BsBell size={15} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 5, right: 5,
              width: 7, height: 7, borderRadius: '50%',
              background: '#EF4444', border: '1.5px solid var(--surface)',
            }} />
          )}
        </Dropdown.Toggle>
        <Dropdown.Menu style={{ width: 300, maxHeight: 360, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px 8px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                <BsCheckAll size={13} /> Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-2)', padding: '24px 0', fontSize: 13 }}>
              You're all caught up
            </div>
          ) : (
            notifications.slice(0, 20).map(n => (
              <Dropdown.Item key={n.id} onClick={() => !n.isRead && markAsRead(n.id)}
                style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', opacity: n.isRead ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  {!n.isRead && (
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0, marginTop: 4 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'normal', lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: 'var(--blue)', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      {n.category?.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              </Dropdown.Item>
            ))
          )}
        </Dropdown.Menu>
      </Dropdown>

      {/* User menu */}
      <Dropdown align="end">
        <Dropdown.Toggle as="button" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '3px 4px', borderRadius: 7, fontFamily: 'inherit' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--blue-dim)', border: '1px solid rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'var(--blue)', flexShrink: 0 }}>
            {initials}
          </div>
          <span className="d-none d-md-inline" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap' }}>
            {user?.name}
          </span>
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <div style={{ padding: '8px 14px 10px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{user?.email}</div>
          </div>
          <Dropdown.Item onClick={() => navigate('/change-password')}>Change Password</Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item onClick={logout} style={{ color: '#DC2626' }}>Sign out</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </header>
  );
}

export default TopNavbar;
