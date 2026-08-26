import React, { useState } from 'react';

export const TrendAreaChart = ({
  data = [], // [{ label: 'Mon', count: 12 }, ...]
  height = 180,
  strokeColor = '#E76120',
  gradientFrom = 'rgba(231, 97, 32, 0.25)',
  gradientTo = 'rgba(231, 97, 32, 0.01)',
  unit = '',
}) => {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-slate-400 text-xs font-sans">
        No trend data available for selected period.
      </div>
    );
  }

  const values = data.map((d) => d.count || 0);
  const maxVal = Math.max(...values, 5);
  const minVal = 0;

  const width = 600;
  const paddingX = 40;
  const paddingY = 25;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1 || 1)) * chartWidth;
    const y = paddingY + chartHeight - ((d.count - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

  return (
    <div className="w-full relative font-sans select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: height }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 0.33, 0.66, 1].map((ratio, idx) => {
          const y = paddingY + chartHeight * (1 - ratio);
          return (
            <g key={idx}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <text
                x={paddingX - 8}
                y={y + 3}
                textAnchor="end"
                className="text-[9px] fill-slate-400 font-mono"
              >
                {Math.round(minVal + (maxVal - minVal) * ratio)}
              </text>
            </g>
          );
        })}

        {/* Gradient Area Fill */}
        <path d={areaD} fill="url(#areaGradient)" />

        {/* Stroke Line */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points & X-axis Labels */}
        {points.map((pt, i) => (
          <g key={i}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hoverIndex === i ? '6' : '3.5'}
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth="2"
              className="transition-all cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
            <text
              x={pt.x}
              y={height - 8}
              textAnchor="middle"
              className="text-[10px] fill-slate-500 font-semibold"
            >
              {pt.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Hover Tooltip */}
      {hoverIndex !== null && points[hoverIndex] && (
        <div
          className="absolute bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg pointer-events-none -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(points[hoverIndex].x / width) * 100}%`,
            top: `${(points[hoverIndex].y / height) * 100}%`,
          }}
        >
          {points[hoverIndex].label}: {points[hoverIndex].count} {unit}
        </div>
      )}
    </div>
  );
};

export default TrendAreaChart;
