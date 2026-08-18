import type { BodyRegion } from "@/lib/body-map";

type Tone = "primary" | "warm" | "mint" | "lilac" | "amber" | "rose";

const TONE_COLOR: Record<Tone, string> = {
  primary: "oklch(0.78 0.17 170)",
  warm:    "#FFB199",
  mint:    "#7DE3B0",
  lilac:   "#C9B6FF",
  amber:   "oklch(0.8 0.17 90)",
  rose:    "oklch(0.7 0.2 25)",
};

type Props = {
  active?: BodyRegion[];
  tone?: Tone;
  onRegionClick?: (r: BodyRegion) => void;
  overlay?: Partial<Record<BodyRegion, Tone>>; // deficiency status per region
  className?: string;
  compact?: boolean;
};

/**
 * Front-view anatomical silhouette with named region groups.
 * Each region is a soft filled shape layered on the body outline.
 */
export function BodySilhouette({ active = [], tone = "primary", onRegionClick, overlay, className, compact }: Props) {
  const isActive = (r: BodyRegion) => active.includes(r);
  const fillFor = (r: BodyRegion) => {
    const ov = overlay?.[r];
    if (ov) return TONE_COLOR[ov];
    if (isActive(r)) return TONE_COLOR[tone];
    return "transparent";
  };
  const opacityFor = (r: BodyRegion) => (isActive(r) || overlay?.[r] ? 0.85 : 0);

  const region = (r: BodyRegion, path: React.ReactNode) => (
    <g
      key={r}
      onClick={onRegionClick ? () => onRegionClick(r) : undefined}
      style={{
        cursor: onRegionClick ? "pointer" : "default",
        filter: (isActive(r) || overlay?.[r]) ? `drop-shadow(0 0 14px ${fillFor(r)})` : "none",
        transition: "filter 500ms ease, opacity 500ms ease",
      }}
      className={isActive(r) ? "body-region-pulse" : undefined}
      aria-label={r}
    >
      <g fill={fillFor(r)} opacity={opacityFor(r)}>
        {path}
      </g>
      {/* invisible hit target so region is always tappable */}
      {onRegionClick && (
        <g fill="transparent" pointerEvents="all">{path}</g>
      )}
    </g>
  );

  return (
    <svg
      viewBox="0 0 200 440"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Human body map"
    >
      {/* Silhouette outline (front view) */}
      <g fill="oklch(0.28 0.03 250 / 0.55)" stroke="oklch(0.55 0.03 240 / 0.9)" strokeWidth="1.2">
        {/* Head */}
        <ellipse cx="100" cy="42" rx="26" ry="30" />
        {/* Neck */}
        <rect x="90" y="68" width="20" height="16" rx="6" />
        {/* Torso */}
        <path d="M60 90 Q100 78 140 90 L152 200 Q100 220 48 200 Z" />
        {/* Hips */}
        <path d="M52 198 Q100 218 148 198 L146 246 Q100 254 54 246 Z" />
        {/* Arms */}
        <path d="M60 92 Q40 100 34 160 Q30 220 40 260 L54 260 Q52 220 54 170 Q58 130 66 108 Z" />
        <path d="M140 92 Q160 100 166 160 Q170 220 160 260 L146 260 Q148 220 146 170 Q142 130 134 108 Z" />
        {/* Legs */}
        <path d="M60 246 Q66 320 68 400 L88 400 Q92 320 94 250 Z" />
        <path d="M140 246 Q134 320 132 400 L112 400 Q108 320 106 250 Z" />
      </g>

      {/* Region overlays */}
      {region("brain", <ellipse cx="100" cy="34" rx="18" ry="16" />)}
      {region("eyes", (
        <>
          <circle cx="91" cy="42" r="3.5" />
          <circle cx="109" cy="42" r="3.5" />
        </>
      ))}
      {region("teeth", <rect x="92" y="56" width="16" height="4" rx="1.5" />)}
      {region("thyroid", <ellipse cx="100" cy="78" rx="9" ry="4" />)}
      {region("heart", <path d="M92 108 c-6 -8 -18 -2 -14 8 c2 8 14 14 18 18 c4 -4 16 -10 18 -18 c4 -10 -8 -16 -14 -8 c-2 2 -4 4 -4 4 c0 0 -2 -2 -4 -4 z" />)}
      {region("blood", <path d="M78 118 Q100 128 122 118 L120 178 Q100 188 80 178 Z" />)}
      {region("bones", (
        <>
          <rect x="97" y="80" width="6" height="130" rx="2" />
          <rect x="72" y="108" width="56" height="5" rx="2" />
        </>
      ))}
      {region("gut", <path d="M74 172 Q100 158 126 172 Q132 208 100 214 Q68 208 74 172 Z" />)}
      {region("immune", (
        <>
          <circle cx="78" cy="148" r="5" />
          <circle cx="122" cy="148" r="5" />
          <circle cx="100" cy="170" r="5" />
        </>
      ))}
      {region("nerves", (
        <>
          <rect x="98" y="86" width="4" height="150" rx="2" />
          <path d="M100 240 L60 340 M100 240 L140 340" stroke={TONE_COLOR.lilac} strokeWidth="1.2" fill="none" opacity="0.55" />
        </>
      ))}
      {region("muscles", (
        <>
          {/* biceps */}
          <ellipse cx="46" cy="140" rx="10" ry="22" />
          <ellipse cx="154" cy="140" rx="10" ry="22" />
          {/* quads */}
          <ellipse cx="78" cy="300" rx="12" ry="34" />
          <ellipse cx="122" cy="300" rx="12" ry="34" />
        </>
      ))}
      {region("skin", (
        // subtle glow across the outline
        <path d="M60 90 Q100 78 140 90 L152 200 Q148 245 146 260 L132 400 L112 400 L106 260 L94 260 L88 400 L68 400 L54 260 Q52 245 48 200 Z" />
      ))}

      {/* Optional small label chips could go here in future */}
      {!compact && null}
    </svg>
  );
}