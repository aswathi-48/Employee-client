// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// import './index.css'
// import Login from './pages/Login'
// import Dashboard from './pages/Dashboard'
// import Register from './pages/Register'

// function RequireAuth({ children, roles }){
//   const token = localStorage.getItem('token')
//   const role = localStorage.getItem('role')
//   if(!token) return <Navigate to="/login" replace />
//   if(roles && !roles.includes(role)) return <Navigate to="/" replace />
//   return children
// }

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <BrowserRouter>
//       <Routes>
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />

//         <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
//       </Routes>
//     </BrowserRouter>
//   </React.StrictMode>
// )


import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Register from './pages/Register'

function RequireAuth({ children, roles }){
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  if(!token) return <Navigate to="/login" replace />
  if(roles && !roles.includes(role)) return <Navigate to="/" replace />
  return children
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
