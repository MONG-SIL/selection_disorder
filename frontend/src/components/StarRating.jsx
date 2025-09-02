import React, { useMemo, useRef, useId } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: inline-block;
  cursor: ${props => (props.$readOnly ? 'default' : 'pointer')};
  user-select: none;
`;

export default function StarRating({ value = 0, onChange, size = 24, readOnly = false, gap = 4 }) {
  const containerRef = useRef(null);
  const reactId = typeof useId === 'function' ? useId() : undefined;
  const fallbackIdRef = useRef(`star-clip-${Math.random().toString(36).slice(2)}`);
  const clipId = reactId || fallbackIdRef.current;

  const clampedValue = useMemo(() => Math.max(0, Math.min(5, value)), [value]);
  const percent = useMemo(() => (clampedValue / 5) * 100, [clampedValue]);

  const totalWidth = useMemo(() => size * 5 + gap * 4, [size, gap]);

  const handleClick = (clientX) => {
    if (readOnly) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const ratio = x / rect.width;
    const raw = ratio * 5;
    const snapped = Math.round(raw * 2) / 2;
    const next = Math.max(0.5, Math.min(5, snapped));
    onChange && onChange(next);
  };

  // 5각 별 path (24x24 기준)
  const starPath = "M12 1.8l3.09 6.26 6.91 1-5 4.87 1.18 6.89L12 17.77 5.82 20.82 7 13.93 2 9.06l6.91-1L12 1.8z";

  return (
    <Wrapper
      ref={containerRef}
      $readOnly={readOnly}
      onClick={(e) => handleClick(e.clientX)}
      role={readOnly ? 'img' : 'slider'}
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={clampedValue}
    >
      <svg width={totalWidth} height={size} viewBox={`0 0 ${totalWidth} ${size}`} style={{ display:'block' }}>
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={(totalWidth * percent) / 100} height={size} />
          </clipPath>
        </defs>

        {/* 배경 별 (회색) */}
        {Array.from({ length: 5 }).map((_, i) => (
          <path
            key={`bg-${i}`}
            d={starPath}
            transform={`translate(${i * (size + gap)}, 0) scale(${size / 24})`}
            fill="#e0e0e0"
          />
        ))}

        {/* 채워진 별 (금색) - clipPath로 퍼센트만큼 채움 */}
        <g clipPath={`url(#${clipId})`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <path
              key={`fg-${i}`}
              d={starPath}
              transform={`translate(${i * (size + gap)}, 0) scale(${size / 24})`}
              fill="#ffb400"
            />
          ))}
        </g>
      </svg>
    </Wrapper>
  );
}


