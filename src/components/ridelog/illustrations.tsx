/**
 * Inline SVG illustrations for empty states.
 * Styled to match the AMOLED dark palette — primary soft blue (#A9C9FF family),
 * surface strokes, and subtle glows.
 */

/** Scooter illustration for the Trips empty state */
export function IllustrationTrips() {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto w-28 h-auto"
      aria-hidden="true"
    >
      {/* Glow underneath */}
      <ellipse cx="60" cy="72" rx="36" ry="5" fill="oklch(0.85 0.07 250 / 0.12)" />

      {/* Rear wheel */}
      <circle cx="30" cy="62" r="12" stroke="oklch(0.85 0.07 250 / 0.35)" strokeWidth="2.5" />
      <circle cx="30" cy="62" r="6" stroke="oklch(0.85 0.07 250 / 0.2)" strokeWidth="1.5" />
      <circle cx="30" cy="62" r="2" fill="oklch(0.85 0.07 250 / 0.5)" />

      {/* Front wheel */}
      <circle cx="90" cy="62" r="12" stroke="oklch(0.85 0.07 250 / 0.35)" strokeWidth="2.5" />
      <circle cx="90" cy="62" r="6" stroke="oklch(0.85 0.07 250 / 0.2)" strokeWidth="1.5" />
      <circle cx="90" cy="62" r="2" fill="oklch(0.85 0.07 250 / 0.5)" />

      {/* Frame / body */}
      <path
        d="M30 62 L40 40 L60 38 L75 40 L90 62"
        stroke="oklch(0.85 0.07 250 / 0.5)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Seat */}
      <rect x="42" y="33" width="26" height="7" rx="3.5"
        fill="oklch(0.85 0.07 250 / 0.18)" stroke="oklch(0.85 0.07 250 / 0.4)" strokeWidth="1.5" />

      {/* Handlebar */}
      <path d="M78 40 L82 32 L88 32" stroke="oklch(0.85 0.07 250 / 0.55)" strokeWidth="2" strokeLinecap="round" />

      {/* Headlight */}
      <circle cx="91" cy="46" r="3.5" fill="oklch(0.85 0.07 250 / 0.25)" stroke="oklch(0.85 0.07 250 / 0.5)" strokeWidth="1.2" />
      <path d="M95 44 L101 40" stroke="oklch(0.85 0.07 250 / 0.4)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M95 46 L102 46" stroke="oklch(0.85 0.07 250 / 0.3)" strokeWidth="1.2" strokeLinecap="round" />

      {/* Motion lines */}
      <path d="M8 52 L22 52" stroke="oklch(0.85 0.07 250 / 0.22)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 58 L18 58" stroke="oklch(0.85 0.07 250 / 0.15)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 45 L20 45" stroke="oklch(0.85 0.07 250 / 0.12)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** Fuel pump illustration for the Fuel empty state */
export function IllustrationFuel() {
  return (
    <svg
      viewBox="0 0 120 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto w-24 h-auto"
      aria-hidden="true"
    >
      {/* Glow */}
      <ellipse cx="52" cy="84" rx="28" ry="4" fill="oklch(0.85 0.07 250 / 0.1)" />

      {/* Pump body */}
      <rect x="24" y="28" width="36" height="52" rx="6"
        fill="oklch(0.85 0.07 250 / 0.08)" stroke="oklch(0.85 0.07 250 / 0.35)" strokeWidth="2" />

      {/* Screen on pump */}
      <rect x="30" y="36" width="24" height="16" rx="3"
        fill="oklch(0.85 0.07 250 / 0.15)" stroke="oklch(0.85 0.07 250 / 0.25)" strokeWidth="1" />
      <text x="42" y="47" textAnchor="middle" fontSize="7" fill="oklch(0.85 0.07 250 / 0.7)" fontFamily="monospace">0.00L</text>

      {/* Pump base */}
      <rect x="20" y="76" width="44" height="6" rx="3"
        fill="oklch(0.85 0.07 250 / 0.2)" stroke="oklch(0.85 0.07 250 / 0.3)" strokeWidth="1.5" />

      {/* Hose */}
      <path d="M60 44 Q80 44 80 56 Q80 68 72 68 L68 68"
        stroke="oklch(0.85 0.07 250 / 0.45)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Nozzle */}
      <rect x="60" y="65" width="10" height="5" rx="2"
        fill="oklch(0.85 0.07 250 / 0.3)" stroke="oklch(0.85 0.07 250 / 0.5)" strokeWidth="1.2" />

      {/* Droplet */}
      <path d="M66 74 Q66 80 70 80 Q74 80 74 74 Q74 70 70 68 Q66 70 66 74Z"
        fill="oklch(0.85 0.07 250 / 0.25)" stroke="oklch(0.85 0.07 250 / 0.4)" strokeWidth="1" />

      {/* Fuel level indicator lines */}
      <line x1="31" y1="60" x2="53" y2="60" stroke="oklch(0.85 0.07 250 / 0.18)" strokeWidth="1" />
      <line x1="31" y1="64" x2="53" y2="64" stroke="oklch(0.85 0.07 250 / 0.12)" strokeWidth="1" />
      <line x1="31" y1="68" x2="53" y2="68" stroke="oklch(0.85 0.07 250 / 0.08)" strokeWidth="1" />
    </svg>
  );
}

/** Wrench + calendar illustration for the Maintenance empty state */
export function IllustrationMaintenance() {
  return (
    <svg
      viewBox="0 0 120 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto w-24 h-auto"
      aria-hidden="true"
    >
      {/* Glow */}
      <ellipse cx="60" cy="84" rx="30" ry="4" fill="oklch(0.82 0.16 80 / 0.1)" />

      {/* Clipboard / card */}
      <rect x="26" y="20" width="52" height="58" rx="7"
        fill="oklch(0.82 0.16 80 / 0.07)" stroke="oklch(0.82 0.16 80 / 0.3)" strokeWidth="2" />

      {/* Clipboard header */}
      <rect x="26" y="20" width="52" height="16" rx="7"
        fill="oklch(0.82 0.16 80 / 0.15)" stroke="none" />
      <rect x="26" y="28" width="52" height="8" rx="0"
        fill="oklch(0.82 0.16 80 / 0.15)" stroke="none" />

      {/* Clip */}
      <rect x="46" y="14" width="28" height="10" rx="4"
        fill="oklch(0.13 0 0)" stroke="oklch(0.82 0.16 80 / 0.4)" strokeWidth="1.5" />
      <rect x="52" y="17" width="16" height="4" rx="2"
        fill="oklch(0.82 0.16 80 / 0.2)" />

      {/* Checklist lines */}
      <line x1="44" y1="48" x2="68" y2="48" stroke="oklch(0.82 0.16 80 / 0.25)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="44" y1="55" x2="68" y2="55" stroke="oklch(0.82 0.16 80 / 0.18)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="44" y1="62" x2="60" y2="62" stroke="oklch(0.82 0.16 80 / 0.12)" strokeWidth="1.5" strokeLinecap="round" />

      {/* Checkbox dots */}
      <circle cx="38" cy="48" r="3" stroke="oklch(0.82 0.16 80 / 0.35)" strokeWidth="1.5" />
      <circle cx="38" cy="55" r="3" stroke="oklch(0.82 0.16 80 / 0.25)" strokeWidth="1.5" />
      <circle cx="38" cy="62" r="3" stroke="oklch(0.82 0.16 80 / 0.18)" strokeWidth="1.5" />

      {/* Wrench (overlapping corner) */}
      <g transform="translate(64, 52) rotate(-35)">
        <path
          d="M0 -14 C4 -14 7 -11 7 -7 C7 -4 5.5 -1.5 3 0 L3 14 C3 15.1 2.1 16 1 16 L-1 16 C-2.1 16 -3 15.1 -3 14 L-3 0 C-5.5 -1.5 -7 -4 -7 -7 C-7 -11 -4 -14 0 -14Z"
          fill="oklch(0.82 0.16 80 / 0.2)"
          stroke="oklch(0.82 0.16 80 / 0.55)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="0" cy="-7" r="3" fill="oklch(0.82 0.16 80 / 0.3)" />
      </g>
    </svg>
  );
}
