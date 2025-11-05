// import React, { useEffect, useMemo, useState } from 'react';
// import Nav from '../components/Nav';
// import Card from '../components/Card';
// import Sidebar from '../components/Sidebar';
// import SimpleBarChart from '../components/SimpleBarChart';
// import { api } from '../api';

// function SectionGrid({ children }) {
//   return <div className="grid md:grid-cols-2 gap-4">{children}</div>;
// }

// export default function Dashboard() {
//   const [user] = useState({
//     name: localStorage.getItem('name'),
//     role: localStorage.getItem('role'),
//     id: String(localStorage.getItem('user_id')),
//   });
//   const [active, setActive] = useState('overview');

//   // Data buckets
//   const [time, setTime] = useState([]);
//   const [leave, setLeave] = useState([]);
//   const [schedules, setSchedules] = useState([]);
//   const [summary, setSummary] = useState(null);
//   const [payroll, setPayroll] = useState([]);

//   // People lists
//   const [people, setPeople] = useState([]);        // for scheduling dropdown (mgr: employees only; admin: all)
//   const [peopleAll, setPeopleAll] = useState([]);  // for admin/manager filters

//   // Timesheet filters (admin)
//   const [selectedUserId, setSelectedUserId] = useState('all');

//   // Leave filters (admin/manager)
//   const [leaveFilterUser, setLeaveFilterUser] = useState('all');
//   const [leaveFilterStatus, setLeaveFilterStatus] = useState('all'); // "all" | "pending" | "approved" | "rejected"

//   // Form reset keys
//   const [scheduleFormKey, setScheduleFormKey] = useState(0);
//   const [leaveFormKey, setLeaveFormKey] = useState(0);

//   const today = new Date().toISOString().slice(0, 10);

//   const peopleMap = useMemo(() => {
//     const m = new Map();
//     peopleAll.forEach(p => m.set(String(p.id), p));
//     return m;
//   }, [peopleAll]);

//   const load = async () => {
//     const timePath = user.role === 'admin'
//       ? '/time'
//       : `/time?user_id=${encodeURIComponent(user.id)}`;

//     const base = [api(timePath), api('/leave')];

//     const extra = [];
//     if (user.role !== 'employee') {
//       extra.push(api('/schedules'), api('/reports/summary'), api('/employees'));
//     }

//     const [t, l, ...rest] = await Promise.all([...base, ...extra]);
//     setTime(t);
//     setLeave(l);

//     if (user.role !== 'employee') {
//       const [sched, sum, emps] = rest;
//       setSchedules(sched);
//       setSummary(sum);
//       setPeopleAll(emps || []);
//       const filteredForScheduling = (emps || []).filter(p => (user.role === 'admin' ? true : p.role === 'employee'));
//       setPeople(filteredForScheduling);
//     }
//   };

//   const reloadTimeForSelection = async (uid) => {
//     if (user.role !== 'admin') return;
//     const rows = !uid || uid === 'all'
//       ? await api('/time')
//       : await api(`/time?user_id=${encodeURIComponent(uid)}`);
//     setTime(rows);
//   };

//   const buildLeaveQuery = (uid, status) => {
//     const params = new URLSearchParams();
//     if (uid && uid !== 'all') params.set('user_id', uid);
//     if (status && status !== 'all') params.set('status', status);
//     const qs = params.toString();
//     return qs ? `/leave?${qs}` : '/leave';
//   };

//   const reloadLeaveForSelection = async (uid, status) => {
//     // Employees: own leaves only (filters ignored server-side)
//     if (user.role === 'employee') {
//       const rows = await api('/leave');
//       setLeave(rows);
//       return;
//     }
//     const path = buildLeaveQuery(uid, status);
//     const rows = await api(path);
//     setLeave(rows);
//   };

//   useEffect(() => { load(); }, []);
//   useEffect(() => {
//     if (user.role === 'admin') reloadTimeForSelection(selectedUserId);
//   }, [selectedUserId, user.role]);

//   // Re-load leaves when either filter changes (admin/manager)
//   useEffect(() => {
//     if (user.role !== 'employee') {
//       reloadLeaveForSelection(leaveFilterUser, leaveFilterStatus);
//     }
//   }, [leaveFilterUser, leaveFilterStatus, user.role]);

//   const logout = () => { localStorage.clear(); window.location.href = '/login'; };

//   // Helpers to keep optimistic updates consistent with filters
//   const matchesLeaveFilters = (row) => {
//     if (user.role === 'employee') return true; // employees don't filter
//     if (leaveFilterUser !== 'all' && row.user !== leaveFilterUser) return false;
//     if (leaveFilterStatus !== 'all' && row.status !== leaveFilterStatus) return false;
//     return true;
//   };

//   // Actions
//   const clockIn = async () => { await api('/time/clock-in', { method: 'POST' }); user.role === 'admin' ? reloadTimeForSelection(selectedUserId) : load(); };
//   const clockOut = async () => { await api('/time/clock-out', { method: 'POST' }); user.role === 'admin' ? reloadTimeForSelection(selectedUserId) : load(); };

//   // LEAVE: create (optimistic insert + clear form)
//   const requestLeave = async e => {
//     e.preventDefault();
//     const form = new FormData(e.currentTarget);
//     const payload = Object.fromEntries(form);
//     const resp = await api('/leave', { method: 'POST', body: JSON.stringify(payload) });
//     if (resp.leave) {
//       setLeave(prev => (matchesLeaveFilters(resp.leave) ? [resp.leave, ...prev] : prev));
//     } else {
//       await reloadLeaveForSelection(leaveFilterUser, leaveFilterStatus);
//     }
//     e.currentTarget.reset();
//     setLeaveFormKey(k => k + 1);
//   };

//   // LEAVE: approve/reject (patch or remove depending on filter)
//   const decideLeave = async (id, action) => {
//     const resp = await api(`/leave/${id}/${action}`, { method: 'POST' });
//     if (resp.leave) {
//       setLeave(prev => {
//         const updated = resp.leave;
//         const stillMatches = matchesLeaveFilters(updated);
//         if (!stillMatches) {
//           // remove from current filtered view
//           return prev.filter(r => (r.id || r._id) !== id);
//         }
//         // patch in place
//         return prev.map(row => (row.id === id ? updated : row));
//       });
//     } else {
//       await reloadLeaveForSelection(leaveFilterUser, leaveFilterStatus);
//     }
//   };

//   // Timesheet approve
//   const approve = async id => {
//     await api(`/time/${id}/approve`, { method: 'POST' });
//     user.role === 'admin' ? reloadTimeForSelection(selectedUserId) : load();
//   };

//   // SCHEDULES: create (optimistic insert + clear form)
//   const addSchedule = async e => {
//     e.preventDefault();
//     const form = new FormData(e.currentTarget);
//     const payload = Object.fromEntries(form);
//     const resp = await api('/schedules', { method: 'POST', body: JSON.stringify(payload) });
//     if (resp.schedule) {
//       setSchedules(prev => [resp.schedule, ...prev]);
//     } else {
//       const fresh = await api('/schedules');
//       setSchedules(fresh);
//     }
//     e.currentTarget.reset();
//     setScheduleFormKey(k => k + 1);
//   };

//   const runPayroll = async e => {
//     e.preventDefault();
//     const form = new FormData(e.currentTarget);
//     const from = form.get('from'), to = form.get('to');
//     const data = await api(`/payroll/run?from=${from}&to=${to}`);
//     setPayroll(data);
//   };

//   // ========== Sections ==========
//   const Overview = () => (
//     <div className="space-y-4">
//       <SectionGrid>
//         <Card title="Report Summary">
//           {!summary ? (
//             <p className="text-sm text-gray-500">Loading…</p>
//           ) : (
//             <div>
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
//                 <Stat label="Employees" value={summary.employees} />
//                 <Stat label="Time Entries" value={summary.time_entries} />
//                 <Stat label="Approved" value={summary.approved_entries} />
//                 <Stat label="Leave Requests" value={summary.leave_requests} />
//               </div>
//               <div className="mt-4">
//                 <SimpleBarChart
//                   data={[
//                     { label: 'Entries', value: summary.time_entries || 0 },
//                     { label: 'Approved', value: summary.approved_entries || 0 },
//                     { label: 'Leave', value: summary.leave_requests || 0 },
//                   ]}
//                 />
//               </div>
//             </div>
//           )}
//         </Card>

//         <Card
//           title="Quick Actions"
//           actions={
//             <div className="flex gap-2">
//               <button onClick={clockIn} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white">Clock In</button>
//               <button onClick={clockOut} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white">Clock Out</button>
//             </div>
//           }
//         >
//           <p className="text-sm text-gray-600">Today: {today}</p>
//           <p className="text-sm mt-2 text-gray-500">Use the sidebar to view other sections.</p>
//         </Card>
//       </SectionGrid>
//     </div>
//   );

//   const MyTimesheetTable = () => (
//     <table className="w-full mt-2 text-sm">
//       <thead><tr className="text-left text-gray-500"><th>Date</th><th>In</th><th>Out</th><th>Approved</th></tr></thead>
//       <tbody>
//         {time.map(t => (
//           <tr key={t._id || t.id} className="border-t">
//             <td>{t.date}</td><td>{t.clock_in?.slice(11, 19) || '-'}</td><td>{t.clock_out?.slice(11, 19) || '-'}</td><td>{t.approved ? '✔️' : '⏳'}</td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );

//   const AdminTimesheetTable = () => (
//     <table className="w-full mt-2 text-sm">
//       <thead>
//         <tr className="text-left text-gray-500">
//           <th>Code</th><th>Name</th><th>Role</th><th>Date</th><th>In</th><th>Out</th><th>Approved</th><th></th>
//         </tr>
//       </thead>
//       <tbody>
//         {time.map(t => {
//           const uid = String(t.user || '');
//           const p = peopleMap.get(uid);
//           return (
//             <tr key={t._id || t.id} className="border-t">
//               <td>{p?.employee_code || '—'}</td><td>{p?.name || '—'}</td><td>{p?.role || '—'}</td>
//               <td>{t.date}</td><td>{t.clock_in?.slice(11, 19) || '-'}</td><td>{t.clock_out?.slice(11, 19) || '-'}</td>
//               <td>{t.approved ? '✔️' : '⏳'}</td>
//               <td>{!t.approved && <button onClick={() => approve(t._id || t.id)} className="text-indigo-600">Approve</button>}</td>
//             </tr>
//           );
//         })}
//       </tbody>
//     </table>
//   );

//   const Timesheet = () => {
//     const isAdmin = user.role === 'admin';
//     return (
//       <Card
//         title={isAdmin ? 'All Users Timesheets' : 'My Timesheet'}
//         actions={
//           isAdmin && (
//             <div className="flex items-center gap-2">
//               <label className="text-sm text-gray-600">View:</label>
//               <select className="border rounded-lg p-2" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
//                 <option value="all">All (latest)</option>
//                 {peopleAll.map(p => (
//                   <option key={p.id} value={p.id}>{p.name} — {p.role} ({p.id})</option>
//                 ))}
//               </select>
//             </div>
//           )
//         }
//       >
//         {isAdmin ? <AdminTimesheetTable /> : <MyTimesheetTable />}
//       </Card>
//     );
//   };

//   // ===== LEAVE SECTION with user + status filters (admin/manager) =====
//   const Leave = () => (
//     <SectionGrid>
//       <Card title="Request Time Off">
//         <form key={leaveFormKey} onSubmit={requestLeave} className="grid sm:grid-cols-2 gap-2">
//           <select name="type" className="border rounded-lg p-2" required>
//             <option value="vacation">Vacation</option>
//             <option value="sick">Sick</option>
//             <option value="other">Other</option>
//           </select>
//           <input name="start_date" type="date" className="border rounded-lg p-2" required />
//           <input name="end_date" type="date" className="border rounded-lg p-2" required />
//           <input name="reason" placeholder="Reason (optional)" className="border rounded-lg p-2 sm:col-span-2" />
//           <button className="px-3 py-2 rounded-lg bg-gray-900 text-white sm:col-span-2">Submit</button>
//         </form>
//       </Card>

//       <Card title="Leave Requests">
//         {/* Filter bar for admin/manager */}
//         {user.role !== 'employee' && (
//           <div className="flex flex-wrap gap-2 items-center mb-2">
//             <label className="text-sm text-gray-600">User:</label>
//             <select
//               className="border rounded-lg p-2"
//               value={leaveFilterUser}
//               onChange={e => setLeaveFilterUser(e.target.value)}
//             >
//               <option value="all">All users</option>
//               {peopleAll.map(p => (
//                 <option key={p.id} value={p.id}>
//                   {p.name} — {p.role} ({p.employee_code || '—'})
//                 </option>
//               ))}
//             </select>

//             <label className="text-sm text-gray-600 ml-2">Status:</label>
//             <select
//               className="border rounded-lg p-2"
//               value={leaveFilterStatus}
//               onChange={e => setLeaveFilterStatus(e.target.value)}
//             >
//               <option value="all">All</option>
//               <option value="pending">Pending</option>
//               <option value="approved">Approved</option>
//               <option value="rejected">Rejected</option>
//             </select>

//             <button
//               type="button"
//               className="px-3 py-1.5 rounded-lg border ml-auto"
//               onClick={() => { setLeaveFilterUser('all'); setLeaveFilterStatus('all'); }}
//             >
//               Reset
//             </button>
//           </div>
//         )}

//         <ul className="space-y-1 text-sm">
//           {leave.map(l => (
//             <li key={l.id || l._id} className="flex items-center justify-between border rounded-lg p-2">
//               <div className="flex flex-col">
//                 {user.role !== 'employee' && (
//                   <span className="text-gray-900 font-medium">
//                     {l.name || '—'} {l.employee_code ? `• ${l.employee_code}` : ''}
//                   </span>
//                 )}
//                 <span className="text-gray-700">
//                   {l.type} • {l.start_date} → {l.end_date} • {l.status}
//                 </span>
//                 {l.reason && <span className="text-xs text-gray-500">“{l.reason}”</span>}
//               </div>

//               {user.role !== 'employee' && l.status === 'pending' && (
//                 <div className="flex gap-2">
//                   <button onClick={() => decideLeave(l.id, 'approve')} className="text-emerald-600">Approve</button>
//                   <button onClick={() => decideLeave(l.id, 'reject')} className="text-rose-600">Reject</button>
//                 </div>
//               )}
//             </li>
//           ))}
//         </ul>
//       </Card>
//     </SectionGrid>
//   );

//   // ===== SCHEDULES =====
//   const Schedules = () => (
//     <Card title="Team Schedules">
//       <form key={scheduleFormKey} onSubmit={addSchedule} className="grid sm:grid-cols-4 gap-2 mb-3">
//         <select name="user_id" className="border rounded-lg p-2" required>
//           <option value="">Select user…</option>
//           {people.map(p => (
//             <option key={p.id} value={p.id}>
//               {p.name} — {p.role} ({p.employee_code || '—'})
//             </option>
//           ))}
//         </select>

//         <input name="shift_date" type="date" className="border rounded-lg p-2" required />
//         <select name="shift" className="border rounded-lg p-2" required>
//           <option value="Morning">Morning</option>
//           <option value="Afternoon">Afternoon</option>
//           <option value="Night">Night</option>
//         </select>
//         <button className="px-3 py-2 rounded-lg bg-gray-900 text-white">Add</button>
//       </form>

//       <table className="w-full text-sm">
//         <thead>
//           <tr className="text-left text-gray-500">
//             <th>Date</th>
//             <th>Employee</th>
//             <th>Code</th>
//             <th>Shift</th>
//           </tr>
//         </thead>
//         <tbody>
//           {schedules.map(s => (
//             <tr key={s.id} className="border-t">
//               <td>{s.shift_date}</td>
//               <td>{s.name}</td>
//               <td>{s.employee_code || '—'}</td>
//               <td>{s.shift}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </Card>
//   );

//   const Payroll = () => (
//     <Card title="Run Payroll">
//       <form onSubmit={runPayroll} className="flex flex-wrap gap-2 items-end">
//         <div>
//           <label className="text-xs">From</label>
//           <input name="from" type="date" className="block border rounded-lg p-2" required />
//         </div>
//         <div>
//           <label className="text-xs">To</label>
//           <input name="to" type="date" className="block border rounded-lg p-2" required />
//         </div>
//         <button className="px-3 py-2 rounded-lg bg-gray-900 text-white">Run</button>
//       </form>
//       {payroll.length > 0 && (
//         <table className="w-full text-sm mt-3">
//           <thead><tr className="text-left text-gray-500"><th>Employee</th><th>Hours</th><th>Rate</th><th>Gross pay</th></tr></thead>
//           <tbody>
//             {payroll.map(p => (
//               <tr key={p.user_id} className="border-t">
//                 <td>{p.name}</td>
//                 <td>{(p.hours || 0).toFixed(2)}</td>
//                 <td>${p.hourly_rate.toFixed(2)}</td>
//                 <td>${p.gross_pay.toFixed(2)}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </Card>
//   );

//   const Employees = () => (
//     <Card title="Employees">
//       <EmployeesTable />
//     </Card>
//   );

//   return (
//     <div className="min-h-screen">
//       <Nav user={user} onLogout={logout} />
//       <div className="max-w-7xl mx-auto p-4">
//         <div className="bg-gray-100 rounded-2xl overflow-hidden min-h-[70vh] shadow flex">
//           <Sidebar active={active} setActive={setActive} role={user.role} />
//           <main className="flex-1 p-4 space-y-4">
//             {active === 'overview' && <Overview />}
//             {active === 'time' && <Timesheet />}
//             {active === 'leave' && <Leave />}
//             {user.role !== 'employee' && active === 'schedules' && <Schedules />}
//             {user.role === 'admin' && active === 'payroll' && <Payroll />}
//             {user.role === 'admin' && active === 'employees' && <Employees />}
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// }

// function Stat({ label, value }) {
//   return (
//     <div className="bg-gray-50 rounded-xl p-4">
//       <div className="text-2xl font-bold">{value}</div>
//       <div className="text-xs text-gray-500">{label}</div>
//     </div>
//   );
// }

// function EmployeesTable() {
//   const [data, setData] = useState([]);
//   useEffect(() => { api('/employees').then(setData).catch(() => {}); }, []);
//   if (!data.length) return <p className="text-sm text-gray-500">No data or insufficient permissions.</p>;
//   return (
//     <table className="w-full text-sm">
//       <thead><tr className="text-left text-gray-500"><th>Code</th><th>Name</th><th>Email</th><th>Role</th><th>Rate</th></tr></thead>
//       <tbody>
//         {data.map(e => (
//           <tr key={e.id} className="border-t">
//             <td>{e.employee_code || '—'}</td><td>{e.name}</td><td>{e.email}</td><td>{e.role}</td><td>${e.hourly_rate}</td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// }



import React, { useEffect, useMemo, useState } from 'react';
import Nav from '../components/Nav';
import Card from '../components/Card';
import Sidebar from '../components/Sidebar';
import SimpleBarChart from '../components/SimpleBarChart';
import { api } from '../api';

function SectionGrid({ children }) {
  return <div className="grid md:grid-cols-2 gap-4">{children}</div>;
}

export default function Dashboard() {
  const [user] = useState({
    name: localStorage.getItem('name'),
    role: localStorage.getItem('role'),
    id: String(localStorage.getItem('user_id')),
  });
  const [active, setActive] = useState('overview');

  // Data buckets
  const [time, setTime] = useState([]);
  const [leave, setLeave] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [summary, setSummary] = useState(null);
  const [payroll, setPayroll] = useState([]);

  // People lists
  const [people, setPeople] = useState([]);        // for scheduling dropdown (mgr: employees only; admin: all)
  const [peopleAll, setPeopleAll] = useState([]);  // for admin/manager filters

  // Timesheet filters (admin)
  const [selectedUserId, setSelectedUserId] = useState('all');

  // Leave filters (admin/manager)
  const [leaveFilterUser, setLeaveFilterUser] = useState('all');
  const [leaveFilterStatus, setLeaveFilterStatus] = useState('all'); // "all" | "pending" | "approved" | "rejected"

  // Form reset keys
  const [scheduleFormKey, setScheduleFormKey] = useState(0);
  const [leaveFormKey, setLeaveFormKey] = useState(0);

  const today = new Date().toISOString().slice(0, 10);

  const peopleMap = useMemo(() => {
    const m = new Map();
    peopleAll.forEach(p => m.set(String(p.id), p));
    return m;
  }, [peopleAll]);

  const load = async () => {
    const timePath = user.role === 'admin'
      ? '/time'
      : `/time?user_id=${encodeURIComponent(user.id)}`;

    const base = [api(timePath), api('/leave')];

    const extra = [];
    if (user.role !== 'employee') {
      extra.push(api('/schedules'), api('/reports/summary'), api('/employees'));
    }

    const [t, l, ...rest] = await Promise.all([...base, ...extra]);
    setTime(t);
    setLeave(l);

    if (user.role !== 'employee') {
      const [sched, sum, emps] = rest;
      setSchedules(sched);
      setSummary(sum);
      setPeopleAll(emps || []);
      const filteredForScheduling = (emps || []).filter(p => (user.role === 'admin' ? true : p.role === 'employee'));
      setPeople(filteredForScheduling);
    }
  };

  const reloadTimeForSelection = async (uid) => {
    if (user.role !== 'admin') return;
    const rows = !uid || uid === 'all'
      ? await api('/time')
      : await api(`/time?user_id=${encodeURIComponent(uid)}`);
    setTime(rows);
  };

  const buildLeaveQuery = (uid, status) => {
    const params = new URLSearchParams();
    if (uid && uid !== 'all') params.set('user_id', uid);
    if (status && status !== 'all') params.set('status', status);
    const qs = params.toString();
    return qs ? `/leave?${qs}` : '/leave';
  };

  const reloadLeaveForSelection = async (uid, status) => {
    if (user.role === 'employee') {
      const rows = await api('/leave');
      setLeave(rows);
      return;
    }
    const path = buildLeaveQuery(uid, status);
    const rows = await api(path);
    setLeave(rows);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (user.role === 'admin') reloadTimeForSelection(selectedUserId);
  }, [selectedUserId, user.role]);

  useEffect(() => {
    if (user.role !== 'employee') {
      reloadLeaveForSelection(leaveFilterUser, leaveFilterStatus);
    }
  }, [leaveFilterUser, leaveFilterStatus, user.role]);

  const logout = () => { localStorage.clear(); window.location.href = '/login'; };

  const matchesLeaveFilters = (row) => {
    if (user.role === 'employee') return true;
    if (leaveFilterUser !== 'all' && row.user !== leaveFilterUser) return false;
    if (leaveFilterStatus !== 'all' && row.status !== leaveFilterStatus) return false;
    return true;
  };

  // Actions
  const clockIn = async () => { await api('/time/clock-in', { method: 'POST' }); user.role === 'admin' ? reloadTimeForSelection(selectedUserId) : load(); };
  const clockOut = async () => { await api('/time/clock-out', { method: 'POST' }); user.role === 'admin' ? reloadTimeForSelection(selectedUserId) : load(); };

  // LEAVE: employees only
  const requestLeave = async e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form);
    const resp = await api('/leave', { method: 'POST', body: JSON.stringify(payload) });
    if (resp.leave) {
      setLeave(prev => (matchesLeaveFilters(resp.leave) ? [resp.leave, ...prev] : prev));
    } else {
      await reloadLeaveForSelection(leaveFilterUser, leaveFilterStatus);
    }
    e.currentTarget.reset();
    setLeaveFormKey(k => k + 1);
  };

  const decideLeave = async (id, action) => {
    const resp = await api(`/leave/${id}/${action}`, { method: 'POST' });
    if (resp.leave) {
      setLeave(prev => {
        const updated = resp.leave;
        const stillMatches = matchesLeaveFilters(updated);
        if (!stillMatches) return prev.filter(r => (r.id || r._id) !== id);
        return prev.map(row => (row.id === id ? updated : row));
      });
    } else {
      await reloadLeaveForSelection(leaveFilterUser, leaveFilterStatus);
    }
  };

  const approve = async id => {
    await api(`/time/${id}/approve`, { method: 'POST' });
    user.role === 'admin' ? reloadTimeForSelection(selectedUserId) : load();
  };

  const addSchedule = async e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form);
    const resp = await api('/schedules', { method: 'POST', body: JSON.stringify(payload) });
    if (resp.schedule) {
      setSchedules(prev => [resp.schedule, ...prev]);
    } else {
      const fresh = await api('/schedules');
      setSchedules(fresh);
    }
    e.currentTarget.reset();
    setScheduleFormKey(k => k + 1);
  };

  const runPayroll = async e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const from = form.get('from'), to = form.get('to');
    const data = await api(`/payroll/run?from=${from}&to=${to}`);
    setPayroll(data);
  };

  // ========== Sections ==========
  const Overview = () => (
    <div className="space-y-4">
      <SectionGrid>
        <Card title="Report Summary">
          {!summary ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <Stat label="Employees" value={summary.employees} />
                <Stat label="Time Entries" value={summary.time_entries} />
                <Stat label="Approved" value={summary.approved_entries} />
                <Stat label="Leave Requests" value={summary.leave_requests} />
              </div>
              <div className="mt-4">
                <SimpleBarChart
                  data={[
                    { label: 'Entries', value: summary.time_entries || 0 },
                    { label: 'Approved', value: summary.approved_entries || 0 },
                    { label: 'Leave', value: summary.leave_requests || 0 },
                  ]}
                />
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Quick Actions"
          actions={
            <div className="flex gap-2">
              <button onClick={clockIn} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white">Clock In</button>
              <button onClick={clockOut} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white">Clock Out</button>
            </div>
          }
        >
          <p className="text-sm text-gray-600">Today: {today}</p>
          <p className="text-sm mt-2 text-gray-500">Use the sidebar to view other sections.</p>
        </Card>
      </SectionGrid>
    </div>
  );

  const MyTimesheetTable = () => (
    <table className="w-full mt-2 text-sm">
      <thead><tr className="text-left text-gray-500"><th>Date</th><th>In</th><th>Out</th><th>Approved</th></tr></thead>
      <tbody>
        {time.map(t => (
          <tr key={t._id || t.id} className="border-t">
            <td>{t.date}</td><td>{t.clock_in?.slice(11, 19) || '-'}</td><td>{t.clock_out?.slice(11, 19) || '-'}</td><td>{t.approved ? '✔️' : '⏳'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const AdminTimesheetTable = () => (
    <table className="w-full mt-2 text-sm">
      <thead>
        <tr className="text-left text-gray-500">
          <th>Code</th><th>Name</th><th>Role</th><th>Date</th><th>In</th><th>Out</th><th>Approved</th><th></th>
        </tr>
      </thead>
      <tbody>
        {time.map(t => {
          const uid = String(t.user || '');
          const p = peopleMap.get(uid);
          return (
            <tr key={t._id || t.id} className="border-t">
              <td>{p?.employee_code || '—'}</td><td>{p?.name || '—'}</td><td>{p?.role || '—'}</td>
              <td>{t.date}</td><td>{t.clock_in?.slice(11, 19) || '-'}</td><td>{t.clock_out?.slice(11, 19) || '-'}</td>
              <td>{t.approved ? '✔️' : '⏳'}</td>
              <td>{!t.approved && <button onClick={() => approve(t._id || t.id)} className="text-indigo-600">Approve</button>}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const Timesheet = () => {
    const isAdmin = user.role === 'admin';
    return (
      <Card
        title={isAdmin ? 'All Users Timesheets' : 'My Timesheet'}
        actions={
          isAdmin && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">View:</label>
              <select className="border rounded-lg p-2" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                <option value="all">All (latest)</option>
                {peopleAll.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.role} ({p.id})</option>
                ))}
              </select>
            </div>
          )
        }
      >
        {isAdmin ? <AdminTimesheetTable /> : <MyTimesheetTable />}
      </Card>
    );
  };

  // ===== LEAVE SECTION =====
  const Leave = () => {
    // EMPLOYEE: two-column layout, but make the list card span full width on md+
    if (user.role === 'employee') {
      return (
        <SectionGrid>
          <Card title="Request Time Off">
            <form key={leaveFormKey} onSubmit={requestLeave} className="grid sm:grid-cols-2 gap-2">
              <select name="type" className="border rounded-lg p-2" required>
                <option value="vacation">Vacation</option>
                <option value="sick">Sick</option>
                <option value="other">Other</option>
              </select>
              <input name="start_date" type="date" className="border rounded-lg p-2" required />
              <input name="end_date" type="date" className="border rounded-lg p-2" required />
              <input name="reason" placeholder="Reason (optional)" className="border rounded-lg p-2 sm:col-span-2" />
              <button className="px-3 py-2 rounded-lg bg-gray-900 text-white sm:col-span-2">Submit</button>
            </form>
          </Card>

          {/* span the list across both columns for more width */}
          <div className="md:col-span-2">
            <Card title="Leave Requests">
              <ul className="space-y-1 text-sm">
                {leave.map(l => (
                  <li key={l.id || l._id} className="flex items-center justify-between border rounded-lg p-2">
                    <div className="flex flex-col">
                      <span className="text-gray-700">
                        {l.type} • {l.start_date} → {l.end_date} • {l.status}
                      </span>
                      {l.reason && <span className="text-xs text-gray-500">“{l.reason}”</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </SectionGrid>
      );
    }

    // ADMIN/MANAGER: single full-width card (no grid) + filters
    return (
      <Card title="Leave Requests">
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <label className="text-sm text-gray-600">User:</label>
          <select
            className="border rounded-lg p-2"
            value={leaveFilterUser}
            onChange={e => setLeaveFilterUser(e.target.value)}
          >
            <option value="all">All users</option>
            {peopleAll.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.role} ({p.employee_code || '—'})
              </option>
            ))}
          </select>

          <label className="text-sm text-gray-600 ml-2">Status:</label>
          <select
            className="border rounded-lg p-2"
            value={leaveFilterStatus}
            onChange={e => setLeaveFilterStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            type="button"
            className="px-3 py-1.5 rounded-lg border ml-auto"
            onClick={() => { setLeaveFilterUser('all'); setLeaveFilterStatus('all'); }}
          >
            Reset
          </button>
        </div>

        <ul className="space-y-1 text-sm">
          {leave.map(l => (
            <li key={l.id || l._id} className="flex items-center justify-between border rounded-lg p-2">
              <div className="flex flex-col">
                <span className="text-gray-900 font-medium">
                  {l.name || '—'} {l.employee_code ? `• ${l.employee_code}` : ''}
                </span>
                <span className="text-gray-700">
                  {l.type} • {l.start_date} → {l.end_date} • {l.status}
                </span>
                {l.reason && <span className="text-xs text-gray-500">“{l.reason}”</span>}
              </div>

              {l.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => decideLeave(l.id, 'approve')} className="text-emerald-600">Approve</button>
                  <button onClick={() => decideLeave(l.id, 'reject')} className="text-rose-600">Reject</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>
    );
  };

  // ===== SCHEDULES =====
  const Schedules = () => (
    <Card title="Team Schedules">
      <form key={scheduleFormKey} onSubmit={addSchedule} className="grid sm:grid-cols-4 gap-2 mb-3">
        <select name="user_id" className="border rounded-lg p-2" required>
          <option value="">Select user…</option>
          {people.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.role} ({p.employee_code || '—'})
            </option>
          ))}
        </select>

        <input name="shift_date" type="date" className="border rounded-lg p-2" required />
        <select name="shift" className="border rounded-lg p-2" required>
          <option value="Morning">Morning</option>
          <option value="Afternoon">Afternoon</option>
          <option value="Night">Night</option>
        </select>
        <button className="px-3 py-2 rounded-lg bg-gray-900 text-white">Add</button>
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th>Date</th>
            <th>Employee</th>
            <th>Code</th>
            <th>Shift</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map(s => (
            <tr key={s.id} className="border-t">
              <td>{s.shift_date}</td>
              <td>{s.name}</td>
              <td>{s.employee_code || '—'}</td>
              <td>{s.shift}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );

  const Payroll = () => (
    <Card title="Run Payroll">
      <form onSubmit={runPayroll} className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs">From</label>
          <input name="from" type="date" className="block border rounded-lg p-2" required />
        </div>
        <div>
          <label className="text-xs">To</label>
          <input name="to" type="date" className="block border rounded-lg p-2" required />
        </div>
        <button className="px-3 py-2 rounded-lg bg-gray-900 text-white">Run</button>
      </form>
      {payroll.length > 0 && (
        <table className="w-full text-sm mt-3">
          <thead><tr className="text-left text-gray-500"><th>Employee</th><th>Hours</th><th>Rate</th><th>Gross pay</th></tr></thead>
          <tbody>
            {payroll.map(p => (
              <tr key={p.user_id} className="border-t">
                <td>{p.name}</td>
                <td>{(p.hours || 0).toFixed(2)}</td>
                <td>${p.hourly_rate.toFixed(2)}</td>
                <td>${p.gross_pay.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );

  const Employees = () => (
    <Card title="Employees">
      <EmployeesTable />
    </Card>
  );

  return (
    <div className="min-h-screen">
      <Nav user={user} onLogout={logout} />
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-gray-100 rounded-2xl overflow-hidden min-h-[70vh] shadow flex">
          <Sidebar active={active} setActive={setActive} role={user.role} />
          <main className="flex-1 p-4 space-y-4">
            {active === 'overview' && <Overview />}
            {active === 'time' && <Timesheet />}
            {active === 'leave' && <Leave />}
            {user.role !== 'employee' && active === 'schedules' && <Schedules />}
            {user.role === 'admin' && active === 'payroll' && <Payroll />}
            {user.role === 'admin' && active === 'employees' && <Employees />}
          </main>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function EmployeesTable() {
  const [data, setData] = useState([]);
  useEffect(() => { api('/employees').then(setData).catch(() => {}); }, []);
  if (!data.length) return <p className="text-sm text-gray-500">No data or insufficient permissions.</p>;
  return (
    <table className="w-full text-sm">
      <thead><tr className="text-left text-gray-500"><th>Code</th><th>Name</th><th>Email</th><th>Role</th><th>Rate</th></tr></thead>
      <tbody>
        {data.map(e => (
          <tr key={e.id} className="border-t">
            <td>{e.employee_code || '—'}</td><td>{e.name}</td><td>{e.email}</td><td>{e.role}</td><td>${e.hourly_rate}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
