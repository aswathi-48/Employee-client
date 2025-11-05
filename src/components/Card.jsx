import React from 'react';
export default function Card({ title, children, actions }){
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">{title}</h2>
        <div>{actions}</div>
      </div>
      <div>{children}</div>
    </div>
  )
}
