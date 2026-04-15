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

      <span className="text-sm font-semibold text-base ml-1">
        {pageTitle}
      </span>

      <div className="flex-1" />

      {/* Theme toggle */}
      <button className="icon-btn" onClick={toggleTheme} title={theme === 'light' ? 'Dark mode' : 'Light mode'}>
        {theme === 'light' ? <BsMoon size={14} /> : <BsSun size={14} />}
      </button>

      {/* Notifications */}
      <Dropdown align="end">
        <Dropdown.Toggle as="button" className="icon-btn relative">
          <BsBell size={15} />
          {unreadCount > 0 && (
            <span className="absolute w-1.5 h-1.5 rounded-full bg-red-500 border border-surface top-1 right-1" />
          )}
        </Dropdown.Toggle>
        <Dropdown.Menu className="w-80 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center px-3.5 py-2 border-b border-light">
            <span className="text-xs font-semibold text-base">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="bg-transparent border-0 text-primary-600 text-xs cursor-pointer flex items-center gap-1 font-inherit hover:text-primary-700">
                <BsCheckAll size={13} /> Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="text-center text-secondary py-6 text-xs">
              You're all caught up
            </div>
          ) : (
            notifications.slice(0, 20).map(n => (
              <Dropdown.Item key={n.id} onClick={() => !n.isRead && markAsRead(n.id)}
                className={`border-b border-light px-3.5 py-2 transition-opacity ${n.isRead ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-2">
                  {!n.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-base whitespace-normal leading-relaxed">{n.message}</div>
                    <div className="text-xs text-primary-600 mt-0.5 font-semibold uppercase tracking-wide">
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
        <Dropdown.Toggle as="button" className="bg-transparent border-0 cursor-pointer flex items-center gap-2 px-1 py-0.5 rounded font-inherit hover:bg-base transition-colors">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black text-primary-600 border bg-blue-dim border-blue/15">
            {initials}
          </div>
          <span className="hidden md:inline text-xs font-medium text-base whitespace-nowrap">
            {user?.name}
          </span>
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <div className="px-3.5 py-2.5 border-b border-light mb-1">
            <div className="text-xs font-semibold text-base">{user?.name}</div>
            <div className="text-xs text-secondary">{user?.email}</div>
          </div>
          <Dropdown.Item onClick={() => navigate('/change-password')}>Change Password</Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item onClick={logout} className="text-danger">Sign out</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </header>
  );
}

export default TopNavbar;
