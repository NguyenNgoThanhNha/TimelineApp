// Nền động hiển thị trên MỌI trang — chủ đề "kiên trì leo dốc tới đích".
// Thuần CSS/SVG (không thư viện), tự tắt khi người dùng bật "reduce motion".

const HUES = ['#6366f1', '#a855f7', '#22c55e'];

// Hạt bay lên — ẩn dụ nỗ lực liên tục, tiến lên không ngừng
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 4.5 + 2) % 100,
  size: 4 + (i % 4) * 3,
  duration: 16 + (i % 7) * 3,
  delay: -(i * 1.5),
  color: HUES[i % HUES.length],
}));

export function AnimatedBackground() {
  return (
    <div className="bg-animated" aria-hidden="true">
      {/* các quầng sáng trôi chậm */}
      <span className="bg-orb" style={{ width: 420, height: 420, top: -110, left: -90, background: '#6366f1' }} />
      <span
        className="bg-orb"
        style={{ width: 460, height: 460, top: '14%', right: -150, background: '#a855f7', animationDelay: '-8s' }}
      />
      <span
        className="bg-orb"
        style={{ width: 360, height: 360, bottom: '6%', left: '16%', background: '#22c55e', animationDelay: '-15s' }}
      />

      {/* hạt bay lên */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="bg-particle"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* dãy núi + đường leo dốc tới lá cờ ở đỉnh */}
      <svg className="bg-mountains" viewBox="0 0 1440 360" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path
          className="bg-mtn-back"
          d="M0 360 L0 220 L240 140 L470 230 L720 110 L1010 240 L1230 150 L1440 250 L1440 360 Z"
        />
        <path
          className="bg-mtn-front"
          d="M0 360 L0 285 L300 205 L560 300 L820 190 L1120 300 L1440 235 L1440 360 Z"
        />
        {/* đường mòn leo dốc (nét đứt chuyển động = hành trình không ngừng) */}
        <path className="bg-trail" d="M120 330 C 360 300, 520 245, 720 205 S 1080 145, 1238 104" fill="none" />
        {/* cờ ở đỉnh */}
        <g transform="translate(1238 104)">
          <line className="bg-flagpole" x1="0" y1="0" x2="0" y2="-28" />
          <path className="bg-flag" d="M0 -28 L22 -22 L0 -16 Z" />
        </g>
      </svg>
    </div>
  );
}
