import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLanguage } from "../LanguageContext";

const MONTH_NAMES = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  es: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
  fr: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
  pt: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
};

const ITEM_HEIGHT = 44; // height of each wheel item in px

/**
 * WheelColumn Component
 * Single scrollable vertical wheel cylinder for Day, Month, or Year.
 */
function WheelColumn({ items, selectedIndex, onSelect, itemWidth, formatItem }) {
  const scrollRef = useRef(null);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef(null);

  // Scroll to selectedIndex on mount or when selectedIndex changes externally
  useEffect(() => {
    if (scrollRef.current && !isUserScrolling.current) {
      scrollRef.current.scrollTop = selectedIndex * ITEM_HEIGHT;
    }
  }, [selectedIndex]);

  const handleScroll = () => {
    isUserScrolling.current = true;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

    scrollTimeout.current = setTimeout(() => {
      if (scrollRef.current) {
        const top = scrollRef.current.scrollTop;
        const index = Math.round(top / ITEM_HEIGHT);
        const clamped = Math.max(0, Math.min(items.length - 1, index));
        if (clamped !== selectedIndex) {
          onSelect(clamped);
        }
        // Snap precisely
        scrollRef.current.scrollTo({
          top: clamped * ITEM_HEIGHT,
          behavior: "smooth",
        });
      }
      isUserScrolling.current = false;
    }, 80);
  };

  const handleItemClick = (index) => {
    onSelect(index);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="wheel-column" style={{ width: itemWidth || "100%" }}>
      <div
        ref={scrollRef}
        className="wheel-column-scroll"
        onScroll={handleScroll}
      >
        {/* Top Spacer to align 1st item with center lens */}
        <div className="wheel-spacer" style={{ height: ITEM_HEIGHT * 2 }} />

        {items.map((item, idx) => {
          const distance = Math.abs(idx - selectedIndex);
          const isSelected = idx === selectedIndex;
          let opacity = 1;
          let scale = 1;

          if (distance === 1) {
            opacity = 0.55;
            scale = 0.94;
          } else if (distance === 2) {
            opacity = 0.28;
            scale = 0.88;
          } else if (distance > 2) {
            opacity = 0.15;
            scale = 0.82;
          }

          return (
            <div
              key={idx}
              className={`wheel-item ${isSelected ? "wheel-item--selected" : ""}`}
              style={{
                height: `${ITEM_HEIGHT}px`,
                opacity,
                transform: `scale(${scale})`,
              }}
              onClick={() => handleItemClick(idx)}
            >
              {formatItem ? formatItem(item, isSelected) : item}
            </div>
          );
        })}

        {/* Bottom Spacer */}
        <div className="wheel-spacer" style={{ height: ITEM_HEIGHT * 2 }} />
      </div>
    </div>
  );
}

/**
 * WheelDatePicker Component
 * iOS / Wheel-picker styled 3-column Date Picker (Day, Month, Year).
 */
export default function WheelDatePicker({
  value,
  onChange,
  label,
  minYear = 1990,
  maxYear = 2035,
}) {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Derived current date from value prop
  const { year, month, day } = useMemo(() => {
    if (!value) {
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate(),
      };
    }
    const [y, m, d] = value.split("-").map((v) => parseInt(v, 10));
    const validYear = isNaN(y) ? 2026 : y;
    const validMonth = isNaN(m) ? 0 : Math.max(0, Math.min(11, m - 1));
    const maxDays = new Date(validYear, validMonth + 1, 0).getDate();
    const validDay = isNaN(d) ? 1 : Math.max(1, Math.min(maxDays, d));

    return {
      year: validYear,
      month: validMonth,
      day: validDay,
    };
  }, [value]);

  // Generate Year list
  const years = useMemo(() => {
    const list = [];
    for (let y = minYear; y <= maxYear; y++) {
      list.push(y);
    }
    return list;
  }, [minYear, maxYear]);

  // Localized months list
  const months = useMemo(() => {
    return MONTH_NAMES[language] || MONTH_NAMES.en;
  }, [language]);

  // Days in current selected month & year
  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  // Generate Day list
  const days = useMemo(() => {
    const list = [];
    for (let d = 1; d <= daysInMonth; d++) {
      list.push(d);
    }
    return list;
  }, [daysInMonth]);

  // Emit formatted YYYY-MM-DD
  const emitDate = useCallback((newYear, newMonth, newDay) => {
    const maxDays = new Date(newYear, newMonth + 1, 0).getDate();
    const safeDay = Math.max(1, Math.min(maxDays, newDay));
    const mStr = String(newMonth + 1).padStart(2, "0");
    const dStr = String(safeDay).padStart(2, "0");
    const dateStr = `${newYear}-${mStr}-${dStr}`;
    onChange(dateStr);
  }, [onChange]);

  const handleSelectDay = (index) => {
    const newDay = days[index] || 1;
    emitDate(year, month, newDay);
  };

  const handleSelectMonth = (index) => {
    emitDate(year, index, day);
  };

  const handleSelectYear = (index) => {
    const newYear = years[index] || 2026;
    emitDate(newYear, month, day);
  };

  const handleSetToday = () => {
    const now = new Date();
    emitDate(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const handleSetYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    emitDate(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  };

  const dayIndex = Math.max(0, days.indexOf(day));
  const monthIndex = Math.max(0, month);
  const yearIndex = Math.max(0, years.indexOf(year));

  const monthLabel = months[month] || "January";

  return (
    <div className="wheel-date-picker-container">
      {label && <label className="wheel-date-picker-label">{label}</label>}

      {/* Interactive Display Trigger Badge */}
      <div
        className={`wheel-date-trigger ${isOpen ? "wheel-date-trigger--open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Click to choose date"
      >
        <div className="wheel-date-trigger-content">
          <span className="wheel-date-trigger-icon">📅</span>
          <span className="wheel-date-trigger-text">
            <strong>{day}</strong> {monthLabel} <strong>{year}</strong>
          </span>
        </div>
        <span className="wheel-date-trigger-arrow">{isOpen ? "▲" : "▼"}</span>
      </div>

      {/* Expanded Wheel Date Picker Modal/Drawer */}
      {isOpen && (
        <div className="wheel-picker-popup">
          {/* Header Quick Options */}
          <div className="wheel-picker-header">
            <div className="wheel-picker-quick-btns">
              <button
                type="button"
                className="wheel-quick-btn"
                onClick={handleSetToday}
              >
                ⚡ {t("today") || "Today"}
              </button>
              <button
                type="button"
                className="wheel-quick-btn"
                onClick={handleSetYesterday}
              >
                ◀ {t("yesterday") || "Yesterday"}
              </button>
            </div>

            <button
              type="button"
              className="wheel-done-btn"
              onClick={() => setIsOpen(false)}
            >
              ✓ {t("save") || "Done"}
            </button>
          </div>

          {/* 3-Column Wheel Container */}
          <div className="wheel-picker-body">
            {/* Center Selection Pill Highlight Lens */}
            <div className="wheel-selection-lens" />

            {/* Top Fade Gradient Mask */}
            <div className="wheel-fade-top" />

            {/* 3 Columns: Day, Month, Year */}
            <div className="wheel-columns-grid">
              {/* Day Column */}
              <WheelColumn
                items={days}
                selectedIndex={dayIndex}
                onSelect={handleSelectDay}
                itemWidth="28%"
                formatItem={(d) => <span className="wheel-text-day">{d}</span>}
              />

              {/* Month Column */}
              <WheelColumn
                items={months}
                selectedIndex={monthIndex}
                onSelect={handleSelectMonth}
                itemWidth="44%"
                formatItem={(m) => <span className="wheel-text-month">{m}</span>}
              />

              {/* Year Column */}
              <WheelColumn
                items={years}
                selectedIndex={yearIndex}
                onSelect={handleSelectYear}
                itemWidth="28%"
                formatItem={(y) => <span className="wheel-text-year">{y}</span>}
              />
            </div>

            {/* Bottom Fade Gradient Mask */}
            <div className="wheel-fade-bottom" />
          </div>
        </div>
      )}
    </div>
  );
}
