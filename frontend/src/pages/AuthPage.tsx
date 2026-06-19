import { useState, type FormEvent } from 'react';
import { CalendarDays } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CalendarDays className="size-6" />
          </div>
          <CardTitle className="text-2xl">Timeline cá nhân</CardTitle>
          <CardDescription>
            {mode === 'login' ? 'Đăng nhập để quản lý Kanban của bạn' : 'Tạo tài khoản mới'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="name">Họ tên</Label>
                <Input
                  id="name"
                  placeholder="Họ tên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </Button>
          </form>

          <button
            type="button"
            className="mt-4 w-full text-center text-sm font-medium text-primary hover:underline"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
          >
            {mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
          </button>

          {mode === 'login' && (
            <div className="mt-6 rounded-lg border bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">Tài khoản demo</p>
              <p>
                <b>admin@timeline.local</b> / Admin@123 <span>(Admin)</span>
              </p>
              <p>
                <b>user@timeline.local</b> / User@123 <span>(User)</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
