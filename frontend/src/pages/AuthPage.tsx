import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';

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
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">🗓️</div>
        <h1>Timeline cá nhân</h1>
        <p className="auth-sub">
          {mode === 'login' ? 'Đăng nhập để xem timeline của bạn' : 'Tạo tài khoản mới'}
        </p>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <input
              className="input"
              placeholder="Họ tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="form-error">⚠️ {error}</div>}

          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>

        <button
          className="auth-switch"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
        >
          {mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
        </button>

        {mode === 'login' && (
          <div className="auth-hint">
            <div>Tài khoản demo:</div>
            <div>
              👑 <b>admin@timeline.local</b> / Admin@123 <span className="muted">(Admin — xem tất cả)</span>
            </div>
            <div>
              👤 <b>user@timeline.local</b> / User@123 <span className="muted">(User — xem của mình)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
