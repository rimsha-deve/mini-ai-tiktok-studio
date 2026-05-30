import React from 'react';

const EFFECTS = [
  { key:'snowfall',        label:'❄️ Snowfall',         desc:'Animated snowflakes across the video',   default:true  },
  { key:'enhancement_4k',  label:'✦ 4K Enhancement',    desc:'Sharpen & clarity boost for crisp output', default:true  },
  { key:'glow_particles',  label:'✨ Glow Particles',    desc:'Floating light particles overlay',         default:false },
  { key:'soft_blur_glow',  label:'🌟 Soft Blur Glow',   desc:'Background bloom / soft light effect',     default:false },
  { key:'vhs_effect',      label:'📼 VHS Effect',        desc:'Retro scanline & static overlay',          default:false },
  { key:'chromatic_glow',  label:'🌈 Chromatic Glow',   desc:'Color aberration split effect',            default:false },
  { key:'grain',           label:'🎞 Film Grain',        desc:'Cinematic grain texture overlay',          default:false },
];

const S = {
  wrap:    { display:'flex', flexDirection:'column', gap:12 },
  topRow:  { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 },
  secLbl:  { fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.35)' },
  badge:   { fontSize:10, color:'#FF2EAA', background:'rgba(255,46,170,0.1)', border:'1px solid rgba(255,46,170,0.2)', padding:'2px 8px', borderRadius:20, fontWeight:600 },
  card:    { background:'#111120', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, overflow:'hidden' },
  row:     { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  rowLast: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px' },
  info:    { flex:1 },
  rowName: { fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.85)', marginBottom:2 },
  rowDesc: { fontSize:11, color:'rgba(255,255,255,0.28)' },
  sw:      { width:38, height:21, borderRadius:11, cursor:'pointer', border:'none', position:'relative', flexShrink:0, transition:'background 0.2s' },
  swOff:   { background:'rgba(255,255,255,0.1)' },
  swOn:    { background:'linear-gradient(135deg,#FF2EAA,#8B2FC9)' },
  knob:    { position:'absolute', top:2.5, width:16, height:16, background:'#fff', borderRadius:'50%', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' },
  // Snow slider
  snowCard:{ background:'#111120', border:'1px solid rgba(255,46,170,0.15)', borderRadius:10, padding:'12px 14px' },
  slRow:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  slName:  { fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.7)' },
  slVal:   { fontSize:12, fontWeight:700, color:'#FF2EAA' },
  slHints: { display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(255,255,255,0.2)', marginTop:5 },
  // tip box
  tip:     { background:'rgba(255,46,170,0.04)', border:'1px solid rgba(255,46,170,0.1)', borderRadius:10, padding:'12px 14px' },
  tipTitle:{ fontSize:12, fontWeight:600, color:'#FF2EAA', marginBottom:5 },
  tipTxt:  { fontSize:11, color:'rgba(255,255,255,0.35)', lineHeight:1.6 },
};

function Toggle({ label, desc, value, onChange, last }) {
  return (
    <div style={last ? S.rowLast : S.row}>
      <div style={S.info}>
        <div style={S.rowName}>{label}</div>
        <div style={S.rowDesc}>{desc}</div>
      </div>
      <button style={{ ...S.sw, ...(value ? S.swOn : S.swOff) }} onClick={() => onChange(!value)}>
        <div style={{ ...S.knob, left: value ? 20 : 3 }} />
      </button>
    </div>
  );
}

export default function EffectsTab({ config, setConfig }) {
  const upd = (k, v) => setConfig(p => ({ ...p, effects: { ...p.effects, [k]: v } }));
  const activeCount = EFFECTS.filter(e => config.effects?.[e.key]).length;

  return (
    <div style={S.wrap}>
      <div style={S.topRow}>
        <span style={S.secLbl}>Visual Effects</span>
        <span style={S.badge}>{activeCount} active</span>
      </div>

      <div style={S.card}>
        {EFFECTS.map((e, i) => (
          <Toggle key={e.key} label={e.label} desc={e.desc}
            value={!!config.effects?.[e.key]}
            onChange={v => upd(e.key, v)}
            last={i === EFFECTS.length - 1} />
        ))}
      </div>

      {config.effects?.snowfall && (
        <div style={S.snowCard}>
          <div style={S.slRow}>
            <span style={S.slName}>❄️ Snow Density</span>
            <span style={S.slVal}>{config.effects.snowfall_speed}%</span>
          </div>
          <input type="range" min={10} max={100}
            value={config.effects.snowfall_speed ?? 40}
            onChange={e => upd('snowfall_speed', +e.target.value)}
            style={{ width:'100%', accentColor:'#FF2EAA' }} />
          <div style={S.slHints}><span>Light (10%)</span><span>Heavy (100%)</span></div>
        </div>
      )}

      <div style={S.tip}>
        <div style={S.tipTitle}>💡 Best Combo</div>
        <div style={S.tipTxt}>Snow + 4K Enhancement gives the most popular TikTok look. VHS and Film Grain add artistic flair but increase render time slightly.</div>
      </div>
    </div>
  );
}