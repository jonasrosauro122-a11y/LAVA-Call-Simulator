interface AvatarProps {
  name: string;
  size?: number;
  highlight?: boolean;
}

const PALETTE = ['#8B0000', '#b71c1c', '#2563eb', '#7c3aed', '#0ea5e9', '#db2777', '#c026d3', '#f59e0b', '#16a34a'];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0x7fffffff;
  return PALETTE[h % PALETTE.length];
}

// Deterministic initials avatar (no image uploads needed).
export function Avatar({ name, size = 40, highlight }: AvatarProps) {
  return (
    <div
      className={`rounded-full flex items-center justify-center font-display font-bold text-white shrink-0 ${highlight ? 'ring-2 ring-lava-500 ring-offset-2 ring-offset-white dark:ring-offset-ink-900' : ''}`}
      style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {initials(name || '?')}
    </div>
  );
}
