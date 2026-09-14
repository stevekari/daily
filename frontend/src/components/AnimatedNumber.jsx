import { useEffect, useRef, useState } from "react";

export default function AnimatedNumber({
  value = 0,
  prefix = "€",
  suffix = "",
  decimals = 2,
  className = "",
  style = {},
}) {
  const numericValue = typeof value === "number" && !isNaN(value) ? value : parseFloat(value) || 0;
  const [display, setDisplay] = useState(numericValue);
  const raf = useRef(null);
  const prev = useRef(numericValue);

  useEffect(() => {
    const from = typeof prev.current === "number" && !isNaN(prev.current) ? prev.current : 0;
    const to = numericValue;
    prev.current = to;
    const start = performance.now();
    const duration = 750; // ms

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // Smooth cubic ease out
      const e = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * e);
      if (t < 1) {
        raf.current = requestAnimationFrame(tick);
      }
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [numericValue]);

  const safeNum = typeof display === "number" && !isNaN(display) ? display : 0;
  const formatted = safeNum
    .toFixed(decimals)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return (
    <span className={`animated-num ${className}`} style={style}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
