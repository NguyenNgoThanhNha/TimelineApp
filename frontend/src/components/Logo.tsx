interface LogoProps {
  className?: string;
}

/**
 * Logo: ô bo góc gradient + đường mốc đi LÊN tới lá cờ ở đỉnh
 * — ẩn dụ "kiên trì leo dốc tới đích".
 */
export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Timeline cá nhân"
    >
      <defs>
        <linearGradient id="tl-logo" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      <rect width="48" height="48" rx="13" fill="url(#tl-logo)" />

      {/* đường leo dốc qua các mốc */}
      <path
        d="M12 33 L22 25 L29 29 L37 15"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <circle cx="12" cy="33" r="2.5" fill="white" />
      <circle cx="22" cy="25" r="2.5" fill="white" />
      <circle cx="29" cy="29" r="2.5" fill="white" />

      {/* cờ ở đỉnh (đích đến) */}
      <line x1="37" y1="15" x2="37" y2="8" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M37 8 L43.5 10.2 L37 12.6 Z" fill="#fbbf24" />
    </svg>
  );
}
