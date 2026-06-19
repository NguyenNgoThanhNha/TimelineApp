// Nền toàn app — aurora đêm sao + chòm sao timeline + sóng mềm.

const STARS = Array.from({ length: 48 }, (_, i) => ({
  left: (i * 17 + 3) % 100,
  top: (i * 23 + 7) % 85,
  size: 1 + (i % 3),
  delay: -(i * 0.7),
  duration: 3 + (i % 4),
}));

const NODES = [
  { x: 8, y: 78 },
  { x: 22, y: 62 },
  { x: 38, y: 68 },
  { x: 55, y: 48 },
  { x: 72, y: 55 },
  { x: 88, y: 32 },
];

export function AnimatedBackground() {
  return (
    <div className="bg-scene" aria-hidden="true">
      <div className="bg-sky" />
      <div className="bg-aurora bg-aurora--1" />
      <div className="bg-aurora bg-aurora--2" />
      <div className="bg-aurora bg-aurora--3" />
      <div className="bg-stars" />

      {STARS.map((s, i) => (
        <span
          key={i}
          className="bg-star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      <svg className="bg-constellation" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="line-glow" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#c084fc" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <path
          className="bg-constellation-line"
          d={`M ${NODES.map((n) => `${n.x} ${n.y}`).join(' L ')}`}
          fill="none"
        />
        {NODES.map((n, i) => (
          <circle key={i} className="bg-constellation-node" cx={n.x} cy={n.y} r={i === NODES.length - 1 ? 1.2 : 0.8} />
        ))}
        <g transform={`translate(${NODES[NODES.length - 1].x} ${NODES[NODES.length - 1].y})`}>
          <line className="bg-flagpole" x1="0" y1="0" x2="0" y2="-3.5" />
          <path className="bg-flag" d="M0 -3.5 L2.8 -2.8 L0 -2.1 Z" />
        </g>
      </svg>

      <svg className="bg-wave" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
        <path
          className="bg-wave-layer bg-wave-layer--1"
          d="M0 120 C480 40 960 160 1440 80 L1440 200 L0 200 Z"
        />
        <path
          className="bg-wave-layer bg-wave-layer--2"
          d="M0 140 C360 90 720 170 1080 110 C1260 85 1380 95 1440 100 L1440 200 L0 200 Z"
        />
        <path
          className="bg-wave-layer bg-wave-layer--3"
          d="M0 165 C400 130 800 185 1440 150 L1440 200 L0 200 Z"
        />
      </svg>

      <div className="bg-fade-bottom" />
    </div>
  );
}
