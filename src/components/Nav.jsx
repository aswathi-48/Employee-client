import React from 'react';
export default function Nav({ user, onLogout }){
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white shadow">
      <h1 className="text-xl font-bold">Employee Time & Payroll</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.name} • {user?.role}</span>
        <button onClick={onLogout} className="px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:opacity-90">Logout</button>
      </div>
    </div>
  )
}
