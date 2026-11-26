import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Animates a number from its previous value to `target` (ease-out). Respects reduce-motion. */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(target);
  const from = useRef(0);
  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    const start = from.current;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce || start === target || duration <= 0) {
          setValue(target);
          from.current = target;
          return;
        }
        const t0 = Date.now();
        const tick = () => {
          const p = Math.min(1, (Date.now() - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setValue(start + (target - start) * eased);
          if (p < 1) raf = requestAnimationFrame(tick);
          else from.current = target;
        };
        raf = requestAnimationFrame(tick);
      });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      from.current = target;
    };
  }, [target, duration]);
  return value;
}
