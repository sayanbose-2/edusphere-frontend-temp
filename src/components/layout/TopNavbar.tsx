import { BsList, BsBell, BsPersonCircle, BsCheckAll, BsSun, BsMoon } from 'react-icons/bs';
import { Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { formatEnum } from '@/utils/formatters';

interface TopNavbarProps {
  onToggleSidebar: () => void;
}

export function TopNavbar({ onToggleSidebar }: TopNavbarProps) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="topbar d-flex align-items-center px-4 gap-3" style={{ zIndex: 1030 }}>
      <button
        onClick={onToggleSidebar}
        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4, lineHeight: 1, borderRadius: '4px' }}
      >
        <BsList size={20} />
      </button>

      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
        {user?.roles[0] ? formatEnum(user.roles[0]) : ''} Portal
      </span>

      <div className="ms-auto d-flex align-items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '5px 8px', lineHeight: 1, borderRadius: '6px', transition: 'all 0.15s' }}
        >
          {theme === 'light' ? <BsMoon size={15} /> : <BsSun size={15} />}
        </button>

        {/* Notification bell */}
        <Dropdown align="end">
          <Dropdown.Toggle
            as="button"
            style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', position: 'relative', padding: '5px 8px', lineHeight: 1, borderRadius: '6px' }}
          >
            <BsBell size={16} />
            {unreadCount > 0 && (
              <span
                style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: '#dc2626', border: '1.5px solid #fff' }}
              />
            )}
          </Dropdown.Toggle>
          <Dropdown.Menu style={{ width: 300, maxHeight: 380, overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <BsCheckAll size={14} /> Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '16px 0', fontSize: '0.8rem' }}>
                No notifications
              </div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <Dropdown.Item
                  key={n.notificationId}
                  onClick={() => !n.isRead && markAsRead(n.notificationId)}
                  style={{ opacity: n.isRead ? 0.5 : 1 }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{n.message}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>{n.category}</div>
                </Dropdown.Item>
              ))
            )}
          </Dropdown.Menu>
        </Dropdown>

        {/* User menu */}
        <Dropdown align="end">
          <Dropdown.Toggle
            as="button"
            style={{ background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 500, transition: 'background 0.15s' }}
          >
            <BsPersonCircle size={16} />
            <span className="d-none d-md-inline">
              {user?.name}
            </span>
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => navigate('/change-password')}>Change Password</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={logout} style={{ color: '#dc2626 !important' }}>Logout</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </header>
  );
}

export default TopNavbar;
