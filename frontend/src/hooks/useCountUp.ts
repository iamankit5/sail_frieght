// frontend/src/hooks/useCountUp.ts
import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Animates a number from its previous value to the new value with an
 * ease-out curve. Used for hero metrics so the terminal "feels" alive
 * when parameters change. Respects prefers-reduced-motion.
 */
export function useCountUp(target: number, durationMs = 700, decimals = 0): string {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!Number.isFinite(target)) {
      setDisplay(0);
      return;
    }
    if (prefersReducedMotion()) {
      setDisplay(target);
      fromRef.current = target;
      return;
    }

    const from = fromRef.current;
    const delta = target - from;
    // Tiny deltas (or first render) don't need animation.
    if (Math.abs(delta) < Math.pow(10, -decimals) / 2) {
      setDisplay(target);
      fromRef.current = target;
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const value = from + delta * eased;
      setDisplay(value);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      fromRef.current = target;
    };
  }, [target, durationMs, decimals]);

  return display.toFixed(decimals);
}
