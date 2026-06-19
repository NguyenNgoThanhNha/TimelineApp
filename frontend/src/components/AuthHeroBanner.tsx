import { Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';

/** Banner quảng bá trên màn đăng nhập (desktop: cột trái). */
export function AuthHeroBanner() {
  return (
    <section className="auth-hero relative hidden overflow-hidden rounded-2xl border border-white/15 shadow-2xl shadow-indigo-600/20 lg:flex lg:flex-col lg:justify-between lg:p-10">
      <div className="auth-hero-bg" aria-hidden="true">
        <div className="hero-banner-aurora hero-banner-aurora--1" />
        <div className="hero-banner-aurora hero-banner-aurora--2" />
        <div className="hero-banner-grid" />
        <svg className="auth-hero-constellation" viewBox="0 0 400 300" aria-hidden="true">
          <circle cx="60" cy="220" r="4" fill="white" opacity="0.9" />
          <circle cx="140" cy="170" r="4" fill="white" opacity="0.9" />
          <circle cx="210" cy="200" r="4" fill="white" opacity="0.9" />
          <circle cx="290" cy="120" r="5" fill="#fbbf24" />
          <path
            d="M60 220 L140 170 L210 200 L290 120"
            stroke="white"
            strokeWidth="2"
            strokeDasharray="6 8"
            opacity="0.5"
            className="auth-hero-path"
          />
          <line x1="290" y1="120" x2="290" y2="95" stroke="white" strokeWidth="2" opacity="0.7" />
          <path d="M290 95 L308 102 L290 109 Z" fill="#fbbf24" className="auth-hero-flag" />
        </svg>
      </div>

      <div className="relative z-10 space-y-8">
        <Logo className="size-16 drop-shadow-lg" />

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
            <Sparkles className="size-3.5" />
            Quản lý hành trình cá nhân
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
            Mỗi mốc là một bước
            <br />
            <span className="text-indigo-200">gần hơn tới đích</span>
          </h1>
          <p className="max-w-md text-base leading-relaxed text-white/70">
            Lên kế hoạch, theo dõi tiến độ bằng Kanban kéo thả và xem thống kê trực quan — tất cả trong một
            không gian gọn gàng.
          </p>
        </div>

        <ul className="space-y-3 text-sm text-white/80">
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Kanban 5 trạng thái — kéo thả là cập nhật
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-violet-400" />
            Dashboard tỉ lệ hoàn thành & danh mục
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-amber-400" />
            Lọc, tìm kiếm và quản lý mốc thời gian
          </li>
        </ul>
      </div>

      <p className="relative z-10 text-xs text-white/40">Timeline cá nhân · NestJS + React</p>
    </section>
  );
}
