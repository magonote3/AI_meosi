// 実機忠実ベクター図柄グラフィック描画エンジン
// ディスクアップ ULTRAREMIX & スマスロ サンダーV 完全対応

const SYMBOL_CACHE = new Map();

/**
 * 機種に応じた超高精細ベクター図柄SVGを生成
 * @param {string} type 図柄コード
 * @param {string} machineId 機種ID ('discup_ultraremix' | 'thunderv')
 */
export function getSymbolSVG(type, machineId = 'discup_ultraremix') {
  if (machineId === 'thunderv') {
    return getThunderVSymbolSVG(type);
  }
  return getDiscupSymbolSVG(type);
}

/**
 * ディスクアップ ULTRAREMIX 忠実ベクターSVG
 */
export function getDiscupSymbolSVG(type) {
  switch (type) {
    case 'r7':
    case 'red7':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90" width="100%" height="100%">
        <defs>
          <linearGradient id="r7-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff3b4e"/>
            <stop offset="35%" stop-color="#e61025"/>
            <stop offset="70%" stop-color="#b80012"/>
            <stop offset="100%" stop-color="#70000a"/>
          </linearGradient>
          <linearGradient id="r7-hl" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ff99a8"/>
            <stop offset="100%" stop-color="#ff1a35"/>
          </linearGradient>
          <linearGradient id="r7-arrow-grad" x1="0%" y1="100%" x2="80%" y2="0%">
            <stop offset="0%" stop-color="#99000e"/>
            <stop offset="50%" stop-color="#e60017"/>
            <stop offset="100%" stop-color="#ff596c"/>
          </linearGradient>
          <filter id="r7-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g filter="url(#r7-shadow)">
          <path d="M 12 14 L 114 14 L 122 34 L 52 78 L 22 78 L 62 34 L 12 34 Z" 
                fill="#000" stroke="#000" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>
          <path d="M 12 14 L 114 14 L 122 34 L 52 78 L 22 78 L 62 34 L 12 34 Z" 
                fill="url(#r7-grad)"/>

          <polygon points="14,16 110,16 116,28 66,28 14,28" fill="url(#r7-hl)" opacity="0.85"/>
          <line x1="16" y1="17" x2="108" y2="17" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>

          <line x1="50" y1="46" x2="68" y2="46" stroke="#400005" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="43" y1="54" x2="61" y2="54" stroke="#400005" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="36" y1="62" x2="54" y2="62" stroke="#400005" stroke-width="2.5" stroke-linecap="round"/>

          <path d="M 72 62 L 64 62 L 78 44 L 92 44 L 92 32 L 118 52 L 94 72 L 94 62 Z" 
                fill="#000" stroke="#000" stroke-width="5" stroke-linejoin="round"/>
          <path d="M 72 62 L 64 62 L 78 44 L 92 44 L 92 32 L 118 52 L 94 72 L 94 62 Z" 
                fill="url(#r7-arrow-grad)" stroke="#ffccd2" stroke-width="1.5" stroke-linejoin="round"/>

          <text x="82" y="74" font-family="'Impact', 'Arial Black', sans-serif" font-size="20" font-weight="900" 
                fill="#000" stroke="#000" stroke-width="3.5" font-style="italic">UP</text>
          <text x="82" y="74" font-family="'Impact', 'Arial Black', sans-serif" font-size="20" font-weight="900" 
                fill="#fff" font-style="italic">UP</text>
          <text x="83" y="73" font-family="'Impact', 'Arial Black', sans-serif" font-size="20" font-weight="900" 
                fill="#ff3b4e" font-style="italic" opacity="0.3">UP</text>
        </g>
      </svg>`;

    case 'b7':
    case 'white7':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90" width="100%" height="100%">
        <defs>
          <linearGradient id="w7-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="40%" stop-color="#f0f9ff"/>
            <stop offset="80%" stop-color="#bae6fd"/>
            <stop offset="100%" stop-color="#38bdf8"/>
          </linearGradient>
          <linearGradient id="w7-wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#a855f7"/>
            <stop offset="50%" stop-color="#06b6d4"/>
            <stop offset="100%" stop-color="#3b82f6"/>
          </linearGradient>
          <filter id="w7-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g filter="url(#w7-shadow)">
          <path d="M 12 14 L 116 14 L 122 32 L 56 78 L 26 78 L 64 34 L 12 34 Z" 
                fill="#000" stroke="#000" stroke-width="7" stroke-linejoin="round"/>
          <path d="M 12 14 L 116 14 L 122 32 L 56 78 L 26 78 L 64 34 L 12 34 Z" 
                fill="url(#w7-grad)" stroke="#38bdf8" stroke-width="2.5" stroke-linejoin="round"/>

          <polygon points="14,16 112,16 118,28 66,28 14,28" fill="#ffffff" opacity="0.9"/>

          <path d="M 16 38 L 24 38 L 28 30 L 32 46 L 36 34 L 40 42 L 44 38 L 54 38 L 60 22 L 68 58 L 74 34 L 80 48 L 86 38 L 112 38" 
                fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M 16 38 L 24 38 L 28 30 L 32 46 L 36 34 L 40 42 L 44 38 L 54 38 L 60 22 L 68 58 L 74 34 L 80 48 L 86 38 L 112 38" 
                fill="none" stroke="url(#w7-wave-grad)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M 16 38 L 24 38 L 28 30 L 32 46 L 36 34 L 40 42 L 44 38 L 54 38 L 60 22 L 68 58 L 74 34 L 80 48 L 86 38 L 112 38" 
                fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>

          <g transform="translate(62, 58)">
            <text x="0" y="16" font-family="'Impact', 'Arial Black', sans-serif" font-size="18" font-style="italic" 
                  fill="#000" stroke="#000" stroke-width="5" letter-spacing="1">ULTRA</text>
            <text x="0" y="16" font-family="'Impact', 'Arial Black', sans-serif" font-size="18" font-style="italic" 
                  fill="#0284c7" stroke="#00f0ff" stroke-width="2.5" letter-spacing="1">ULTRA</text>
            <text x="0" y="16" font-family="'Impact', 'Arial Black', sans-serif" font-size="18" font-style="italic" 
                  fill="#ffffff" letter-spacing="1">ULTRA</text>
          </g>
        </g>
      </svg>`;

    case 'bar':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90" width="100%" height="100%">
        <defs>
          <linearGradient id="bar-bg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#141416"/>
            <stop offset="50%" stop-color="#050507"/>
            <stop offset="100%" stop-color="#000000"/>
          </linearGradient>
          <linearGradient id="bar-up-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </linearGradient>
          <filter id="bar-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g filter="url(#bar-shadow)">
          <rect x="6" y="16" width="118" height="58" rx="4" fill="#000" stroke="#000" stroke-width="3"/>
          <rect x="7" y="17" width="116" height="56" rx="3" fill="url(#bar-bg)"/>
          
          <rect x="9" y="19" width="112" height="52" rx="2" fill="none" stroke="#00e5ff" stroke-width="1.8"/>
          <rect x="13" y="23" width="104" height="44" rx="2" fill="none" stroke="rgba(0,229,255,0.4)" stroke-width="1"/>

          <line x1="20" y1="31" x2="62" y2="31" stroke="#00e5ff" stroke-width="1.8"/>
          <line x1="20" y1="59" x2="62" y2="59" stroke="#00e5ff" stroke-width="1.8"/>
          
          <text x="41" y="49" font-family="'Impact', 'Arial Black', sans-serif" font-size="18" font-style="italic" 
                fill="#00e5ff" text-anchor="middle" letter-spacing="1">DISC</text>

          <text x="82" y="55" font-family="'Impact', 'Arial Black', sans-serif" font-size="28" font-style="italic" 
                fill="#000" stroke="#000" stroke-width="3" text-anchor="middle">UP</text>
          <text x="82" y="55" font-family="'Impact', 'Arial Black', sans-serif" font-size="28" font-style="italic" 
                fill="url(#bar-up-grad)" stroke="#00e5ff" stroke-width="1.5" text-anchor="middle">UP</text>
          <text x="82" y="55" font-family="'Impact', 'Arial Black', sans-serif" font-size="28" font-style="italic" 
                fill="#fff" opacity="0.3" text-anchor="middle">UP</text>

          <polygon points="106,31 99,46 105,46 100,59 114,43 107,43" 
                   fill="#00e5ff" stroke="#fff" stroke-width="1"/>
        </g>
      </svg>`;

    case 'remix':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90" width="100%" height="100%">
        <defs>
          <linearGradient id="rmx-metal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="30%" stop-color="#e2e8f0"/>
            <stop offset="70%" stop-color="#94a3b8"/>
            <stop offset="100%" stop-color="#475569"/>
          </linearGradient>
          <filter id="rmx-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g filter="url(#rmx-shadow)">
          <ellipse cx="40" cy="45" rx="32" ry="24" fill="none" stroke="#475569" stroke-width="5" opacity="0.5"/>
          <ellipse cx="40" cy="45" rx="28" ry="20" fill="none" stroke="#cbd5e1" stroke-width="2.5" opacity="0.8"/>
          <ellipse cx="40" cy="45" rx="22" ry="16" fill="none" stroke="#94a3b8" stroke-width="1.8"/>
          <ellipse cx="40" cy="45" rx="14" ry="10" fill="none" stroke="#64748b" stroke-width="2"/>
          <circle cx="40" cy="45" r="4" fill="#334155" stroke="#94a3b8" stroke-width="1"/>

          <text x="64" y="30" font-family="'Brush Script MT', 'Georgia', cursive, sans-serif" 
                font-size="12" font-style="italic" fill="#cbd5e1" stroke="#000" stroke-width="0.8">The</text>

          <text x="66" y="56" font-family="'Impact', 'Arial Black', sans-serif" font-size="28" font-style="italic" 
                fill="#000" stroke="#000" stroke-width="6" text-anchor="middle" letter-spacing="1">REMIX</text>
          <text x="66" y="56" font-family="'Impact', 'Arial Black', sans-serif" font-size="28" font-style="italic" 
                fill="url(#rmx-metal)" stroke="#ffffff" stroke-width="1.2" text-anchor="middle" letter-spacing="1">REMIX</text>

          <path d="M 28 62 C 45 66, 85 68, 118 52" fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
          <path d="M 32 64 C 48 68, 85 70, 114 54" fill="none" stroke="#f1f5f9" stroke-width="1.5" stroke-linecap="round"/>
        </g>
      </svg>`;

    case 'suika':
    case 'watermelon':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90" width="100%" height="100%">
        <defs>
          <linearGradient id="wm-rind" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#16a34a"/>
            <stop offset="60%" stop-color="#15803d"/>
            <stop offset="100%" stop-color="#14532d"/>
          </linearGradient>
          <linearGradient id="wm-flesh" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ef4444"/>
            <stop offset="100%" stop-color="#b91c1c"/>
          </linearGradient>
          <filter id="wm-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g filter="url(#wm-shadow)">
          <g>
            <path d="M 38 34 C 38 68, 118 68, 118 34 Z" 
                  fill="#000" stroke="#000" stroke-width="6" stroke-linejoin="round"/>
            <path d="M 38 34 C 38 68, 118 68, 118 34 Z" 
                  fill="url(#wm-rind)"/>

            <path d="M 52 38 Q 48 48 54 58 Q 50 63 56 65" 
                  fill="none" stroke="#0a0a0a" stroke-width="4.5" stroke-linecap="round"/>
            <path d="M 76 38 Q 72 48 78 54 Q 74 62 76 66" 
                  fill="none" stroke="#0a0a0a" stroke-width="5" stroke-linecap="round"/>
            <path d="M 100 38 Q 104 46 98 54 Q 102 60 98 64" 
                  fill="none" stroke="#0a0a0a" stroke-width="4.5" stroke-linecap="round"/>

            <ellipse cx="78" cy="34" rx="40" ry="12" fill="#000" stroke="#000" stroke-width="2"/>
            <ellipse cx="78" cy="34" rx="38" ry="11" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5"/>
            <ellipse cx="78" cy="34" rx="34" ry="9" fill="url(#wm-flesh)"/>

            <ellipse cx="60" cy="33" rx="2" ry="1.2" fill="#000"/>
            <ellipse cx="70" cy="35" rx="2" ry="1.2" fill="#000"/>
            <ellipse cx="78" cy="32" rx="2" ry="1.2" fill="#000"/>
            <ellipse cx="88" cy="35" rx="2" ry="1.2" fill="#000"/>
            <ellipse cx="96" cy="33" rx="2" ry="1.2" fill="#000"/>
          </g>

          <g>
            <path d="M 14 54 C 20 74, 46 76, 50 66 L 36 46 Z" 
                  fill="#000" stroke="#000" stroke-width="4" stroke-linejoin="round"/>
            <path d="M 14 54 C 20 74, 46 76, 50 66 L 46 62 C 40 70, 22 68, 18 52 Z" 
                  fill="#15803d"/>
            <path d="M 18 52 C 22 68, 40 70, 46 62 L 36 48 Z" 
                  fill="#ef4444"/>
            <path d="M 17 53 C 21 67, 39 69, 45 61" 
                  fill="none" stroke="#f0fdf4" stroke-width="1.2"/>
            <circle cx="28" cy="56" r="1.5" fill="#000"/>
            <circle cx="34" cy="60" r="1.5" fill="#000"/>
          </g>
        </g>
      </svg>`;

    case 'cherry':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90" width="100%" height="100%">
        <defs>
          <radialGradient id="ch-ball-1" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stop-color="#ff66b2"/>
            <stop offset="35%" stop-color="#ff007f"/>
            <stop offset="75%" stop-color="#b80053"/>
            <stop offset="100%" stop-color="#590024"/>
          </radialGradient>
          <radialGradient id="ch-ball-2" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stop-color="#ff66b2"/>
            <stop offset="35%" stop-color="#ff007f"/>
            <stop offset="75%" stop-color="#b80053"/>
            <stop offset="100%" stop-color="#590024"/>
          </radialGradient>
          <filter id="ch-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g filter="url(#ch-shadow)">
          <g>
            <path d="M 52 24 C 62 14, 88 16, 94 26 C 92 34, 76 38, 62 32 Z" 
                  fill="#000" stroke="#000" stroke-width="4" stroke-linejoin="round"/>
            <path d="M 52 24 C 62 14, 88 16, 94 26 C 92 34, 76 38, 62 32 Z" 
                  fill="#22c55e" stroke="#86efac" stroke-width="1"/>
            <path d="M 54 25 Q 74 24 92 26" fill="none" stroke="#15803d" stroke-width="1.8"/>
            <line x1="66" y1="25" x2="62" y2="20" stroke="#15803d" stroke-width="1.2"/>
            <line x1="76" y1="25" x2="74" y2="30" stroke="#15803d" stroke-width="1.2"/>
          </g>

          <path d="M 44 54 C 42 38, 54 26, 60 22" 
                fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"/>
          <path d="M 44 54 C 42 38, 54 26, 60 22" 
                fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M 78 50 C 74 36, 64 26, 60 22" 
                fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"/>
          <path d="M 78 50 C 74 36, 64 26, 60 22" 
                fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round"/>

          <circle cx="82" cy="54" r="18" fill="#000" stroke="#000" stroke-width="5"/>
          <circle cx="82" cy="54" r="18" fill="url(#ch-ball-2)"/>
          <ellipse cx="77" cy="46" rx="4.5" ry="3" fill="#ffffff" opacity="0.9"/>
          <path d="M 72 64 C 76 68, 86 68, 92 62" fill="none" stroke="#ff99cc" stroke-width="1.5" opacity="0.6"/>

          <circle cx="48" cy="58" r="19" fill="#000" stroke="#000" stroke-width="5"/>
          <circle cx="48" cy="58" r="19" fill="url(#ch-ball-1)"/>
          <ellipse cx="43" cy="49" rx="5" ry="3.5" fill="#ffffff" opacity="0.9"/>
          <path d="M 37 68 C 42 73, 52 73, 58 67" fill="none" stroke="#ff99cc" stroke-width="1.5" opacity="0.6"/>
        </g>
      </svg>`;

    case 'bell':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90" width="100%" height="100%">
        <defs>
          <linearGradient id="bell-star-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fff066"/>
            <stop offset="40%" stop-color="#ffd700"/>
            <stop offset="85%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#d97706"/>
          </linearGradient>
          <radialGradient id="bell-orb" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="40%" stop-color="#fff566"/>
            <stop offset="80%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#b45309"/>
          </radialGradient>
          <filter id="bell-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g filter="url(#bell-shadow)">
          <path d="M 65 10 
                   L 73 25 L 94 18 L 86 36 L 108 45 L 86 54 L 94 72 L 73 65 
                   L 65 80 
                   L 57 65 L 36 72 L 44 54 L 22 45 L 44 36 L 36 18 L 57 25 Z" 
                fill="#000" stroke="#000" stroke-width="6" stroke-linejoin="round"/>
          <path d="M 65 10 
                   L 73 25 L 94 18 L 86 36 L 108 45 L 86 54 L 94 72 L 73 65 
                   L 65 80 
                   L 57 65 L 36 72 L 44 54 L 22 45 L 44 36 L 36 18 L 57 25 Z" 
                fill="url(#bell-star-grad)" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>

          <path d="M 65 18 
                   L 71 29 L 86 24 L 80 38 L 96 45 L 80 52 L 86 66 L 71 61 
                   L 65 72 
                   L 59 61 L 44 66 L 50 52 L 34 45 L 50 38 L 44 24 L 59 29 Z" 
                fill="none" stroke="#ef4444" stroke-width="1.8" stroke-linejoin="round"/>

          <polygon points="36,45 42,42 46,45 42,48" fill="#ef4444" stroke="#000" stroke-width="0.8"/>
          <line x1="46" y1="45" x2="55" y2="45" stroke="#ef4444" stroke-width="2"/>
          <polygon points="94,45 88,42 84,45 88,48" fill="#ef4444" stroke="#000" stroke-width="0.8"/>
          <line x1="84" y1="45" x2="75" y2="45" stroke="#ef4444" stroke-width="2"/>

          <circle cx="65" cy="45" r="11" fill="#000" stroke="#000" stroke-width="3"/>
          <circle cx="65" cy="45" r="11" fill="url(#bell-orb)" stroke="#ffedd5" stroke-width="1"/>
          <ellipse cx="62" cy="41" rx="3.5" ry="2" fill="#ffffff" opacity="0.9"/>
        </g>
      </svg>`;

    case 'rep':
    case 'replay':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90" width="100%" height="100%">
        <defs>
          <linearGradient id="rep-body" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="45%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </linearGradient>
          <linearGradient id="rep-hl" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#7dd3fc"/>
          </linearGradient>
          <filter id="rep-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g filter="url(#rep-shadow)">
          <ellipse cx="65" cy="45" rx="52" ry="29" fill="#000" stroke="#000" stroke-width="6"/>
          <ellipse cx="65" cy="45" rx="51" ry="28" fill="#fff"/>
          <ellipse cx="65" cy="45" rx="47" ry="25" fill="url(#rep-body)"/>

          <ellipse cx="65" cy="29" rx="36" ry="6" fill="url(#rep-hl)" opacity="0.7"/>

          <path d="M 88 28 C 76 23, 50 23, 38 29" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
          <polygon points="36,29 44,24 43,33" fill="#ffffff"/>

          <path d="M 42 61 C 54 67, 80 67, 92 61" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
          <polygon points="94,61 86,66 87,57" fill="#ffffff"/>

          <text x="65" y="52" font-family="'Impact', 'Arial Black', sans-serif" font-size="20" font-style="italic" 
                fill="#000" stroke="#000" stroke-width="4.5" text-anchor="middle" letter-spacing="1">REPEAT</text>
          <text x="65" y="52" font-family="'Impact', 'Arial Black', sans-serif" font-size="20" font-style="italic" 
                fill="#ffffff" text-anchor="middle" letter-spacing="1">REPEAT</text>
        </g>
      </svg>`;

    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#666"/></svg>`;
  }
}

/**
 * スマスロ サンダーV 忠実ベクターSVG
 */
export function getThunderVSymbolSVG(type) {
  switch (type) {
    // ----------------------------------------------------
    // V (黄THUNDER) / V (赤THUNDER)
    // ----------------------------------------------------
    case 'v':
    case 'v_red':
    case 'thunder_v': {
      const isRed = type === 'v_red';
      const textGradId = isRed ? 'tv-text-red' : 'tv-text-yellow';
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90" width="100%" height="100%">
        <defs>
          <linearGradient id="tv-v-body" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="35%" stop-color="#0284c7"/>
            <stop offset="70%" stop-color="#0369a1"/>
            <stop offset="100%" stop-color="#082f49"/>
          </linearGradient>
          <linearGradient id="tv-text-yellow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="40%" stop-color="#eab308"/>
            <stop offset="100%" stop-color="#ca8a04"/>
          </linearGradient>
          <linearGradient id="tv-text-red" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fca5a5"/>
            <stop offset="40%" stop-color="#ef4444"/>
            <stop offset="100%" stop-color="#b91c1c"/>
          </linearGradient>
          <filter id="tv-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g filter="url(#tv-shadow)">
          <!-- V本体のシルバー外枠 -->
          <path d="M 12 14 L 46 14 L 65 62 L 84 14 L 118 14 L 84 78 L 46 78 Z" 
                fill="#000" stroke="#94a3b8" stroke-width="6" stroke-linejoin="round"/>
          <!-- V本体のブルーメタリック塗り -->
          <path d="M 12 14 L 46 14 L 65 62 L 84 14 L 118 14 L 84 78 L 46 78 Z" 
                fill="url(#tv-v-body)" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>

          <!-- V上部のハイライト -->
          <polygon points="14,16 44,16 64,58 60,58 40,24 16,24" fill="#ffffff" opacity="0.6"/>
          <polygon points="116,16 86,16 70,52 74,52 90,24 114,24" fill="#ffffff" opacity="0.4"/>

          <!-- 「THUNDER」立体ロゴ -->
          <text x="66" y="66" font-family="'Impact', 'Arial Black', sans-serif" font-size="21" font-weight="900" 
                font-style="italic" fill="#000" stroke="#000" stroke-width="4.5" text-anchor="middle" letter-spacing="1">THUNDER</text>
          <text x="66" y="66" font-family="'Impact', 'Arial Black', sans-serif" font-size="21" font-weight="900" 
                font-style="italic" fill="url(#${textGradId})" stroke="#ffffff" stroke-width="1" text-anchor="middle" letter-spacing="1">THUNDER</text>
        </g>
      </svg>`;
    }

    // ----------------------------------------------------
    // 赤7 (サンダーV版: シルバー枠＋稲妻スリット)
    // ----------------------------------------------------
    case 'red7':
    case 'r7':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90" width="100%" height="100%">
        <defs>
          <linearGradient id="tv-r7-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff3b4e"/>
            <stop offset="45%" stop-color="#dc2626"/>
            <stop offset="100%" stop-color="#991b1b"/>
          </linearGradient>
          <linearGradient id="tv-bolt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="50%" stop-color="#fef08a"/>
            <stop offset="100%" stop-color="#eab308"/>
          </linearGradient>
          <filter id="tv-r7-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g filter="url(#tv-r7-shadow)">
          <!-- シルバー太枠 -->
          <path d="M 14 18 L 112 18 L 118 36 L 56 78 L 24 78 L 62 36 L 14 36 Z" 
                fill="#000" stroke="#94a3b8" stroke-width="7" stroke-linejoin="round"/>
          <!-- 赤塗り -->
          <path d="M 14 18 L 112 18 L 118 36 L 56 78 L 24 78 L 62 36 L 14 36 Z" 
                fill="url(#tv-r7-grad)" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>

          <!-- 稲妻スリット⚡ -->
          <polygon points="58,22 76,22 66,34 82,34 48,58 56,42 44,42" 
                   fill="url(#tv-bolt-grad)" stroke="#000" stroke-width="1.5"/>
        </g>
      </svg>`;

    // ----------------------------------------------------
    // BAR (サンダーV版: オーバルカプセル＋赤グロー＋白BAR)
    // ----------------------------------------------------
    case 'bar':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90" width="100%" height="100%">
        <defs>
          <filter id="tv-bar-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g filter="url(#tv-bar-shadow)">
          <!-- シルバー外枠 -->
          <rect x="8" y="18" width="114" height="54" rx="27" fill="#000" stroke="#94a3b8" stroke-width="4"/>
          <!-- 赤いインナーネオン -->
          <rect x="11" y="21" width="108" height="48" rx="24" fill="#09090b" stroke="#ef4444" stroke-width="2.5"/>
          <!-- BAR立体文字 -->
          <text x="65" y="55" font-family="'Impact', 'Arial Black', sans-serif" font-size="32" 
                fill="#000" stroke="#000" stroke-width="5" text-anchor="middle" letter-spacing="2">BAR</text>
          <text x="65" y="55" font-family="'Impact', 'Arial Black', sans-serif" font-size="32" 
                fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" text-anchor="middle" letter-spacing="2">BAR</text>
        </g>
      </svg>`;

    // ----------------------------------------------------
    // ベル (サンダーV版: 黄金の釣り鐘)
    // ----------------------------------------------------
    case 'bell':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90" width="100%" height="100%">
        <defs>
          <linearGradient id="tv-bell-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="30%" stop-color="#facc15"/>
            <stop offset="70%" stop-color="#ca8a04"/>
            <stop offset="100%" stop-color="#854d0e"/>
          </linearGradient>
          <filter id="tv-bell-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g filter="url(#tv-bell-shadow)">
          <!-- ベル上部台座 -->
          <rect x="52" y="12" width="26" height="8" rx="3" fill="#000" stroke="#000" stroke-width="4"/>
          <rect x="52" y="12" width="26" height="8" rx="3" fill="url(#tv-bell-grad)" stroke="#fff" stroke-width="1"/>

          <!-- ベル本体（釣り鐘） -->
          <path d="M 52 20 C 52 20, 40 38, 30 56 C 26 64, 20 68, 20 72 L 110 72 C 110 68, 104 64, 100 56 C 90 38, 78 20, 78 20 Z" 
                fill="#000" stroke="#000" stroke-width="6" stroke-linejoin="round"/>
          <path d="M 52 20 C 52 20, 40 38, 30 56 C 26 64, 20 68, 20 72 L 110 72 C 110 68, 104 64, 100 56 C 90 38, 78 20, 78 20 Z" 
                fill="url(#tv-bell-grad)" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>

          <!-- ハイライトライン -->
          <path d="M 50 24 C 44 38, 38 52, 32 64" fill="none" stroke="#fff" stroke-width="2.5" opacity="0.6"/>

          <!-- ベル下部リム -->
          <ellipse cx="65" cy="72" rx="46" ry="6" fill="#ca8a04" stroke="#000" stroke-width="3"/>
          <!-- 振り子（クラッパー） -->
          <circle cx="65" cy="77" r="6" fill="#000" stroke="#000" stroke-width="3"/>
          <circle cx="65" cy="77" r="6" fill="#facc15" stroke="#fff" stroke-width="1"/>
        </g>
      </svg>`;

    // ----------------------------------------------------
    // スイカ (サンダーV版: 横長スイカ＋右側円形断面)
    // ----------------------------------------------------
    case 'suika':
    case 'watermelon':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90" width="100%" height="100%">
        <defs>
          <linearGradient id="tv-suika-rind" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#15803d"/>
            <stop offset="40%" stop-color="#16a34a"/>
            <stop offset="100%" stop-color="#14532d"/>
          </linearGradient>
          <radialGradient id="tv-suika-flesh" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stop-color="#f87171"/>
            <stop offset="60%" stop-color="#ef4444"/>
            <stop offset="100%" stop-color="#b91c1c"/>
          </radialGradient>
          <filter id="tv-suika-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g filter="url(#tv-suika-shadow)">
          <!-- 左側：スイカボディ（緑楕円） -->
          <ellipse cx="58" cy="45" rx="46" ry="26" fill="#000" stroke="#000" stroke-width="6"/>
          <ellipse cx="58" cy="45" rx="46" ry="26" fill="url(#tv-suika-rind)"/>

          <!-- 黒縞模様 -->
          <path d="M 18 45 Q 58 28 94 40" fill="none" stroke="#0a0a0a" stroke-width="4.5" stroke-linecap="round"/>
          <path d="M 22 52 Q 58 42 92 48" fill="none" stroke="#0a0a0a" stroke-width="4" stroke-linecap="round"/>
          <path d="M 26 38 Q 58 20 88 32" fill="none" stroke="#0a0a0a" stroke-width="4" stroke-linecap="round"/>
          <path d="M 32 60 Q 58 56 86 58" fill="none" stroke="#0a0a0a" stroke-width="3.5" stroke-linecap="round"/>

          <!-- 右側：円形断面（果肉） -->
          <ellipse cx="94" cy="45" rx="20" ry="24" fill="#000" stroke="#000" stroke-width="4"/>
          <ellipse cx="94" cy="45" rx="19" ry="23" fill="#f0fdf4" stroke="#86efac" stroke-width="1.5"/>
          <ellipse cx="94" cy="45" rx="16" ry="20" fill="url(#tv-suika-flesh)"/>

          <!-- 種 -->
          <circle cx="90" cy="38" r="1.5" fill="#000"/>
          <circle cx="98" cy="38" r="1.5" fill="#000"/>
          <circle cx="88" cy="45" r="1.5" fill="#000"/>
          <circle cx="94" cy="45" r="1.5" fill="#000"/>
          <circle cx="100" cy="45" r="1.5" fill="#000"/>
          <circle cx="90" cy="52" r="1.5" fill="#000"/>
          <circle cx="98" cy="52" r="1.5" fill="#000"/>
        </g>
      </svg>`;

    // ----------------------------------------------------
    // チェリー (サンダーV版: 3粒チェリー＋緑の葉)
    // ----------------------------------------------------
    case 'cherry':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90" width="100%" height="100%">
        <defs>
          <radialGradient id="tv-ch-red" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stop-color="#f87171"/>
            <stop offset="40%" stop-color="#ef4444"/>
            <stop offset="85%" stop-color="#b91c1c"/>
            <stop offset="100%" stop-color="#450a0a"/>
          </radialGradient>
          <filter id="tv-ch-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g filter="url(#tv-ch-shadow)">
          <!-- 葉っぱ（右上） -->
          <path d="M 68 24 C 82 14, 102 20, 108 36 C 98 44, 82 40, 72 32 Z" 
                fill="#000" stroke="#000" stroke-width="4" stroke-linejoin="round"/>
          <path d="M 68 24 C 82 14, 102 20, 108 36 C 98 44, 82 40, 72 32 Z" 
                fill="#16a34a" stroke="#86efac" stroke-width="1.2"/>

          <!-- 茎 -->
          <path d="M 44 48 C 50 34, 62 26, 70 22" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"/>
          <path d="M 44 48 C 50 34, 62 26, 70 22" fill="none" stroke="#15803d" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M 72 54 C 68 38, 66 28, 70 22" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"/>
          <path d="M 72 54 C 68 38, 66 28, 70 22" fill="none" stroke="#15803d" stroke-width="2.5" stroke-linecap="round"/>

          <!-- 実3（右奥） -->
          <circle cx="80" cy="56" r="16" fill="#000" stroke="#000" stroke-width="4"/>
          <circle cx="80" cy="56" r="16" fill="url(#tv-ch-red)"/>

          <!-- 実2（中央下） -->
          <circle cx="62" cy="62" r="17" fill="#000" stroke="#000" stroke-width="4"/>
          <circle cx="62" cy="62" r="17" fill="url(#tv-ch-red)"/>
          <ellipse cx="58" cy="54" rx="4.5" ry="3" fill="#ffffff" opacity="0.8"/>

          <!-- 実1（左手前） -->
          <circle cx="42" cy="52" r="18" fill="#000" stroke="#000" stroke-width="4"/>
          <circle cx="42" cy="52" r="18" fill="url(#tv-ch-red)"/>
          <ellipse cx="37" cy="44" rx="5" ry="3.5" fill="#ffffff" opacity="0.9"/>
        </g>
      </svg>`;

    // ----------------------------------------------------
    // リプレイ (サンダーV版: イナズマアイマーク⚡)
    // ----------------------------------------------------
    case 'replay':
    case 'rep':
      return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90" width="100%" height="100%">
        <defs>
          <linearGradient id="tv-rep-body" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="50%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </linearGradient>
          <filter id="tv-rep-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.9"/>
          </filter>
        </defs>

        <g filter="url(#tv-rep-shadow)">
          <ellipse cx="65" cy="45" rx="52" ry="28" fill="#000" stroke="#000" stroke-width="6"/>
          <ellipse cx="65" cy="45" rx="51" ry="27" fill="#fff"/>
          <ellipse cx="65" cy="45" rx="47" ry="24" fill="url(#tv-rep-body)"/>

          <!-- 光沢 -->
          <ellipse cx="65" cy="30" rx="36" ry="6" fill="#fff" opacity="0.5"/>

          <!-- イナズマアイ（サンダーリプレイ⚡） -->
          <!-- 二股イナズマ足 -->
          <path d="M 65 22 L 56 42 L 62 42 L 46 64 L 62 50 L 58 50 L 65 22 Z" 
                fill="#ffffff" stroke="#000" stroke-width="1.5"/>
          <path d="M 65 22 L 74 42 L 68 42 L 84 64 L 68 50 L 72 50 L 65 22 Z" 
                fill="#ffffff" stroke="#000" stroke-width="1.5"/>

          <!-- アイ（目玉リング） -->
          <ellipse cx="65" cy="34" rx="8" ry="6" fill="#ffffff" stroke="#000" stroke-width="1.5"/>
          <circle cx="65" cy="34" r="3.5" fill="#0284c7" stroke="#000" stroke-width="1"/>
          <circle cx="66" cy="33" r="1.2" fill="#ffffff"/>

          <!-- 小さなREPLAY文字 -->
          <text x="65" y="74" font-family="'Orbitron', sans-serif" font-size="8" font-weight="900" 
                fill="#ffffff" text-anchor="middle" letter-spacing="1">REPLAY</text>
        </g>
      </svg>`;

    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#666"/></svg>`;
  }
}

/**
 * SVGからImageオブジェクトを生成（非同期プリロード）
 */
export function preloadSymbolImages() {
  const machines = [
    { id: 'discup_ultraremix', types: ['r7', 'b7', 'bar', 'remix', 'suika', 'cherry', 'bell', 'rep'] },
    { id: 'thunderv', types: ['v', 'v_red', 'red7', 'bar', 'bell', 'suika', 'cherry', 'replay'] }
  ];

  const promises = [];
  machines.forEach(m => {
    m.types.forEach(type => {
      const key = `${m.id}:${type}`;
      promises.push(new Promise((resolve) => {
        const svg = getSymbolSVG(type, m.id);
        const img = new Image();
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        img.onload = () => {
          SYMBOL_CACHE.set(key, img);
          // デフォルト参照用
          if (m.id === 'discup_ultraremix') {
            SYMBOL_CACHE.set(type, img);
            if (type === 'r7') SYMBOL_CACHE.set('red7', img);
            if (type === 'b7') SYMBOL_CACHE.set('white7', img);
            if (type === 'suika') SYMBOL_CACHE.set('watermelon', img);
            if (type === 'rep') SYMBOL_CACHE.set('replay', img);
          }
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = () => {
          resolve(null);
        };
        img.src = url;
      }));
    });
  });

  return Promise.all(promises);
}

/**
 * キャッシュされた図柄Imageを取得、なければ即座にImageを生成してキャッシュ
 */
export function getSymbolImage(type, machineId = 'discup_ultraremix') {
  const key = `${machineId}:${type}`;
  if (SYMBOL_CACHE.has(key)) {
    return SYMBOL_CACHE.get(key);
  }
  if (SYMBOL_CACHE.has(type)) {
    return SYMBOL_CACHE.get(type);
  }

  const svg = getSymbolSVG(type, machineId);
  const img = new Image();
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  img.src = url;
  SYMBOL_CACHE.set(key, img);
  return img;
}

export function getCachedSymbolImage(type, machineId = 'discup_ultraremix') {
  return getSymbolImage(type, machineId);
}
