import React from 'react';

/** data: Array<{ label: string, value: number }> */
export default function SimpleBarChart({ data = [], height = 180 }) {
  const max = Math.max(1, ...data.map(d => d.value || 0));
  const barW = 100 / Math.max(1, data.length);

  return (
    <div className="bg-white rounded-2xl shadow p-3">
      <svg viewBox={`0 0 100 ${height}`} className="w-full h-48">
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 20);
          const x = i * barW + 5;
          const y = height - h - 15;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW - 10} height={h} rx="2" />
              <text x={x + (barW - 10) / 2} y={height - 5} textAnchor="middle" fontSize="4">
                {d.label}
              </text>
              <text x={x + (barW - 10) / 2} y={y - 2} textAnchor="middle" fontSize="4">
                {Number(d.value).toFixed(0)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
