import React from "react";

export default function Bar({ val, max, limit, isDaily }) {
  // Calculate height percentage (minimum 5% if there's any value)
  const h = max > 0 ? Math.max((val / max) * 100, val > 0 ? 5 : 0) : 0;
  const isOverLimit = val > limit;

  // Format the display value (e.g., 1200 -> 1.2k)
  const displayVal =
    val >= 1000 ? (val / 1000).toFixed(1) + "k" : Math.round(val);

  return (
    <div className="bar-wrapper">
      {/* Amount label above bar */}
      {val > 0 && (
        <div
          className={`bar-label ${isOverLimit ? "over" : "under"} ${isDaily ? "bar-label--daily" : "bar-label--monthly"}`}
        >
          €{displayVal}
        </div>
      )}

      {/* Bar Fill */}
      <div
        className={`bar-fill ${isOverLimit ? "over" : "under"}`}
        style={{ "--bar-height": `${h}%` }}
      />
    </div>
  );
}
