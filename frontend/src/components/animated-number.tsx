'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}

/**
 * Count-up from previous value to `value` over `duration` ms via
 * requestAnimationFrame (JS thread). Cheap enough for a handful of dashboard
 * KPIs. Falls back to displaying `value` immediately if `prefers-reduced-motion`.
 */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  duration = 900,
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }

    fromRef.current = display;
    startRef.current = null;
    const tick = (ts: number) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(fromRef.current + (value - fromRef.current) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // intentionally omit `display` — we read it via ref to avoid re-trigger loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
