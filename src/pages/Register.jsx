import React, { useState } from 'react'
const API = import.meta.env.VITE_API || 'http://localhost:4000';

export default function Register(){
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    hourly_rate: 20
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'hourly_rate' ? Number(value) : value
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // save session
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('name', data.user.name);
      localStorage.setItem('user_id', data.user.id);

      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-100 p-4">
      <form onSubmit={submit} className="w-full max-w-lg bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">Create your account</h1>
        {error && <div className="bg-red-50 text-red-700 p-2 rounded">{error}</div>}

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Full name</label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              className="mt-1 w-full border rounded-lg p-2"
              placeholder="Jane Doe"
              required
            />
          </div>

          <div>
            <label className="text-sm">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              className="mt-1 w-full border rounded-lg p-2"
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <label className="text-sm">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              className="mt-1 w-full border rounded-lg p-2"
              placeholder="********"
              required
            />
          </div>

          <div>
            <label className="text-sm">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={onChange}
              className="mt-1 w-full border rounded-lg p-2"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm">Hourly rate</label>
            <input
              name="hourly_rate"
              type="number"
              step="0.01"
              value={form.hourly_rate}
              onChange={onChange}
              className="mt-1 w-full border rounded-lg p-2"
            />
          </div>
        </div>

        <button
          disabled={loading}
          className="w-full py-2 rounded-lg bg-gray-900 text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Register'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Already have an account? <a className="text-indigo-600" href="/login">Log in</a>
        </p>
      </form>
    </div>
  );
}
