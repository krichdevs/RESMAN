import React from 'react';

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
};

export default function Sparkline({ data, width = 100, height = 24, color = '#d4af37' }: SparklineProps) {
  if (!data || data.length === 0) {
    return <svg width={width} height={height} />;
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const len = data.length;
  const points = data.map((v, i) => {
    const x = (i / (len - 1 || 1)) * width;
    const y = height - ((v - min) / (max - min || 1)) * height;
    return `${x},${y}`;
  });

  const polylinePoints = points.join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polyline
        fill={`url(#spark-gradient)`}
        stroke={color}
        strokeWidth={1.5}
        points={`${polylinePoints} ${width},${height} 0,${height}`}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ fillRule: 'nonzero', strokeLinejoin: 'round' }}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        points={polylinePoints}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
