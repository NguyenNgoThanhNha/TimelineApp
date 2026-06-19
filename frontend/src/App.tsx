import { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { TimelinePage } from './pages/TimelinePage';
import { DashboardPage } from './pages/DashboardPage';
import { Layout, type View } from './components/Layout';

export default function App() {
  const { user, isLoading } = useAuth();
  const [view, setView] = useState<View>('timeline');

  if (isLoading) {
    return <div className="full-center">⏳ Đang tải…</div>;
  }

  // Chưa đăng nhập -> màn hình đăng nhập/đăng ký
  if (!user) {
    return <AuthPage />;
  }

  // Đã đăng nhập -> layout + tab Timeline / Dashboard
  return (
    <Layout user={user} view={view} onChangeView={setView}>
      {view === 'timeline' ? <TimelinePage /> : <DashboardPage />}
    </Layout>
  );
}
