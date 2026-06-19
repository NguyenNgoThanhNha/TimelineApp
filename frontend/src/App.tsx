import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { AuthPage } from '@/pages/AuthPage';
import { TimelinePage } from '@/pages/TimelinePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { Layout, type View } from '@/components/Layout';

export default function App() {
  const { user, isLoading } = useAuth();
  const [view, setView] = useState<View>('timeline');

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-muted-foreground">
        <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
        Đang tải…
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Layout user={user} view={view} onChangeView={setView}>
      {view === 'timeline' ? <TimelinePage /> : <DashboardPage />}
    </Layout>
  );
}
