import type { ReactNode } from 'react';
import { CalendarDays, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import type { AuthUser } from '@/types/timeline';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { HeroBanner } from '@/components/HeroBanner';
import { cn } from '@/lib/utils';

export type View = 'timeline' | 'dashboard';

interface Props {
  user: AuthUser;
  view: View;
  onChangeView: (v: View) => void;
  onAddMilestone?: () => void;
  children: ReactNode;
}

const NAV = [
  { id: 'timeline' as const, label: 'Kanban', icon: CalendarDays },
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
];

export function Layout({ user, view, onChangeView, onAddMilestone, children }: Props) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="glass-header sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo className="size-9 shrink-0" />
            <div>
              <p className="text-sm font-semibold leading-none">Timeline cá nhân</p>
              <p className="mt-1 text-xs text-muted-foreground">Quản lý mốc thời gian</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1 rounded-lg border border-border/50 bg-background/50 p-1 backdrop-blur-sm" role="tablist">
              {NAV.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={view === id}
                  type="button"
                  onClick={() => onChangeView(id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    view === id
                      ? 'bg-card/90 text-foreground shadow-sm backdrop-blur-sm'
                      : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </nav>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <HeroBanner user={user} view={view} onAddMilestone={onAddMilestone} />
        <div key={view} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
