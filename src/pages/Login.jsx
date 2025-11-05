import React, { useState } from 'react'
const API = import.meta.env.VITE_API || 'http://localhost:4000';

export default function Login(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('password123')
  const [error,setError] = useState('')

  const submit = async (e)=>{
    e.preventDefault()
    setError('')
    try{
      const res = await fetch(`${API}/api/auth/login`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if(!res.ok) throw new Error(data.error||'failed')
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.user.role)
      localStorage.setItem('name', data.user.name)
      localStorage.setItem('user_id', data.user.id)
      window.location.href = '/'
    }catch(err){ setError(err.message) }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-100 p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">Welcome back</h1>
        {error && <div className="bg-red-50 text-red-700 p-2 rounded">{error}</div>}
        <div>
          <label className="text-sm">Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full border rounded-lg p-2" placeholder="you@company.com" />
        </div>
        <div>
          <label className="text-sm">Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full border rounded-lg p-2" placeholder="********" />
        </div>
        <button className="w-full py-2 rounded-lg bg-gray-900 text-white hover:opacity-90">Log in</button>
 <p className="text-xs text-gray-500 text-center">
          New user? <a className="text-indigo-600" href="/register">Regiter </a>
        </p>      </form>
    </div>
  )
}
