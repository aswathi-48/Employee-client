// const API = import.meta.env.VITE_API || 'http://localhost:4000';
const API = "https://employee-server-1-mk5p.onrender.com";

export async function api(path, opts={}){
  const token = localStorage.getItem('token');
  const res = await fetch(`${API}/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers||{}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if(!res.ok){
    const err = await res.json().catch(()=>({error:res.statusText}));
    throw new Error(err.error||'Request failed');
  }
  return res.json();
}
