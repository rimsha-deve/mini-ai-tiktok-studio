import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignIn() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('/studio'); }, 1000);
  };

  const S = {
    page: { minHeight: '100vh', background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '2rem', position: 'relative', overflow: 'hidden' },
    orb1: { position: 'absolute', width: 500, height: 500, background: 'rgba(139,92,246,0.15)', borderRadius: '50%', filter: 'blur(90px)', top: -150, right: -150, pointerEvents: 'none' },
    orb2: { position: 'absolute', width: 400, height: 400, background: 'rgba(255,45,122,0.12)', borderRadius: '50%', filter: 'blur(90px)', bottom: -100, left: -100, pointerEvents: 'none' },
    card: { background: '#1A1A24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: '2.5rem', width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 },
    logo: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.2rem', textAlign: 'center', marginBottom: '0.5rem', color: '#F8F8FC' },
    title: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.6rem', textAlign: 'center', marginBottom: '0.4rem', color: '#F8F8FC' },
    sub: { color: '#7A7A99', fontSize: '0.88rem', textAlign: 'center', marginBottom: '2rem' },
    label: { display: 'block', fontSize: '0.82rem', color: '#7A7A99', marginBottom: '0.4rem', fontWeight: 500 },
    input: { width: '100%', background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.75rem 1rem', color: '#F8F8FC', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', outline: 'none', marginBottom: '1rem', boxSizing: 'border-box' },
    btn: { width: '100%', padding: '0.9rem', background: 'linear-gradient(135deg,#FF2D7A,#8B5CF6)', border: 'none', borderRadius: 12, color: '#fff', fontFamily: "'Syne', sans-serif", fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' },
    link: { color: '#FF6BAB', cursor: 'pointer', textDecoration: 'none', fontWeight: 500 },
    divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '1.5rem 0', color: '#3a3a4a', fontSize: '0.8rem' },
    line: { flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' },
  };

  return (
    <div style={S.page}>
      <div style={S.orb1} />
      <div style={S.orb2} />
      <div style={S.card}>
        <div style={S.logo}>Mashup<span style={{ color: '#FF2D7A' }}>Studio</span></div>
        <h2 style={S.title}>Welcome back</h2>
        <p style={S.sub}>Sign in to continue creating</p>

        <form onSubmit={handleSubmit}>
          <label style={S.label}>Email</label>
          <input style={S.input} type="email" placeholder="you@example.com" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={{ ...S.label, marginBottom: 0 }}>Password</label>
            <span style={{ ...S.link, fontSize: '0.8rem' }}>Forgot password?</span>
          </div>
          <input style={S.input} type="password" placeholder="Your password" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />

          <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? '⟳ Signing in...' : '▶ Sign In'}
          </button>
        </form>

        <div style={S.divider}>
          <div style={S.line} />or<div style={S.line} />
        </div>

        {[['🌐','Continue with Google'],['🍎','Continue with Apple']].map(([ic,t]) => (
          <button key={t} onClick={() => navigate('/studio')} style={{ width: '100%', background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.75rem', color: '#F8F8FC', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', cursor: 'pointer', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {ic} {t}
          </button>
        ))}

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#7A7A99' }}>
          Don't have an account?{' '}
          <span style={S.link} onClick={() => navigate('/signup')}>Sign up free</span>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button onClick={() => navigate('/studio')} style={{ background: 'none', border: 'none', color: '#3a3a4a', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
            Continue without account →
          </button>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');`}</style>
    </div>
  );
}
