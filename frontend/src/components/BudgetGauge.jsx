import React, { useEffect, useRef } from "react";

const CX = 110,
  CY = 110,
  R = 80;
const toRad = (d) => (d * Math.PI) / 180;

function arcPath() {
  const x1 = CX + R * Math.cos(toRad(-180));
  const y1 = CY + R * Math.sin(toRad(-180));
  const x2 = CX + R * Math.cos(toRad(0));
  const y2 = CY + R * Math.sin(toRad(0));
  return `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`;
}

export default function BudgetGauge({ percentage }) {
  const pct = Math.min(100, Math.max(0, percentage));
  const fillRef = useRef(null);
  const d = arcPath();

  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len * (1 - pct / 100);
  }, [pct]);

  const needleAngle = -180 + (pct / 100) * 180;

  return (
    <svg viewBox="0 0 220 130" className="gauge-svg">
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>

      <path d={d} className="gauge-track" />
      <path
        d={d}
        className="gauge-fill"
        ref={fillRef}
        stroke="url(#gaugeGrad)"
      />

      <line
        className="gauge-needle"
        x1={CX}
        y1={CY}
        x2={CX}
        y2={CY - 70}
        style={{ "--needle-angle": `${needleAngle + 90}deg` }}
      />
      <circle className="gauge-hub" cx={CX} cy={CY} r="7" />

      <text className="gauge-label gauge-label--safe" x="20" y="120">
        SAFE
      </text>
      <text className="gauge-label gauge-label--spent" x="170" y="120">
        SPENT
      </text>
    </svg>
  );
}
