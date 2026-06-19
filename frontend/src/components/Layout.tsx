import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import type { AuthUser } from '../types/timeline';

export type View = 'timeline' | 'dashboard';

interface Props {
  user: AuthUser;
  view: View;
  onChangeView: (v: View) => void;
  children: ReactNode;
}

export function Layout({ user, view, onChangeView, children }: Props) {
  const { logout } = useAuth();

  return (
    <div className="app">
      <header className="app-header">
        <div className="container header-inner">
          <div className="brand">
            <span className="brand-logo">🗓️</span>
            <div>
              <h1>Timeline cá nhân</h1>
              <p className="brand-sub">
                Xin chào, {user.name}
                {user.role === 'Admin' && <span className="role-tag">Admin</span>}
              </p>
            </div>
          </div>

          <div className="header-right">
            <nav className="nav">
              <button
                className={view === 'timeline' ? 'nav-link active' : 'nav-link'}
                onClick={() => onChangeView('timeline')}
              >
                Timeline
              </button>
              <button
                className={view === 'dashboard' ? 'nav-link active' : 'nav-link'}
                onClick={() => onChangeView('dashboard')}
              >
                Dashboard
              </button>
            </nav>
            <button className="btn btn-logout" onClick={logout}>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="container main-content">{children}</main>
    </div>
  );
}
