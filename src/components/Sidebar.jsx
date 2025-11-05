import React from 'react';

const items = [
  { key: 'overview', label: 'Dashboard' },
  { key: 'time', label: 'Timesheet' },
  { key: 'leave', label: 'Leave' },
  { key: 'schedules', label: 'Schedules' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'employees', label: 'Employees' },
];

export default function Sidebar({ active, setActive, role }) {
  const visible = items.filter(i => {
    if (i.key === 'payroll' || i.key === 'employees') return role === 'admin';
    if (i.key === 'schedules') return role !== 'employee';
    return true;
  });

  return (
    <aside className="w-56 shrink-0 h-full bg-white border-r">
      <div className="p-4 font-bold text-lg">Menu</div>
      <nav className="px-2 pb-4 space-y-1">
        {visible.map(i => (
          <button
            key={i.key}
            onClick={() => setActive(i.key)}
            className={`w-full text-left px-3 py-2 rounded-lg ${
              active === i.key ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'
            }`}
          >
            {i.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
