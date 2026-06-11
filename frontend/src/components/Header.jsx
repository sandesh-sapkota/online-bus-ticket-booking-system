import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const BusLogo = () => (
  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-sm">
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M3 10h18" strokeLinecap="round" />
      <circle cx="7.5" cy="20" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="20" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  </span>
);

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/buses', label: 'Find Buses' },
  { to: '/bookings', label: 'My Bookings' },
];

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive ? 'text-accent-softfg bg-accent-soft' : 'text-muted hover:text-fg hover:bg-surface2'
    }`;

  const initials =
    user?.firstName || user?.lastName
      ? `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()
      : null;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/85 backdrop-blur">
      <nav className="container-app flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <BusLogo />
          <span className="text-xl font-extrabold tracking-tight text-fg">
            Bus<span className="text-accent">Go</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <span className="flex items-center gap-2 text-sm text-muted">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-softfg">
                  {initials || '👤'}
                </span>
                <span className="font-medium text-fg">{user?.firstName ?? 'Account'}</span>
              </span>
              <button onClick={handleLogout} className="btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="btn-ghost"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-line bg-surface md:hidden">
          <div className="container-app flex flex-col gap-1 py-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
              {isAuthenticated ? (
                <button onClick={handleLogout} className="btn-secondary btn-block">
                  Logout
                </button>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary btn-block" onClick={() => setOpen(false)}>
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary btn-block" onClick={() => setOpen(false)}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
