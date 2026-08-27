"use client";
import React from 'react';

export function LogoMark({
  size = 28,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/brains-icon-master.png"
      alt="BRAINS Logo"
      width={size}
      height={size}
      className={`shrink-0 select-none object-contain ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}

export function Wordmark({
  size = 15,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      style={{ fontSize: `${size}px` }}
      className={`font-sans font-bold tracking-[0.16em] uppercase leading-none select-none ${className}`}
    >
      BRAINS AI
    </span>
  );
}

const MARK_TO_TEXT_RATIO = 1.15;

export function Logo({
  size = 16,
  showWordmark = true,
  className = '',
  textColor = 'text-current',
}: {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  textColor?: string;
}) {
  const markSize = Math.round(size * MARK_TO_TEXT_RATIO);
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={markSize} />
      {showWordmark && (
        <Wordmark size={size} className={textColor} />
      )}
    </div>
  );
}
