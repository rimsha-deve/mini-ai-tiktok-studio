import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const G = 'linear-gradient(135deg,#FF2EAA,#8B2FC9)';
const FEATURES = [
  ['⚡','One-Click Generation','Paste a link and hit Generate. AI handles cuts, transitions, beat sync.'],
  ['🎨','Smart Style Engine','Auto-detects colors from your avatar and creates a matching gradient background.'],
  ['👤','Avatar + Background','Drop any photo or video avatar. Background removed automatically.'],
  ['📱','TikTok-Ready Output','Exports in 16:9 format, perfectly sized for TikTok, Reels, and Shorts.'],
  ['🎵','Custom Audio','Upload your own MP3, WAV, or M4A track instead of YouTube audio.'],
  ['❄️','Visual Effects','Snowfall, neon, and cinematic effects that make your video stand out.'],
];
const STEPS = [
  ['Upload Music','Choose any song from your device'],
  ['Upload Avatar','Add your image or animated avatar'],
  ['Pick a Style','Select the vibe you want'],
  ['Generate & Share','AI creates your video. Post and go viral!'],
];
const TESTIMONIALS = [
  { handle:'@visualdreams', color:'#8B2FC9', letter:'V', text:'Mashup Studio literally saves me hours. The AI edits are insane!' },
  { handle:'@contentforge',  color:'#FF2EAA', letter:'C', text:'My TikTok exploded after using this. 10/10 recommend.' },
  { handle:'@vibemaker',     color:'#0066FF', letter:'V', text:'Super easy to use and the results look professional.' },
];
const STYLES = [
  ['Neon',      'linear-gradient(135deg,#1a0035,#4a006e)'],
  ['Anime',     'linear-gradient(135deg,#001a3a,#003070)'],
  ['Dark Trap', 'linear-gradient(135deg,#111,#2a2a2a)'],
  ['Velocity',  'linear-gradient(135deg,#002a1a,#004a30)'],
  ['Glitch',    'linear-gradient(135deg,#1a001a,#3a003a)'],
  ['Cyberpunk', 'linear-gradient(135deg,#1a1a00,#3a3a00)'],
  ['Sigma',     'linear-gradient(135deg,#001a2a,#003a50)'],
  ['Retro',     'linear-gradient(135deg,#2a1000,#4a2000)'],
];
const TRENDING = [
  'linear-gradient(135deg,#2d0060,#1a003a)',
  'linear-gradient(135deg,#3a0010,#600020)',
  'linear-gradient(135deg,#001a3a,#00091a)',
  'linear-gradient(135deg,#1a1a00,#2a2a00)',
];

const S = {
  page:    { background:'#08080e', color:'rgba(255,255,255,0.92)', fontFamily:"'DM Sans',system-ui,sans-serif", minHeight:'100vh', overflowX:'hidden' },
  // NAV
  nav:     { position:'fixed', top:0, left:0, right:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', height:52, background:'rgba(8,8,14,0.85)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  navLogo: { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16, letterSpacing:'-0.3px', color:'#fff', display:'flex', alignItems:'center', gap:6 },
  navBeta: { fontSize:9, background:'rgba(255,46,170,0.15)', color:'#FF2EAA', border:'1px solid rgba(255,46,170,0.25)', padding:'2px 7px', borderRadius:20, fontWeight:700, letterSpacing:'0.06em' },
  navLinks:{ display:'flex', gap:24 },
  navLink: { fontSize:13, color:'rgba(255,255,255,0.4)', cursor:'pointer', textDecoration:'none' },
  navRight:{ display:'flex', gap:8, alignItems:'center' },
  btnLogin:{ fontSize:12, color:'rgba(255,255,255,0.55)', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', padding:'5px 14px', borderRadius:7, cursor:'pointer' },
  btnStart:{ fontSize:12, fontWeight:700, color:'#fff', background:'linear-gradient(135deg,#FF2EAA,#8B2FC9)', border:'none', padding:'6px 16px', borderRadius:7, cursor:'pointer' },
  // HERO
  hero:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:0, padding:'100px 48px 48px', minHeight:'100vh', alignItems:'center', maxWidth:1200, margin:'0 auto' },
  heroL:   { paddingRight:40 },
  eyebrow: { display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,46,170,0.08)', border:'1px solid rgba(255,46,170,0.2)', color:'#FF2EAA', fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', padding:'4px 12px', borderRadius:20, marginBottom:22 },
  eyeDot:  { width:6, height:6, background:'#FF2EAA', borderRadius:'50%', animation:'pulse 1.5s infinite' },
  h1:      { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:42, lineHeight:1.1, letterSpacing:'-1.5px', color:'#fff', marginBottom:14 },
  h1pink:  { color:'#FF2EAA' },
  h1pur:   { color:'#a855f7' },
  hsub:    { fontSize:14, color:'rgba(255,255,255,0.38)', lineHeight:1.7, marginBottom:20, maxWidth:380 },
  badges:  { display:'flex', gap:16, marginBottom:24, flexWrap:'wrap' },
  badge:   { display:'flex', alignItems:'center', gap:5, fontSize:12, color:'rgba(255,255,255,0.38)' },
  hbtns:   { display:'flex', gap:10, marginBottom:28 },
  btnP:    { background:'linear-gradient(135deg,#FF2EAA,#8B2FC9)', color:'#fff', border:'none', padding:'10px 20px', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:7 },
  btnSec:  { background:'transparent', color:'rgba(255,255,255,0.55)', border:'1px solid rgba(255,255,255,0.1)', padding:'10px 16px', borderRadius:9, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:7 },
  proof:   { display:'flex', alignItems:'center', gap:8 },
  proofAvs:{ display:'flex' },
  proofAv: { width:22, height:22, borderRadius:'50%', border:'2px solid #08080e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'#fff', marginLeft:-6 },
  stars:   { color:'#FFB300', fontSize:12, letterSpacing:-1 },
  proofTxt:{ fontSize:11, color:'rgba(255,255,255,0.3)' },
  // PHONE
  heroR:   { display:'flex', justifyContent:'center', alignItems:'center', position:'relative' },
  phone:   { width:140, background:'#111', borderRadius:20, border:'2px solid rgba(255,255,255,0.08)', overflow:'hidden', boxShadow:'0 40px 80px rgba(0,0,0,0.6)' },
  pScreen: { height:210, background:'linear-gradient(160deg,#1a0035,#2d0060,#0d0025)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' },
  pTxt:    { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16, color:'#fff', textAlign:'center', lineHeight:1.2, textShadow:'0 2px 12px rgba(0,0,0,0.9)' },
  pPlay:   { position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', width:30, height:30, background:'rgba(255,46,170,0.8)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff' },
  pBar:    { background:'#0d0d1a', padding:'6px 10px' },
  pProg:   { height:2, background:'rgba(255,255,255,0.1)', borderRadius:1, marginBottom:4 },
  pFill:   { height:2, width:'40%', background:'linear-gradient(90deg,#FF2EAA,#8B2FC9)', borderRadius:1 },
  pTime:   { fontSize:8, color:'rgba(255,255,255,0.3)' },
  counter: { position:'absolute', top:10, right:-14, background:'#fff', borderRadius:10, padding:'8px 10px', boxShadow:'0 8px 24px rgba(0,0,0,0.5)' },
  ctrNum:  { fontSize:18, fontWeight:800, color:'#FF2EAA', lineHeight:1 },
  ctrLbl:  { fontSize:8, color:'#888', lineHeight:1.3, marginTop:2 },
  musicBubble:{ position:'absolute', top:-10, left:-20, background:'rgba(139,47,201,0.9)', borderRadius:'50%', width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow:'0 4px 16px rgba(139,47,201,0.4)' },
  tikBubble:  { position:'absolute', bottom:30, left:-24, background:'rgba(0,0,0,0.9)', borderRadius:'50%', width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, border:'2px solid rgba(255,255,255,0.1)' },
  // STUDIO
  studio:  { maxWidth:900, margin:'0 auto 0', padding:'0 32px 40px' },
  studioBox:{ background:'#0f0f1c', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, overflow:'hidden' },
  stHdr:   { padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.05)' },
  stTitle: { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:'#fff' },
  stTut:   { fontSize:11, color:'rgba(255,255,255,0.3)', cursor:'pointer' },
  stTabs:  { display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderBottom:'1px solid rgba(255,255,255,0.05)' },
  stTab:   { padding:'11px 14px', fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.3)', display:'flex', alignItems:'center', gap:7, borderRight:'1px solid rgba(255,255,255,0.04)', cursor:'pointer' },
  stTabOn: { color:'#fff', background:'rgba(255,46,170,0.06)' },
  tabNum:  { width:18, height:18, borderRadius:'50%', background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700 },
  tabNumOn:{ background:'linear-gradient(135deg,#FF2EAA,#8B2FC9)', color:'#fff' },
  stBody:  { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', minHeight:160 },
  stCol:   { padding:'14px', borderRight:'1px solid rgba(255,255,255,0.04)' },
  stColLast:{ padding:'14px' },
  stColLbl:{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 },
  uploadDz:{ border:'1.5px dashed rgba(255,46,170,0.25)', borderRadius:9, padding:'14px 10px', textAlign:'center', background:'rgba(255,46,170,0.02)' },
  dzIco:   { fontSize:20, opacity:0.5, marginBottom:5 },
  dzTxt:   { fontSize:9, color:'rgba(255,255,255,0.25)', lineHeight:1.5 },
  uploadFile:{ display:'flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.04)', borderRadius:7, padding:'6px 8px', marginTop:7 },
  fileIco: { width:24, height:24, background:'rgba(255,46,170,0.15)', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, flexShrink:0 },
  fileName:{ fontSize:9, color:'rgba(255,255,255,0.5)' },
  fileWave:{ fontSize:7, color:'rgba(255,255,255,0.2)', marginTop:1 },
  avCircle:{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,#2d0060,#1a0035)', border:'2px solid rgba(139,47,201,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, margin:'0 auto 6px' },
  avHint:  { fontSize:9, color:'rgba(255,255,255,0.25)', textAlign:'center' },
  styleGrid:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4 },
  styleCard:{ borderRadius:6, height:36, display:'flex', alignItems:'flex-end', padding:'4px 5px', cursor:'pointer', position:'relative', overflow:'hidden' },
  styleLbl:{ fontSize:7, fontWeight:700, color:'#fff', textShadow:'0 1px 4px rgba(0,0,0,0.9)' },
  genBtn:  { margin:'12px', background:'linear-gradient(135deg,#FF2EAA,#8B2FC9)', border:'none', borderRadius:9, padding:'11px', width:'calc(100% - 24px)', fontSize:13, fontWeight:700, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 },
  // STATS
  statsBar:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', background:'#0d0d1a', borderTop:'1px solid rgba(255,255,255,0.04)', maxWidth:900, margin:'0 auto' },
  stat:    { padding:'16px 24px', display:'flex', alignItems:'center', gap:10, borderRight:'1px solid rgba(255,255,255,0.04)' },
  statIco: { fontSize:20, opacity:0.55, flexShrink:0 },
  statNum: { fontSize:20, fontWeight:800, background:'linear-gradient(135deg,#FF2EAA,#a855f7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', lineHeight:1 },
  statLbl: { fontSize:9, color:'rgba(255,255,255,0.28)', marginTop:2 },
  // HOW IT WORKS
  howSec:  { maxWidth:900, margin:'0 auto', padding:'40px 32px' },
  secEye:  { fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'#FF2EAA', marginBottom:8, textAlign:'center' },
  secH:    { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:26, color:'#fff', marginBottom:32, textAlign:'center', letterSpacing:'-0.5px' },
  stepsRow:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0, alignItems:'start' },
  step:    { display:'flex', gap:10, alignItems:'flex-start', padding:'0 8px' },
  stepNum: { width:26, height:26, borderRadius:'50%', background:'rgba(255,46,170,0.12)', border:'1px solid rgba(255,46,170,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#FF2EAA', flexShrink:0 },
  stepName:{ fontSize:12, fontWeight:600, color:'#fff', marginBottom:4 },
  stepDesc:{ fontSize:10, color:'rgba(255,255,255,0.28)', lineHeight:1.5 },
  stepArrow:{ fontSize:14, color:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', paddingTop:4 },
  // BOTTOM GRID
  bottomGrid:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, maxWidth:900, margin:'0 auto', padding:'0 32px 40px' },
  bottomCard:{ background:'#0f0f1c', border:'1px solid rgba(255,255,255,0.05)', borderRadius:12, padding:'16px' },
  cardHdr:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  cardTitle: { fontSize:14, fontWeight:700, color:'#fff', fontFamily:"'Syne',sans-serif" },
  viewAll:   { fontSize:10, color:'rgba(255,255,255,0.3)', cursor:'pointer' },
  thumbGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5 },
  thumb:     { borderRadius:7, height:64, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', cursor:'pointer' },
  thumbPlay: { width:20, height:20, background:'rgba(0,0,0,0.6)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:7, color:'#fff' },
  thumbViews:{ position:'absolute', bottom:4, left:4, fontSize:8, color:'rgba(255,255,255,0.7)', fontWeight:600 },
  testi:     { marginBottom:12, paddingBottom:12, borderBottom:'1px solid rgba(255,255,255,0.04)' },
  testiTop:  { display:'flex', alignItems:'center', gap:7, marginBottom:5 },
  testiAv:   { width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#fff', flexShrink:0 },
  testiName: { fontSize:11, fontWeight:600, color:'#fff' },
  testiCheck:{ fontSize:10, color:'#60a5fa' },
  testiStars:{ fontSize:10, color:'#FFB300', marginLeft:'auto' },
  testiTxt:  { fontSize:11, color:'rgba(255,255,255,0.32)', lineHeight:1.5 },
  // FOOTER CTA
  ctaSec:    { background:'linear-gradient(135deg,rgba(255,46,170,0.06),rgba(139,47,201,0.06))', borderTop:'1px solid rgba(255,255,255,0.05)', padding:'48px 32px', textAlign:'center' },
  ctaH:      { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:32, color:'#fff', marginBottom:6, letterSpacing:'-1px' },
  ctaSub:    { fontSize:13, color:'rgba(255,255,255,0.3)', marginBottom:24 },
  ctaBtn:    { background:'linear-gradient(135deg,#FF2EAA,#8B2FC9)', color:'#fff', border:'none', padding:'12px 32px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8 },
  foot:      { background:'#070710', borderTop:'1px solid rgba(255,255,255,0.04)', padding:'14px 32px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  footTxt:   { fontSize:10, color:'rgba(255,255,255,0.18)' },
};

export default function Landing() {
  const nav = useNavigate();
  const [activeStyle, setActiveStyle] = useState(0);

  return (
    <div style={S.page}>
      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.navLogo}>
          Mashup<span style={{color:'#FF2EAA'}}>Studio</span>
          <span style={S.navBeta}>BETA</span>
        </div>
        <div style={S.navLinks}>
          {['Features','How it works','Examples','Pricing','FAQ'].map(l=>(
            <a key={l} href="#" style={S.navLink}>{l}</a>
          ))}
        </div>
        <div style={S.navRight}>
          <button onClick={()=>nav('/signin')} style={S.btnLogin}>Login</button>
          <button onClick={()=>nav('/studio')} style={S.btnStart}>Get Started Free</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={S.hero}>
        <div style={S.heroL}>
          <div style={S.eyebrow}>
            <span style={S.eyeDot}/>
            ✦ AI-Powered Video Mashups
          </div>
          <h1 style={S.h1}>
            Turn Any Song Into<br/>
            Viral <span style={S.h1pink}>TikTok</span> <span style={S.h1pur}>Mashups</span><br/>
            With AI
          </h1>
          <p style={S.hsub}>Upload your music and avatar, pick a style, and let AI create scroll-stopping TikTok videos in seconds.</p>
          <div style={S.badges}>
            {[['🎵','AI Video Generation'],['✂️','No Editing Skills'],['⚡','Ready in Seconds']].map(([ic,lb])=>(
              <div key={lb} style={S.badge}><span>{ic}</span>{lb}</div>
            ))}
          </div>
          <div style={S.hbtns}>
            <button onClick={()=>nav('/studio')} style={S.btnP}>▶ Create Your First Mashup</button>
            <button style={S.btnSec}>◎ See Examples</button>
          </div>
          <div style={S.proof}>
            <div style={S.proofAvs}>
              {[['#FF2EAA','A'],['#8B2FC9','B'],['#0066FF','C'],['#FF6B00','D']].map(([c,l],i)=>(
                <div key={i} style={{...S.proofAv,background:c,marginLeft:i===0?0:-6}}>{l}</div>
              ))}
            </div>
            <span style={S.stars}>★★★★★</span>
            <span style={S.proofTxt}>50,000+ creators are already viral</span>
          </div>
        </div>

        <div style={S.heroR}>
          <div style={S.musicBubble}>🎵</div>
          <div style={S.tikBubble}>🎵</div>
          <div style={S.phone}>
            <div style={S.pScreen}>
              <div style={S.pTxt}>SI TE<br/>SABES EL<br/>TIKTOK<br/>BAILAI</div>
              <div style={S.pPlay}>▶</div>
            </div>
            <div style={S.pBar}>
              <div style={S.pProg}><div style={S.pFill}/></div>
              <div style={S.pTime}>0:15 / 0:28</div>
            </div>
          </div>
          <div style={S.counter}>
            <div style={S.ctrNum}>🔥 2,341</div>
            <div style={S.ctrLbl}>mashups created<br/>today</div>
          </div>
        </div>
      </section>

      {/* STUDIO WIDGET */}
      <div style={S.studio}>
        <div style={S.studioBox}>
          <div style={S.stHdr}>
            <span style={S.stTitle}>Create your mashup</span>
            <span style={S.stTut}>ⓘ Tutorial</span>
          </div>
          <div style={S.stTabs}>
            {[['1','Upload Music'],['2','Avatar'],['3','Style'],['4','Generate']].map(([n,lb],i)=>(
              <div key={n} style={{...S.stTab,...(i===0?S.stTabOn:{}),borderRight:i<3?'1px solid rgba(255,255,255,0.04)':'none'}}>
                <span style={{...S.tabNum,...(i===0?S.tabNumOn:{})}}>{n}</span>
                {lb}
              </div>
            ))}
          </div>
          <div style={S.stBody}>
            {/* Col 1: Upload music */}
            <div style={S.stCol}>
              <div style={S.stColLbl}>Upload your music</div>
              <div style={S.uploadDz}>
                <div style={S.dzIco}>🎵</div>
                <div style={S.dzTxt}>Drag & drop your audio here<br/>or click to browse<br/>MP3, WAV, M4A (max 50MB)</div>
              </div>
              <div style={S.uploadFile}>
                <div style={S.fileIco}>🎵</div>
                <div>
                  <div style={S.fileName}>Industry Baby.mp3</div>
                  <div style={S.fileWave}>2:45 ━━━━━━━━━━</div>
                </div>
              </div>
            </div>
            {/* Col 2: Avatar */}
            <div style={S.stCol}>
              <div style={S.stColLbl}>Upload your avatar</div>
              <div style={S.avCircle}>🧍</div>
              <div style={S.avHint}>JPG, PNG (max 10MB)</div>
            </div>
            {/* Col 3: Style grid */}
            <div style={S.stColLast}>
              <div style={{...S.stColLbl,display:'flex',justifyContent:'space-between'}}>
                <span>Choose a style</span>
                <span style={{color:'rgba(255,255,255,0.3)',cursor:'pointer'}}>View all</span>
              </div>
              <div style={S.styleGrid}>
                {STYLES.map(([name,grad],i)=>(
                  <div key={name} onClick={()=>setActiveStyle(i)}
                    style={{...S.styleCard,background:grad,outline:activeStyle===i?'1.5px solid #FF2EAA':'1.5px solid transparent'}}>
                    <span style={S.styleLbl}>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button onClick={()=>nav('/studio')} style={S.genBtn}>✦ Generate Mashup Video</button>
        </div>
      </div>

      {/* STATS */}
      <div style={{...S.studioBox,maxWidth:900,margin:'0 auto 0',borderRadius:0,borderLeft:'none',borderRight:'none',borderTop:'none'}}>
        <div style={S.statsBar}>
          {[['🎬','50K+','Videos Created'],['⚡','60s','Average Render'],['📺','4K','Max Resolution'],['🎁','Free','To Start']].map(([ic,n,l])=>(
            <div key={l} style={S.stat}>
              <span style={S.statIco}>{ic}</span>
              <div><div style={S.statNum}>{n}</div><div style={S.statLbl}>{l}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={S.howSec}>
        <div style={S.secEye}>How It Works</div>
        <div style={S.secH}>4 Simple Steps to Go Viral</div>
        <div style={S.stepsRow}>
          {STEPS.map(([name,desc],i)=>(
            <React.Fragment key={name}>
              <div style={S.step}>
                <div style={S.stepNum}>{i+1}</div>
                <div>
                  <div style={S.stepName}>{name}</div>
                  <div style={S.stepDesc}>{desc}</div>
                </div>
              </div>
              {i<3 && <div style={S.stepArrow}>›</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* TRENDING + TESTIMONIALS */}
      <div style={S.bottomGrid}>
        <div style={S.bottomCard}>
          <div style={S.cardHdr}>
            <span style={S.cardTitle}>Trending Mashups</span>
            <span style={S.viewAll}>View all</span>
          </div>
          <div style={S.thumbGrid}>
            {TRENDING.map((g,i)=>(
              <div key={i} style={{...S.thumb,background:g}}>
                <div style={S.thumbPlay}>▶</div>
                <div style={S.thumbViews}>▶ {[128,93,77,64][i]}K</div>
              </div>
            ))}
          </div>
        </div>
        <div style={S.bottomCard}>
          <div style={S.cardHdr}><span style={S.cardTitle}>Loved by Creators</span></div>
          {TESTIMONIALS.map((t,i)=>(
            <div key={t.handle} style={{...S.testi,borderBottom:i<2?'1px solid rgba(255,255,255,0.04)':'none',paddingBottom:i<2?10:0,marginBottom:i<2?10:0}}>
              <div style={S.testiTop}>
                <div style={{...S.testiAv,background:t.color}}>{t.letter}</div>
                <span style={S.testiName}>{t.handle}</span>
                <span style={S.testiCheck}>✓</span>
                <span style={S.testiStars}>★★★★★</span>
              </div>
              <div style={S.testiTxt}>{t.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER CTA */}
      <div style={S.ctaSec}>
        <div style={S.ctaH}>Ready to create your viral mashup?</div>
        <div style={S.ctaSub}>Join thousands of creators who are already going viral.</div>
        <button onClick={()=>nav('/studio')} style={S.ctaBtn}>Start Creating for Free →</button>
      </div>

      <footer style={S.foot}>
        <span style={S.footTxt}>© 2025 MashupStudio. All rights reserved.</span>
        <div style={{display:'flex',gap:16}}>
          {['Privacy','Terms','Help'].map(l=>(
            <a key={l} href="#" style={{...S.footTxt,textDecoration:'none'}}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}