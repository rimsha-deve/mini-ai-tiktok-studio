import React, { useState } from 'react';

const BG_MUSIC = [
  { id:'none',      label:'None',      icon:'🔇', desc:'No background music' },
  { id:'hiphop',    label:'Hip-Hop',   icon:'🎤', desc:'Trap beat, 808s' },
  { id:'pop',       label:'Pop',       icon:'🎵', desc:'Upbeat pop vibes' },
  { id:'reggaeton', label:'Reggaeton', icon:'🔥', desc:'Latin rhythm' },
  { id:'lofi',      label:'Lo-Fi',     icon:'🎧', desc:'Chill lo-fi beats' },
  { id:'edm',       label:'EDM',       icon:'⚡', desc:'Electronic drop' },
];

const QUALITIES = [
  { id:'low',   label:'Low',    sub:'Fast render' },
  { id:'medium',label:'Medium', sub:'Balanced' },
  { id:'high',  label:'High',   sub:'Default' },
  { id:'ultra', label:'Ultra',  sub:'4K quality' },
];

const S = {
  wrap:    { display:'flex', flexDirection:'column', gap:14 },
  secLbl:  { fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.35)', marginBottom:8, display:'block' },
  // music grid
  musicGrid:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 },
  musicCard:{ background:'#111120', border:'1px solid rgba(255,255,255,0.06)', borderRadius:9, padding:'10px 8px', textAlign:'center', cursor:'pointer', transition:'all 0.15s' },
  musicCardOn:{ background:'rgba(255,46,170,0.08)', border:'1px solid rgba(255,46,170,0.3)' },
  musicIco: { fontSize:20, marginBottom:5, display:'block' },
  musicName:{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.8)', display:'block', marginBottom:2 },
  musicDesc:{ fontSize:10, color:'rgba(255,255,255,0.28)', display:'block' },
  musicNameOn:{ color:'#FF2EAA' },
  // slider card
  slCard:  { background:'#111120', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'12px 14px' },
  slRow:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  slName:  { fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.7)' },
  slVal:   { fontSize:12, fontWeight:700, color:'#FF2EAA' },
  slHints: { display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(255,255,255,0.2)', marginTop:5 },
  // sep
  sep:     { border:'none', borderTop:'1px solid rgba(255,255,255,0.06)', margin:'2px 0' },
  // beat info
  beatCard:{ background:'rgba(139,47,201,0.06)', border:'1px solid rgba(139,47,201,0.15)', borderRadius:10, padding:'12px 14px' },
  beatTitle:{ fontSize:12, fontWeight:700, color:'#a855f7', marginBottom:8, display:'flex', alignItems:'center', gap:6 },
  beatList:{ display:'flex', flexDirection:'column', gap:5 },
  beatItem:{ fontSize:11, color:'rgba(255,255,255,0.35)', display:'flex', alignItems:'center', gap:6 },
  // quality
  qGrid:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5 },
  qCard:   { background:'#111120', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'8px 6px', textAlign:'center', cursor:'pointer', transition:'all 0.15s' },
  qCardOn: { background:'rgba(255,46,170,0.08)', border:'1px solid rgba(255,46,170,0.3)' },
  qLabel:  { fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', display:'block', marginBottom:2 },
  qLabelOn:{ color:'#FF2EAA' },
  qSub:    { fontSize:9, color:'rgba(255,255,255,0.25)', display:'block' },
};

export default function AudioTab({ config, setConfig, audioFile, setAudioFile, avatarFile, setAvatarFile }) {
  const updA = (k, v) => setConfig(p => ({ ...p, audio: { ...p.audio, [k]: v } }));
  const updE = (k, v) => setConfig(p => ({ ...p, export: { ...p.export, [k]: v } }));
  const [selMusic, setSelMusic] = useState('none');

  return (
    <div style={S.wrap}>

      {/* Video Avatar (animated) */}
      <div>
        <span style={S.secLbl}>🎬 Video Avatar (Animated)</span>
        <div style={{ border:'1.5px dashed rgba(255,255,255,0.1)', borderRadius:9, padding:'16px 12px', textAlign:'center', background:'rgba(255,255,255,0.02)', cursor:'pointer', position:'relative' }}
          onClick={() => document.getElementById('vid-avatar-input').click()}>
          <input id="vid-avatar-input" type="file" accept="video/*" style={{ display:'none' }}
            onChange={e => e.target.files[0] && setAvatarFile(e.target.files[0])} />
          <div style={{ fontSize:22, marginBottom:6 }}>
            {avatarFile?.type?.startsWith('video') ? '✅' : '🎬'}
          </div>
          <div style={{ fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.6)', marginBottom:3 }}>
            {avatarFile?.type?.startsWith('video') ? avatarFile.name : 'Drop video avatar here'}
          </div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>MP4 WebM MOV — animated avatar</div>
        </div>
      </div>

      <hr style={S.sep} />

      {/* Background Music */}
      <div>
        <span style={S.secLbl}>🎶 Background Music</span>
        <div style={S.musicGrid}>
          {BG_MUSIC.map(m => (
            <div key={m.id}
              style={{ ...S.musicCard, ...(selMusic === m.id ? S.musicCardOn : {}) }}
              onClick={() => { setSelMusic(m.id); updA('background_music_preset', m.id === 'none' ? null : m.id); }}>
              <span style={S.musicIco}>{m.icon}</span>
              <span style={{ ...S.musicName, ...(selMusic === m.id ? S.musicNameOn : {}) }}>{m.label}</span>
              <span style={S.musicDesc}>{m.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {selMusic !== 'none' && (
        <div style={S.slCard}>
          <div style={S.slRow}>
            <span style={S.slName}>🔊 BG Music Volume</span>
            <span style={S.slVal}>{config.audio?.background_music_volume ?? -20.8} dB</span>
          </div>
          <input type="range" min={-40} max={0} step={0.5}
            value={config.audio?.background_music_volume ?? -20.8}
            onChange={e => updA('background_music_volume', +e.target.value)}
            style={{ width:'100%', accentColor:'#FF2EAA' }} />
          <div style={S.slHints}><span>-40 dB quiet</span><span>0 dB loud</span></div>
        </div>
      )}

      <hr style={S.sep} />

      {/* Audio Speed */}
      <div>
        <span style={S.secLbl}>⏩ Audio Speed</span>
        <div style={S.slCard}>
          <div style={S.slRow}>
            <span style={S.slName}>Playback Speed</span>
            <span style={S.slVal}>{config.audio?.speed ?? 1.18}x</span>
          </div>
          <input type="range" min={0.5} max={2.0} step={0.01}
            value={config.audio?.speed ?? 1.18}
            onChange={e => updA('speed', +e.target.value)}
            style={{ width:'100%', accentColor:'#FF2EAA' }} />
          <div style={S.slHints}><span>0.5x slow</span><span>1.18x TikTok default</span><span>2.0x fast</span></div>
        </div>
      </div>

      <hr style={S.sep} />

      {/* Beat Analysis */}
      <div style={S.beatCard}>
        <div style={S.beatTitle}><span>🎵</span> Beat Analysis — Auto</div>
        <div style={S.beatList}>
          {[
            '🔍 Detects BPM every 10 seconds',
            '🔈 Quiet sections → boosted louder',
            '🔊 Loud sections → compressed softer',
            '🎵 Song changes detected automatically',
            '🎸 Bass boost on high-energy parts',
            '✨ Final limiter prevents clipping',
          ].map(t => (
            <div key={t} style={S.beatItem}>{t}</div>
          ))}
        </div>
      </div>

      <hr style={S.sep} />

      {/* Export Quality */}
      <div>
        <span style={S.secLbl}>🎬 Export Quality</span>
        <div style={S.qGrid}>
          {QUALITIES.map(q => (
            <div key={q.id}
              style={{ ...S.qCard, ...(config.export?.quality === q.id ? S.qCardOn : {}) }}
              onClick={() => updE('quality', q.id)}>
              <span style={{ ...S.qLabel, ...(config.export?.quality === q.id ? S.qLabelOn : {}) }}>{q.label}</span>
              <span style={S.qSub}>{q.sub}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}