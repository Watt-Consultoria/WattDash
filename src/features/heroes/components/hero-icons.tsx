interface BoltIconProps {
  className?: string;
  fill?: string;
}

export function BoltIcon({ className, fill = '#d9b45b' }: BoltIconProps) {
  return (
    <svg className={className} viewBox='0 0 24 24' fill={fill} stroke='none' aria-hidden='true'>
      <path d='M13 2 L4 14 H10 L9 22 L18 10 H12 Z' />
    </svg>
  );
}

function laurelLeaves(mirror: boolean) {
  const leaves = [];
  const dir = mirror ? -1 : 1;
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const x = 40 + dir * (6 + t * 26);
    const y = 64 - t * 54;
    const rot = (mirror ? 200 : -20) + (mirror ? -1 : 1) * t * 40;
    const scale = 1.1 - t * 0.45;
    leaves.push(
      <path
        key={`${mirror ? 'l' : 'r'}-${i}`}
        d='M0 0 C 5 -3 9 -3 12 0 C 9 3 5 3 0 0 Z'
        transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}
        fill='rgba(217,180,91,.85)'
      />
    );
  }
  return leaves;
}

export function LaurelIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox='0 0 80 70'
      fill='none'
      preserveAspectRatio='xMidYMid meet'
      aria-hidden='true'
    >
      {laurelLeaves(false)}
      {laurelLeaves(true)}
      <path d='M42 1 L32 13 L39 13 L37 21 L47 8 L40 8 Z' fill='#eccb7e' />
    </svg>
  );
}
