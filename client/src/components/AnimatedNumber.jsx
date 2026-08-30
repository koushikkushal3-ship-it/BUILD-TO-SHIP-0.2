import { useEffect, useRef, useState } from 'react';

// Counts up from 0 to `value` — used for score reveals, which are the
// emotional payoff moment of the product and deserve to feel earned rather
// than just appearing as static text.
export default function AnimatedNumber({ value, duration = 900, className }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = Number(value) || 0;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3; // ease-out cubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}
