import { NavLink, Link, Outlet } from 'react-router-dom';
import { BookOpen, CalendarDays, FolderTree, LayoutDashboard, LogOut, Tags } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

export type View = 'timeline' | 'dashboard' | 'blog';

const NAV = [
  { to: '/', label: 'Kanban', icon: CalendarDays, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: false },
  { to: '/blog', label: 'Blog', icon: BookOpen, end: false },
];

const FOOTER_LINKS = [
  { to: '/blog', label: 'Bài viết', icon: BookOpen },
  { to: '/blog/chuyen-muc', label: 'Chuyên mục', icon: FolderTree },
  { to: '/blog/the', label: 'Thẻ', icon: Tags },
];

/** Khung chung: header điều hướng + nội dung route + footer. */
export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass-header sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <Logo className="size-9 shrink-0" />
            <div>
              <p className="text-sm font-semibold leading-none">Timeline cá nhân</p>
              <p className="mt-1 text-xs text-muted-foreground">Học — làm — viết lại</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1 rounded-lg border border-border/50 bg-background/50 p-1 backdrop-blur-sm">
              {NAV.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-card/90 text-foreground shadow-sm backdrop-blur-sm'
                        : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
                    )
                  }
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              ))}
            </nav>

            {user && (
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <footer className="mt-8 border-t border-border/40 py-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:px-6">
          <p>Timeline cá nhân — quản lý mốc học tập và ghi lại kiến thức đã học.</p>
          <nav className="flex flex-wrap items-center gap-4">
            {FOOTER_LINKS.map(({ to, label, icon: Icon }) => (
              <Link key={to + label} to={to} className="inline-flex items-center gap-1.5 hover:text-foreground">
                <Icon className="size-3.5" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
