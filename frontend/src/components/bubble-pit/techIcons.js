// ─── 14 Rich Tech Stack SVG Data URIs ─────────────────────────────────────────
export const TECH_ICONS = [
  // 1. React
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#0d1117"/>
      <circle cx="50" cy="50" r="7" fill="#61dafb"/>
      <g stroke="#61dafb" stroke-width="2.5" fill="none">
        <ellipse cx="50" cy="50" rx="34" ry="13"/>
        <ellipse cx="50" cy="50" rx="34" ry="13" transform="rotate(60 50 50)"/>
        <ellipse cx="50" cy="50" rx="34" ry="13" transform="rotate(120 50 50)"/>
      </g>
    </svg>
  `)}`,
  // 2. TypeScript
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#3178c6"/>
      <text x="50" y="66" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" fill="#ffffff" text-anchor="middle" letter-spacing="-1">TS</text>
    </svg>
  `)}`,
  // 3. JavaScript
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#f7df1e"/>
      <text x="50" y="66" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" fill="#000000" text-anchor="middle" letter-spacing="-1">JS</text>
    </svg>
  `)}`,
  // 4. Python
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#1e293b"/>
      <path d="M50 20 c-12 0 -20 5 -20 15 l0 8 l20 0 l0 3 l-28 0 c-10 0 -15 8 -15 20 c0 12 7 20 18 20 l6 0 l0 -9 c0 -11 9 -19 20 -19 l19 0 c9 0 16 -7 16 -16 l0 -6 c0 -10 -7 -16 -16 -16 z" fill="#387eb8"/>
      <circle cx="42" cy="28" r="3" fill="#ffffff"/>
      <path d="M50 80 c12 0 20 -5 20 -15 l0 -8 l-20 0 l0 -3 l28 0 c10 0 15 -8 15 -20 c0 -12 -7 -20 -18 -20 l-6 0 l0 9 c0 11 -9 19 -20 19 l-19 0 c-9 0 -16 7 -16 16 l0 6 c0 10 7 16 16 16 z" fill="#ffe052"/>
      <circle cx="58" cy="72" r="3" fill="#ffffff"/>
    </svg>
  `)}`,
  // 5. Next.js
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#000000"/>
      <circle cx="50" cy="50" r="48" fill="#000000" stroke="#333333" stroke-width="2"/>
      <path d="M36 28 L36 72 M36 28 L68 70 M68 28 L68 72" stroke="#ffffff" stroke-width="6.5" stroke-linecap="round" fill="none"/>
    </svg>
  `)}`,
  // 6. Node.js
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#14532d"/>
      <polygon points="50,18 80,34 80,66 50,82 20,66 20,34" fill="#22c55e"/>
      <text x="50" y="58" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#ffffff" text-anchor="middle">node</text>
    </svg>
  `)}`,
  // 7. Docker
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#0284c7"/>
      <rect x="22" y="44" width="8" height="7" rx="1" fill="#ffffff"/>
      <rect x="32" y="44" width="8" height="7" rx="1" fill="#ffffff"/>
      <rect x="42" y="44" width="8" height="7" rx="1" fill="#ffffff"/>
      <rect x="32" y="35" width="8" height="7" rx="1" fill="#ffffff"/>
      <rect x="42" y="35" width="8" height="7" rx="1" fill="#ffffff"/>
      <rect x="52" y="35" width="8" height="7" rx="1" fill="#ffffff"/>
      <rect x="52" y="44" width="8" height="7" rx="1" fill="#ffffff"/>
      <path d="M80 48c-2-5-8-8-13-7-3-7-13-10-20-7-1 0-1 0-2 1v15H24c-5 0-9 4-9 9 0 11 9 20 20 20 16 0 32-11 36-23 4-1 7-4 11-7z" fill="#ffffff"/>
    </svg>
  `)}`,
  // 8. Java
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#1e3a5f"/>
      <path d="M35 50 c15 5 25 -5 32 4 c0 0 -4 4 -12 6 c-15 4 -28 -5 -20 -10 z" fill="#f97316"/>
      <path d="M30 62 c18 6 35 -4 45 4 c0 0 -5 5 -15 7 c-20 4 -38 -6 -30 -11 z" fill="#f97316"/>
      <path d="M48 24 c5 8 -2 15 -2 15 c0 0 8 -7 4 -15 z" fill="#ea580c"/>
    </svg>
  `)}`,
  // 9. Git
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#f05032"/>
      <g transform="rotate(45 50 50)" fill="#ffffff">
        <rect x="46" y="24" width="8" height="52" rx="4"/>
        <circle cx="50" cy="28" r="8"/>
        <circle cx="50" cy="72" r="8"/>
        <circle cx="68" cy="50" r="8"/>
        <path d="M50 48 Q 50 50 68 50" stroke="#ffffff" stroke-width="8" fill="none"/>
      </g>
    </svg>
  `)}`,
  // 10. PostgreSQL
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#1e3a8a"/>
      <text x="50" y="65" font-family="system-ui, sans-serif" font-weight="900" font-size="38" fill="#ffffff" text-anchor="middle">SQL</text>
    </svg>
  `)}`,
  // 11. AWS
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#090d16"/>
      <text x="50" y="52" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">AWS</text>
      <path d="M28 64 Q50 78 72 64" stroke="#ff9900" stroke-width="5" stroke-linecap="round" fill="none"/>
      <polygon points="72,64 67,58 65,65" fill="#ff9900"/>
    </svg>
  `)}`,
  // 12. Rust
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#9a3412"/>
      <circle cx="50" cy="50" r="44" stroke="#ffffff" stroke-width="3" stroke-dasharray="8 4" fill="none"/>
      <text x="50" y="67" font-family="Georgia, serif" font-weight="bold" font-size="48" fill="#ffffff" text-anchor="middle">R</text>
    </svg>
  `)}`,
  // 13. GraphQL
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#831843"/>
      <polygon points="50,18 78,34 78,66 50,82 22,66 22,34" stroke="#f43f5e" stroke-width="4" fill="none"/>
      <circle cx="50" cy="18" r="5" fill="#ffffff"/>
      <circle cx="78" cy="34" r="5" fill="#ffffff"/>
      <circle cx="78" cy="66" r="5" fill="#ffffff"/>
      <circle cx="50" cy="82" r="5" fill="#ffffff"/>
      <circle cx="22" cy="66" r="5" fill="#ffffff"/>
      <circle cx="22" cy="34" r="5" fill="#ffffff"/>
      <polygon points="50,28 70,62 30,62" stroke="#ffffff" stroke-width="3" fill="none"/>
    </svg>
  `)}`,
  // 14. Linux
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="#18181b"/>
      <ellipse cx="50" cy="55" rx="22" ry="28" fill="#ffffff"/>
      <ellipse cx="50" cy="55" rx="18" ry="24" fill="#000000"/>
      <ellipse cx="44" cy="45" rx="4" ry="6" fill="#ffffff"/>
      <ellipse cx="56" cy="45" rx="4" ry="6" fill="#ffffff"/>
      <circle cx="45" cy="46" r="2" fill="#000000"/>
      <circle cx="55" cy="46" r="2" fill="#000000"/>
      <polygon points="46,50 54,50 50,56" fill="#f59e0b"/>
      <ellipse cx="40" cy="74" rx="8" ry="4" fill="#f59e0b"/>
      <ellipse cx="60" cy="74" rx="8" ry="4" fill="#f59e0b"/>
    </svg>
  `)}`
];
