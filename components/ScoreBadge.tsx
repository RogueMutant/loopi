"use client";

/**
 * ScoreBadge — Animated circular progress ring for campaign scores.
 * ─────────────────────────────────────────────────────────────────
 * Hero component used in feed cards (56px), detail pages (72px),
 * and compact views (40px).
 */

import { useEffect, useRef, useState } from "react";

interface ScoreBadgeProps {
  score: number;
  size?: number;
  animate?: boolean;
  founderScore?: number | null;
}

export function ScoreBadge({
  score,
  size = 56,
  animate = true,
  founderScore,
}: ScoreBadgeProps) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillTarget = (score / 100) * circumference * 0.75;

  const [currentFill, setCurrentFill] = useState(animate ? 0 : fillTarget);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const color = score >= 75 ? "#00D282" : score >= 40 ? "#D2991F" : "#F85149";
  const showCap =
    score === 40 && founderScore !== undefined && founderScore !== null && founderScore < 20;

  // Font sizing
  const fontSize = size <= 40 ? 11 : size <= 56 ? 14 : 17;
  const capFontSize = 9;

  useEffect(() => {
    if (!animate) {
      setCurrentFill(fillTarget);
      return;
    }

    // Respect prefers-reduced-motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setCurrentFill(fillTarget);
      return;
    }

    const duration = 600;

    function step(timestamp: number) {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrentFill(eased * fillTarget);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      }
    }

    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, fillTarget]);

  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="flex-shrink-0"
      role="img"
      aria-label={`Score: ${score} out of 100`}
    >
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#161B22"
        strokeWidth={strokeWidth}
      />
      {/* Fill arc */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${currentFill} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
      />
      {/* Score number */}
      <text
        x={center}
        y={showCap ? center + 1 : center + fontSize * 0.35}
        textAnchor="middle"
        fill={color}
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 500,
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        {score}
      </text>
      {/* Hard cap indicator */}
      {showCap && (
        <text
          x={center}
          y={center + fontSize * 0.35 + capFontSize + 2}
          textAnchor="middle"
          fill="#F85149"
          style={{
            fontSize: `${capFontSize}px`,
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          ▲
        </text>
      )}
    </svg>
  );
}
