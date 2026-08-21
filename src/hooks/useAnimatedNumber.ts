import { useState, useEffect, useRef } from 'react';

/**
 * Animates a number from its previous value to the current value
 * using requestAnimationFrame for smooth count-up/count-down.
 */
export function useAnimatedNumber(
  target: number,
  duration = 400,
  decimals = 2
): string {
  const [display, setDisplay] = useState(target.toFixed(decimals));
  const prevRef = useRef(target);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = to;

    if (from === to) {
      setDisplay(to.toFixed(decimals));
      return;
    }

    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setDisplay(current.toFixed(decimals));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, decimals]);

  return display;
}
