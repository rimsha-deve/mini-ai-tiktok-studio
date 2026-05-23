import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate signup — replace with real auth later
    setTimeout(() => {
      setLoading(false);
      navigate('/studio');
    }, 1200);
  };

  const S = {
    page: { minHeight: '100vh', background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '2rem', position: 'relative', overflow: 'hidden' },
    orb1: { position: 'absolute', width: 500, height: 500, background: 'rgba(255,45,122,0.15)', borderRadius: '50%', filter: 'blur(90px)', top: -150, left: -150, pointerEvents: 'none' },
    orb2: { position: 'absolute', width: 400, height: 400, background: 'rgba(139,92,246,0.15)', borderRadius: '50%', filter: 'blur(90px)', bottom: -100, right: -100, pointerEvents: 'none' },
    card: { background: '#1A1A24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: '2.5rem', width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 },
    logo: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.2rem', textAlign: 'center', marginBottom: '0.5rem', color: '#F8F8FC' },
    logoSpan: { color: '#FF2D7A' },
    title: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.6rem', textAlign: 'center', marginBottom: '0.4rem', color: '#F8F8FC' },
    sub: { color: '#7A7A99', fontSize: '0.88rem', textAlign: 'center', marginBottom: '2rem' },
    label: { display: 'block', fontSize: '0.82rem', color: '#7A7A99', marginBottom: '0.4rem', fontWeight: 500 },
    input: { width: '100%', background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.75rem 1rem', color: '#F8F8FC', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', outline: 'none', marginBottom: '1rem', boxSizing: 'border-box' },
    btn: { width: '100%', padding: '0.9rem', background: 'linear-gradient(135deg,#FF2D7A,#8B5CF6)', border: 'none', borderRadius: 12, color: '#fff', fontFamily: "'Syne', sans-serif", fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' },
    divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '1.5rem 0', color: '#3a3a4a', fontSize: '0.8rem' },
    line: { flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' },
    link: { color: '#FF6BAB', cursor: 'pointer', textDecoration: 'none', fontWeight: 500 },
    footer: { textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#7A7A99' },
  };

  return (
    <div style={S.page}>
      <div style={S.orb1} />
      <div style={S.orb2} />
      <div style={S.card}>
        <div style={S.logo}>Mashup<span style={S.logoSpan}>Studio</span></div>
        <h2 style={S.title}>Create your account</h2>
        <p style={S.sub}>Start making viral TikTok mashups for free</p>

        <form onSubmit={handleSubmit}>
          <label style={S.label}>Full Name</label>
          <input style={S.input} type="text" placeholder="Your name" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />

          <label style={S.label}>Email</label>
          <input style={S.input} type="email" placeholder="you@example.com" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />

          <label style={S.label}>Password</label>
          <input style={S.input} type="password" placeholder="Min. 8 characters" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />

          <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? '⟳ Creating account...' : '▶ Create Free Account'}
          </button>
        </form>

        <div style={S.divider}>
          <div style={S.line} />or continue with<div style={S.line} />
        </div>

        {/* Social buttons */}
        {[['🌐','Continue with Google'],['🍎','Continue with Apple']].map(([ic,t]) => (
          <button key={t} onClick={() => navigate('/studio')} style={{ width: '100%', background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.75rem', color: '#F8F8FC', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', cursor: 'pointer', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {ic} {t}
          </button>
        ))}

        <div style={S.footer}>
          Already have an account?{' '}
          <span style={S.link} onClick={() => navigate('/signin')}>Sign in</span>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: '#3a3a4a' }}>
          By signing up you agree to our <a href="#" style={{ color: '#7A7A99' }}>Terms</a> and <a href="#" style={{ color: '#7A7A99' }}>Privacy Policy</a>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');`}</style>
    </div>
  );
}
