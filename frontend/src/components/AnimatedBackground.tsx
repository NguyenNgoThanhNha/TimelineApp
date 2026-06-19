// Nền động toàn app — mesh gradient Shadcn + lưới chấm + đỉnh núi mờ (hành trình tới đích).

const ORBS: Array<{
  w: number;
  h: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  color: string;
  delay: string;
}> = [
  { w: 520, h: 520, top: '-12%', left: '-8%', color: 'hsl(240 80% 72%)', delay: '0s' },
  { w: 480, h: 480, top: '8%', right: '-10%', color: 'hsl(280 70% 74%)', delay: '-9s' },
  { w: 400, h: 400, bottom: '8%', left: '22%', color: 'hsl(200 75% 72%)', delay: '-16s' },
  { w: 320, h: 320, bottom: '20%', right: '18%', color: 'hsl(330 65% 78%)', delay: '-5s' },
];

const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  left: 6 + i * 6.8,
  size: 3 + (i % 3),
  duration: 18 + (i % 5) * 4,
  delay: -(i * 2.1),
  opacity: 0.15 + (i % 4) * 0.05,
}));

export function AnimatedBackground() {
  return (
    <div className="bg-scene" aria-hidden="true">
      <div className="bg-mesh" />
      <div className="bg-dots" />
      <div className="bg-noise" />

      {ORBS.map((orb, i) => (
        <span
          key={i}
          className="bg-orb"
          style={{
            width: orb.w,
            height: orb.h,
            top: orb.top,
            left: orb.left,
            right: orb.right,
            bottom: orb.bottom,
            background: orb.color,
            animationDelay: orb.delay,
          }}
        />
      ))}

      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="bg-spark"
          style={{
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      <svg className="bg-ridge" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ridge-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(240 30% 88%)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="hsl(240 30% 88%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ridge-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(248 35% 82%)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="hsl(248 35% 82%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trail-glow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(38 92% 58%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(38 92% 58%)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(38 92% 58%)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          fill="url(#ridge-far)"
          d="M0 320 L0 210 L280 150 L520 220 L760 130 L1040 210 L1280 160 L1440 200 L1440 320 Z"
        />
        <path
          fill="url(#ridge-near)"
          d="M0 320 L0 260 L340 200 L620 270 L900 185 L1180 260 L1440 220 L1440 320 Z"
        />

        <path
          className="bg-trail-glow"
          d="M80 290 C 320 265, 500 220, 720 185 S 1060 135, 1260 98"
          fill="none"
        />
        <path
          className="bg-trail"
          d="M80 290 C 320 265, 500 220, 720 185 S 1060 135, 1260 98"
          fill="none"
        />

        <g transform="translate(1260 98)">
          <line className="bg-flagpole" x1="0" y1="0" x2="0" y2="-26" />
          <path className="bg-flag" d="M0 -26 L20 -21 L0 -16 Z" />
        </g>
      </svg>

      <div className="bg-vignette" />
    </div>
  );
}
