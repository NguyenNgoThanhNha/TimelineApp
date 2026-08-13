import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { Layout } from '@/components/Layout';
import { ScrollToTop } from '@/components/ScrollToTop';
import { AuthPage } from '@/pages/AuthPage';
import { BlogListPage } from '@/pages/BlogListPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SeriesPage } from '@/pages/SeriesPage';
import { TagsPage } from '@/pages/TagsPage';
import { TimelinePage } from '@/pages/TimelinePage';
import { VocabularyListPage } from '@/pages/VocabularyListPage';
import { VocabularyTodayPage } from '@/pages/VocabularyTodayPage';

// Các trang đọc/soạn Markdown kéo theo bộ tô màu cú pháp (nặng) -> tách chunk riêng
const PostDetailPage = lazy(() =>
  import('@/pages/PostDetailPage').then((m) => ({ default: m.PostDetailPage })),
);
const PostEditorPage = lazy(() =>
  import('@/pages/PostEditorPage').then((m) => ({ default: m.PostEditorPage })),
);
const DocDetailPage = lazy(() =>
  import('@/pages/DocDetailPage').then((m) => ({ default: m.DocDetailPage })),
);
const TaskDetailPage = lazy(() =>
  import('@/pages/TaskDetailPage').then((m) => ({ default: m.TaskDetailPage })),
);
const VocabularyDetailPage = lazy(() =>
  import('@/pages/VocabularyDetailPage').then((m) => ({ default: m.VocabularyDetailPage })),
);
const VocabularyDashboardPage = lazy(() =>
  import('@/pages/VocabularyDashboardPage').then((m) => ({ default: m.VocabularyDashboardPage })),
);
const VocabularyReviewPage = lazy(() =>
  import('@/pages/VocabularyReviewPage').then((m) => ({ default: m.VocabularyReviewPage })),
);

function PageLoader() {
  return (
    <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
      <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
      Đang tải…
    </div>
  );
}

export default function App() {
  const { user, isLoading } = useAuth();

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
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<TimelinePage />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Blog kiến thức — route tĩnh khai báo trước route :slug */}
            <Route path="blog" element={<BlogListPage />} />
            <Route path="blog/moi" element={<PostEditorPage />} />
            <Route path="blog/chuyen-muc" element={<CategoriesPage />} />
            <Route path="blog/chuyen-muc/:category" element={<BlogListPage />} />
            <Route path="blog/the" element={<TagsPage />} />
            <Route path="blog/the/:tag" element={<BlogListPage />} />
            <Route path="blog/chuoi" element={<SeriesPage />} />
            <Route path="blog/chuoi/:series" element={<BlogListPage />} />
            <Route path="blog/:slug" element={<PostDetailPage />} />
            <Route path="blog/:slug/sua" element={<PostEditorPage />} />

            {/* Từ vựng tiếng Anh — route tĩnh khai báo trước route :id */}
            <Route path="tu-vung" element={<VocabularyTodayPage />} />
            <Route path="tu-vung/danh-sach" element={<VocabularyListPage />} />
            <Route path="tu-vung/thong-ke" element={<VocabularyDashboardPage />} />
            <Route path="tu-vung/on-tap" element={<VocabularyReviewPage />} />
            <Route path="tu-vung/:id" element={<VocabularyDetailPage />} />

            {/* Tài liệu đính kèm và trang chi tiết task */}
            <Route path="tai-lieu/:slug" element={<DocDetailPage />} />
            <Route path="task/:id" element={<TaskDetailPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
