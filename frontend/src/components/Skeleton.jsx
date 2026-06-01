import React from 'react';

export function SkeletonRow({ cols = 4 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded" style={{
            background: 'var(--skeleton-bg, var(--border-light))',
            width: `${40 + Math.random() * 40}%`,
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="p-4 rounded-xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-light)' }}>
      <div className="h-5 w-1/3 rounded mb-3" style={{
        background: 'var(--border-light)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 rounded mb-2" style={{
          background: 'var(--border-light)',
          width: `${60 + Math.random() * 30}%`,
          animation: 'pulse 1.5s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  );
}

export default function Skeleton({ type = 'table', rows = 5, cols }) {
  if (type === 'card') {
    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {Array.from({ length: rows }).map((_, i) => <SkeletonCard key={i} lines={3} />)}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ background: 'var(--table-header-bg)' }}>
            {Array.from({ length: cols || 4 }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-4 rounded" style={{
                  background: 'var(--skeleton-bg, var(--border-light))',
                  width: '60%',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} cols={cols || 4} />)}
        </tbody>
      </table>
    </div>
  );
}
