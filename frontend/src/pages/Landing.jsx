import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [bgFile, setBgFile] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const avatarRef = useRef();
  const bgRef = useRef();

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch {
      // fallback: focus the input
      document.getElementById('yt-url-input')?.focus();
    }
  };

  const handleGenerate = () => {
    // Store inputs in sessionStorage so studio can pick them up
    if (url) sessionStorage.setItem('yt_url', url);
    navigate('/studio');
  };

  useEffect(() => {
    // Scroll reveal
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToStudio = () => {
    document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#0A0A0F', color: '#F8F8FC', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2.5rem', background: 'rgba(10,10,15,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
          Mashup<span style={{ color: '#FF2D7A' }}>Studio</span>
          <span style={{ fontSize: '0.65rem', background: '#FF2D7A', color: '#fff', padding: '2px 7px', borderRadius: 20, marginLeft: 6, fontWeight: 600, letterSpacing: '0.05em' }}>BETA</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <a href="#features" style={{ color: '#7A7A99', textDecoration: 'none', fontSize: '0.9rem' }}>Features</a>
          <a href="#how" style={{ color: '#7A7A99', textDecoration: 'none', fontSize: '0.9rem' }}>How it works</a>
          <a href="#studio" style={{ color: '#7A7A99', textDecoration: 'none', fontSize: '0.9rem' }}>Try it</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/signin')} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.07)', color: '#7A7A99', padding: '0.45rem 1rem', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', cursor: 'pointer' }}>
            Sign in
          </button>
          <button onClick={() => navigate('/signup')} style={{ background: 'linear-gradient(135deg,#FF2D7A,#8B5CF6)', border: 'none', color: '#fff', padding: '0.45rem 1.1rem', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', cursor: 'pointer' }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '6rem 2rem 4rem', position: 'relative', overflow: 'hidden' }}>
        {/* Orbs */}
        <div style={{ position: 'absolute', width: 500, height: 500, background: 'rgba(255,45,122,0.18)', borderRadius: '50%', filter: 'blur(90px)', top: -100, left: -100, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, background: 'rgba(139,92,246,0.18)', borderRadius: '50%', filter: 'blur(90px)', bottom: -80, right: -80, pointerEvents: 'none' }} />

        {/* Pill */}
        <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,45,122,0.1)', border: '1px solid rgba(255,45,122,0.3)', color: '#FF6BAB', fontSize: '0.8rem', padding: '5px 14px', borderRadius: 20, marginBottom: '1.8rem', letterSpacing: '0.05em', fontWeight: 500 }}>
          <span style={{ width: 6, height: 6, background: '#FF2D7A', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
          AI-Powered Video Mashups
        </div>

        <h1 className="fade-up" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(2.8rem,7vw,5.5rem)', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '1.4rem', maxWidth: 820 }}>
          Create Viral<br />
          <span style={{ background: 'linear-gradient(135deg,#FF2D7A,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TikTok Mashups</span>
          <br />in Seconds
        </h1>

        <p className="fade-up" style={{ fontSize: '1.1rem', color: '#7A7A99', maxWidth: 500, lineHeight: 1.7, marginBottom: '2.8rem', fontWeight: 300 }}>
          Drop a YouTube link, pick your vibe, and let AI do the rest. Studio-quality videos — no editing skills required.
        </p>

        <div className="fade-up" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: '4rem' }}>
          <button onClick={scrollToStudio} style={{ background: 'linear-gradient(135deg,#FF2D7A,#8B5CF6)', border: 'none', color: '#fff', padding: '0.85rem 2rem', borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            ▶ Start Creating — it's free
          </button>
          <button onClick={() => navigate('/studio')} style={{ background: '#1A1A24', border: '1px solid rgba(255,255,255,0.07)', color: '#F8F8FC', padding: '0.85rem 2rem', borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            🎬 Open Studio
          </button>
        </div>

        {/* APP PREVIEW */}
        <div id="studio" className="fade-up" style={{ width: '100%', maxWidth: 780, margin: '0 auto' }}>
          <div style={{ background: '#1A1A24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ background: '#0F0F18', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['#FF5F57','#FEBC2E','#28C840'].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
              <span style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', color: '#555', fontFamily: "'DM Sans', sans-serif" }}>mashupstudio.app</span>
            </div>
            <div style={{ padding: '2rem' }}>
              {/* Step tabs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: '1.5rem' }}>
                {[['01','🎵','Sources'],['02','🎨','Style'],['03','✨','Effects'],['04','🔊','Audio']].map(([n,ic,lb], i) => (
                  <div key={n} onClick={() => setActiveStep(i)} style={{ background: activeStep===i ? 'rgba(255,45,122,0.08)' : '#18181F', border: `1px solid ${activeStep===i ? '#FF2D7A' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '1.1rem 0.9rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ fontSize: '0.65rem', color: '#7A7A99', marginBottom: 4 }}>{n}</div>
                    <div style={{ width: 40, height: 40, borderRadius: 10, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', background: activeStep===i ? 'rgba(255,45,122,0.2)' : 'rgba(255,255,255,0.05)' }}>{ic}</div>
                    <div style={{ fontSize: '0.78rem', color: activeStep===i ? '#FF6BAB' : '#7A7A99' }}>{lb}</div>
                  </div>
                ))}
              </div>

              {/* ── TAB CONTENT ── */}

              {/* SOURCES TAB */}
              {activeStep === 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#7A7A99', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🔗 YouTube URL</div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: '1rem' }}>
                    <input id="yt-url-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste a YouTube URL here..." style={{ flex: 1, background: '#18181F', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.7rem 1rem', color: '#F8F8FC', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', outline: 'none' }} />
                    <button onClick={handlePaste} style={{ background: 'rgba(255,45,122,0.1)', border: '1px solid rgba(255,45,122,0.3)', color: '#FF6BAB', padding: '0.7rem 1.1rem', borderRadius: 10, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>📋 Paste</button>
                  </div>
                  <input ref={avatarRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => setAvatarFile(e.target.files[0])} />
                  <input ref={bgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setBgFile(e.target.files[0])} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1rem' }}>
                    <div onClick={() => avatarRef.current.click()} style={{ background: avatarFile ? 'rgba(255,45,122,0.08)' : '#18181F', border: `1.5px dashed ${avatarFile ? '#FF2D7A' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '1.4rem', textAlign: 'center', cursor: 'pointer' }}>
                      <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{avatarFile ? '✅' : '👤'}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: 3 }}>{avatarFile ? avatarFile.name.slice(0,18)+'...' : 'Upload Avatar'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#7A7A99' }}>PNG, JPG, WebP or video</div>
                    </div>
                    <div onClick={() => bgRef.current.click()} style={{ background: bgFile ? 'rgba(139,92,246,0.08)' : '#18181F', border: `1.5px dashed ${bgFile ? '#8B5CF6' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '1.4rem', textAlign: 'center', cursor: 'pointer' }}>
                      <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{bgFile ? '✅' : '🖼'}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: 3 }}>{bgFile ? bgFile.name.slice(0,18)+'...' : 'Background'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#7A7A99' }}>PNG, JPG, WebP</div>
                    </div>
                  </div>
                  <div style={{ background: '#18181F', border: '1.5px dashed rgba(255,255,255,0.07)', borderRadius: 14, padding: '1rem', textAlign: 'center', cursor: 'pointer', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>🎧</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Custom Audio (optional)</div>
                    <div style={{ fontSize: '0.72rem', color: '#7A7A99' }}>MP3, WAV, M4A — overrides YouTube audio</div>
                  </div>
                </div>
              )}

              {/* STYLE TAB */}
              {activeStep === 1 && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#7A7A99', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🎨 Style Preset</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: '1rem' }}>
                    {[['Mashup','linear-gradient(135deg,#ff2eaa,#ff6b00)'],['Neon','linear-gradient(135deg,#8b2fc9,#ff2eaa)'],['Snow','linear-gradient(135deg,#1a3a6b,#4a90d9)'],['Dark','linear-gradient(135deg,#1a0533,#3d0066)'],['Anime','linear-gradient(135deg,#ff2eaa,#00cfff)'],['Glow','linear-gradient(135deg,#8b2fc9,#00b4a0)']].map(([n,g]) => (
                      <div key={n} style={{ background: g, borderRadius: 10, padding: '0.6rem', textAlign: 'center', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>{n}</div>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#7A7A99', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>✍️ Overlay Text</div>
                  <input defaultValue="SI TE SABES EL TIKTOK BAILAI" style={{ width: '100%', background: '#18181F', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.7rem 1rem', color: '#F8F8FC', fontSize: '0.85rem', outline: 'none', marginBottom: '1rem', boxSizing: 'border-box' }} />
                  <div style={{ fontSize: '0.75rem', color: '#7A7A99', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🔤 Font</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {['Anton','Impact','Bangers','Righteous','Pacifico'].map(f => (
                      <div key={f} style={{ background: f==='Anton' ? 'rgba(255,45,122,0.2)' : '#18181F', border: `1px solid ${f==='Anton' ? '#FF2D7A' : 'rgba(255,255,255,0.07)'}`, borderRadius: 8, padding: '0.4rem 0.8rem', fontSize: '0.78rem', cursor: 'pointer', color: f==='Anton' ? '#FF6BAB' : '#7A7A99' }}>{f}</div>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#7A7A99', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🎨 Text Color</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['#FFFFFF','#FFE000','#00CFFF','#FF2EAA','#00FF88','#FF3C00'].map(c => (
                      <div key={c} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: c==='#FFFFFF' ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent' }} />
                    ))}
                  </div>
                </div>
              )}

              {/* EFFECTS TAB */}
              {activeStep === 2 && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#7A7A99', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>✨ Visual Effects</div>
                  {[['❄️ Snowfall','Animated snowflakes overlay',true],['⚡ 4K Enhancement','Sharpen & clarity boost',true],['💫 Glow Particles','Floating light particles',false],['🌟 Soft Blur Glow','Background bloom effect',false],['📼 VHS Effect','Retro scanline overlay',false],['🎨 Chromatic Glow','Color aberration effect',false]].map(([n,d,on]) => (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{n}</div>
                        <div style={{ fontSize: '0.72rem', color: '#7A7A99' }}>{d}</div>
                      </div>
                      <div style={{ width: 40, height: 22, borderRadius: 11, background: on ? 'linear-gradient(135deg,#FF2D7A,#8B5CF6)' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: 2, width: 18, height: 18, background: '#fff', borderRadius: '50%', transition: 'all 0.2s', left: on ? 20 : 2 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* AUDIO TAB */}
              {activeStep === 3 && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#7A7A99', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🎵 Background Music</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: '1rem' }}>
                    {[['🔇','None'],['🎤','Hip-Hop'],['🎵','Pop'],['🔥','Reggaeton'],['🎧','Lo-Fi'],['⚡','EDM']].map(([ic,n]) => (
                      <div key={n} style={{ background: n==='None' ? 'rgba(255,45,122,0.1)' : '#18181F', border: `1px solid ${n==='None' ? 'rgba(255,45,122,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, padding: '0.7rem', textAlign: 'center', cursor: 'pointer' }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: 3 }}>{ic}</div>
                        <div style={{ fontSize: '0.75rem', color: n==='None' ? '#FF6BAB' : '#7A7A99' }}>{n}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#7A7A99', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>⚡ Audio Speed</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                    <input type="range" min={50} max={200} defaultValue={118} style={{ flex: 1, accentColor: '#FF2D7A' }} />
                    <span style={{ fontSize: '0.85rem', color: '#FF6BAB', fontWeight: 600, minWidth: 40 }}>1.18x</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#7A7A99', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🔊 Export Quality</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['Low','Medium','High','Ultra'].map(q => (
                      <div key={q} style={{ flex: 1, background: q==='High' ? 'rgba(255,45,122,0.15)' : '#18181F', border: `1px solid ${q==='High' ? '#FF2D7A' : 'rgba(255,255,255,0.07)'}`, borderRadius: 8, padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem', cursor: 'pointer', color: q==='High' ? '#FF6BAB' : '#7A7A99' }}>{q}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate — always visible at bottom */}
              <div style={{ marginTop: '1.2rem' }}>
                <button onClick={handleGenerate} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg,#FF2D7A,#8B5CF6)', border: 'none', borderRadius: 12, color: '#fff', fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  ▶ Generate Video
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', marginTop: '4rem', maxWidth: 780, width: '100%' }}>
          {[['50K+','Videos Created'],['< 60s','Average Render'],['4K','Max Resolution'],['Free','To Start']].map(([n,l]) => (
            <div key={l} style={{ background: '#1A1A24', padding: '1.8rem', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg,#FF2D7A,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{n}</div>
              <div style={{ color: '#7A7A99', fontSize: '0.82rem', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '5rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ color: '#FF2D7A', fontSize: '0.8rem', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '0.8rem', textTransform: 'uppercase' }}>Why Mashup Studio</div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '1rem' }}>Everything you need.<br />Nothing you don't.</h2>
        <p style={{ color: '#7A7A99', fontSize: '1rem', maxWidth: 480, lineHeight: 1.7 }}>Built for creators who want results, not complexity.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginTop: '3rem' }}>
          {[
            ['⚡','One-Click Generation','Paste a YouTube link and hit Generate. AI handles the rest — cuts, transitions, beat sync.'],
            ['🎨','Smart Style Engine','Auto-detects colors from your avatar and creates a matching gradient background instantly.'],
            ['🎭','Avatar + Background','Drop your photo or a video avatar with any background. Supports animated PNGs too.'],
            ['📱','TikTok-Ready Output','Exports in 16:9 format, perfectly sized for TikTok, Reels, and Shorts.'],
            ['🔊','Custom Audio','Use the original YouTube audio or drop in your own MP3, WAV, or M4A track.'],
            ['✨','Visual Effects','Snowfall, neon, and cinematic effects that make your video stand out.'],
          ].map(([ic,t,d]) => (
            <div key={t} className="reveal" style={{ background: '#1A1A24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '1.6rem' }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(255,45,122,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '1rem' }}>{ic}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>{t}</div>
              <div style={{ color: '#7A7A99', fontSize: '0.88rem', lineHeight: 1.6 }}>{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <div id="how" style={{ background: '#111118', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '5rem 2rem' }}>
          <div style={{ color: '#FF2D7A', fontSize: '0.8rem', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '0.8rem', textTransform: 'uppercase' }}>How it works</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 700, letterSpacing: '-0.02em' }}>4 steps to viral.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 0, marginTop: '3rem' }}>
            {[['1','Paste a link','Any YouTube video URL works as your source material'],['2','Upload your avatar','A photo, PNG cutout, or short video clip of yourself'],['3','Pick a style','Choose effects, colors, and transitions that fit your vibe'],['4','Generate & share','Download your video in seconds and post it instantly']].map(([n,t,d]) => (
              <div key={n} className="reveal" style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem', border: '2px solid rgba(255,255,255,0.07)', color: '#7A7A99' }}>{n}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '0.95rem', marginBottom: 6 }}>{t}</div>
                <div style={{ color: '#7A7A99', fontSize: '0.82rem', lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER CTA ── */}
      <div style={{ textAlign: 'center', padding: '5rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, background: 'rgba(255,45,122,0.1)', borderRadius: '50%', filter: 'blur(90px)', top: -100, left: -100, pointerEvents: 'none' }} />
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
          Ready to go viral?<br />
          <span style={{ background: 'linear-gradient(135deg,#FF2D7A,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Start for free today.</span>
        </h2>
        <p style={{ color: '#7A7A99', fontSize: '1rem', marginBottom: '2rem' }}>No account required. No watermark on first 3 videos.</p>
        <button onClick={() => navigate('/studio')} style={{ background: 'linear-gradient(135deg,#FF2D7A,#8B5CF6)', border: 'none', color: '#fff', padding: '1rem 2.4rem', borderRadius: 12, fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', fontWeight: 500, cursor: 'pointer', margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          ▶ Create your first mashup
        </button>
      </div>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#7A7A99', fontSize: '0.8rem' }}>
        <span>© 2025 MashupStudio · All rights reserved</span>
        <span style={{ color: '#3a3a4a', fontSize: '0.75rem' }}>1080p MP4 · Auto thumbnail · Queue included</span>
        <div style={{ display: 'flex', gap: '1.2rem' }}>
          {['Privacy','Terms','Help'].map(l => <a key={l} href="#" style={{ color: '#7A7A99', textDecoration: 'none', fontSize: '0.8rem' }}>{l}</a>)}
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
        .fade-up { animation: fadeUp 0.7s ease both; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
