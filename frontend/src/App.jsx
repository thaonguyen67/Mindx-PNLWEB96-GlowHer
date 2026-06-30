import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Exercises from './pages/Exercises';
import GeneratePlan from './pages/GeneratePlan';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function OfflineBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.isOffline) setShow(true);
    };
    window.addEventListener('glowher:offline', handler);
    return () => window.removeEventListener('glowher:offline', handler);
  }, []);
  if (!show) return null;
  return (
    <div style={{
      background:'#FEF2F2', borderBottom:'1px solid #FCA5A5',
      color:'#B91C1C', fontSize:14, fontWeight:600,
      padding:'10px 24px', textAlign:'center',
      display:'flex', alignItems:'center', justifyContent:'center', gap:10,
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      Cannot connect to server. Please check that the backend is running.
      <button onClick={() => setShow(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#B91C1C', fontSize:16, padding:0, lineHeight:1 }}>✕</button>
    </div>
  );
}

function Layout() {
  const loc = useLocation();
  const isAuth = loc.pathname === '/login' || loc.pathname === '/register';
  return (
    <>
      <OfflineBanner />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/exercises" element={<Exercises />} />
        <Route path="/generate-plan" element={<GeneratePlan />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAuth && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
