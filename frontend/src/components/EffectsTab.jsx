import React from 'react';

const EFFECTS = [
  { key:'enhancement_4k', label:'✦ 4K Enhancement',  desc:'Sharpen & clarity boost for crisp output',   default:true  },
  { key:'glow_particles',  label:'✨ Glow Particles',  desc:'Floating light particles overlay',           default:false },
  { key:'soft_blur_glow',  label:'🌟 Soft Blur Glow', desc:'Background bloom / soft light effect',       default:false },
  { key:'vhs_effect',      label:'📼 VHS Effect',      desc:'Retro scanline & static overlay',            default:false },
  { key:'chromatic_glow',  label:'🌈 Chromatic Glow', desc:'Color aberration split effect',              default:false },
  { key:'grain',           label:'🎞 Film Grain',      desc:'Cinematic grain texture overlay',            default:false },
];

const SNOW_TYPES = [
  {
    key:   'snow_pink',
    label: '🌸 Pink Snow',
    desc:  'Soft pink & white circular particles — romantic aesthetic',
    color: '#FF2EAA',
    preview: 'linear-gradient(135deg,rgba(255,46,170,0.3),rgba(255,150,200,0.2))',
  },
  {
    key:   'snow_dust',
    label: '🤍 Snow Dust',
    desc:  'Tiny dense white powder particles — fine blizzard feel',
    color: '#FFFFFF',
    preview: 'linear-gradient(135deg,rgba(255,255,255,0.15),rgba(200,230,255,0.1))',
  },
  {
    key:   'snow_night',
    label: '💙 Night Snow',
    desc:  'Large blue-white 6-arm hexagonal snowflakes — winter night',
    color: '#60a5fa',
    preview: 'linear-gradient(135deg,rgba(100,150,255,0.3),rgba(150,200,255,0.15))',
  },
];

const S = {
  wrap:     { display:'flex', flexDirection:'column', gap:12 },
  topRow:   { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 },
  secLbl:   { fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.35)' },
  badge:    { fontSize:10, color:'#FF2EAA', background:'rgba(255,46,170,0.1)', border:'1px solid rgba(255,46,170,0.2)', padding:'2px 8px', borderRadius:20, fontWeight:600 },
  sep:      { border:'none', borderTop:'1px solid rgba(255,255,255,0.06)', margin:'2px 0' },
  card:     { background:'#111120', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, overflow:'hidden' },
  row:      { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  rowLast:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px' },
  info:     { flex:1 },
  rowName:  { fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.85)', marginBottom:2 },
  rowDesc:  { fontSize:11, color:'rgba(255,255,255,0.28)' },
  sw:       { width:38, height:21, borderRadius:11, cursor:'pointer', border:'none', position:'relative', flexShrink:0, transition:'background 0.2s' },
  swOff:    { background:'rgba(255,255,255,0.1)' },
  swOn:     { background:'linear-gradient(135deg,#FF2EAA,#8B2FC9)' },
  knob:     { position:'absolute', top:2.5, width:16, height:16, background:'#fff', borderRadius:'50%', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' },
  // Snow master toggle
  snowMaster:{ background:'#111120', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'12px 14px' },
  snowHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:0 },
  snowTitle: { fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)' },
  snowSub:   { fontSize:11, color:'rgba(255,255,255,0.28)', marginTop:2 },
  // Snow type cards
  snowTypes: { display:'flex', flexDirection:'column', gap:6, marginTop:10 },
  snowCard:  { borderRadius:9, padding:'10px 12px', border:'1px solid', cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'space-between' },
  snowCardOn: { borderColor:'rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.04)' },
  snowCardOff:{ borderColor:'rgba(255,255,255,0.05)', background:'rgba(255,255,255,0.01)', opacity:0.5 },
  snowInfo:  { flex:1 },
  snowName:  { fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.8)', marginBottom:2 },
  snowDesc:  { fontSize:10, color:'rgba(255,255,255,0.3)' },
  // Density slider
  slCard:   { background:'#111120', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'12px 14px', marginTop:6 },
  slRow:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  slName:   { fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.7)' },
  slVal:    { fontSize:12, fontWeight:700, color:'#FF2EAA' },
  slHints:  { display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(255,255,255,0.2)', marginTop:5 },
  // tip box
  tip:      { background:'rgba(255,46,170,0.04)', border:'1px solid rgba(255,46,170,0.1)', borderRadius:10, padding:'12px 14px' },
  tipTitle: { fontSize:12, fontWeight:600, color:'#FF2EAA', marginBottom:5 },
  tipTxt:   { fontSize:11, color:'rgba(255,255,255,0.35)', lineHeight:1.6 },
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
  const upd  = (k, v) => setConfig(p => ({ ...p, effects: { ...p.effects, [k]: v } }));
  const fx   = config.effects || {};
  const snowOn = fx.snowfall !== false;
  const activeCount = EFFECTS.filter(e => fx[e.key]).length + (snowOn ? 1 : 0);
  const activeSnowCount = SNOW_TYPES.filter(t => fx[t.key] !== false).length;

  return (
    <div style={S.wrap}>

      {/* Section header */}
      <div style={S.topRow}>
        <span style={S.secLbl}>Visual Effects</span>
        <span style={S.badge}>{activeCount} active</span>
      </div>

      {/* ── SNOW SYSTEM ──────────────────────────────────────────── */}
      <div style={S.snowMaster}>
        <div style={S.snowHeader}>
          <div>
            <div style={S.snowTitle}>❄️ Snow System</div>
            <div style={S.snowSub}>
              {snowOn ? `${activeSnowCount}/3 snow types enabled` : 'Disabled'}
            </div>
          </div>
          <button style={{ ...S.sw, ...(snowOn ? S.swOn : S.swOff) }}
            onClick={() => upd('snowfall', !snowOn)}>
            <div style={{ ...S.knob, left: snowOn ? 20 : 3 }} />
          </button>
        </div>

        {snowOn && (
          <>
            <div style={S.snowTypes}>
              {SNOW_TYPES.map(t => {
                const enabled = fx[t.key] !== false;
                return (
                  <div key={t.key}
                    style={{ ...S.snowCard, ...(enabled ? S.snowCardOn : S.snowCardOff),
                      borderColor: enabled ? t.color + '44' : 'rgba(255,255,255,0.05)',
                      background:  enabled ? t.preview : 'rgba(255,255,255,0.01)',
                    }}
                    onClick={() => upd(t.key, !enabled)}>
                    <div style={S.snowInfo}>
                      <div style={{ ...S.snowName, color: enabled ? t.color : 'rgba(255,255,255,0.4)' }}>
                        {t.label}
                      </div>
                      <div style={S.snowDesc}>{t.desc}</div>
                    </div>
                    <button style={{ ...S.sw, ...(enabled ? { background: t.color } : S.swOff), marginLeft:10 }}
                      onClick={e => { e.stopPropagation(); upd(t.key, !enabled); }}>
                      <div style={{ ...S.knob, left: enabled ? 20 : 3 }} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Snow density slider */}
            <div style={{ marginTop:10 }}>
              <div style={S.slRow}>
                <span style={S.slName}>Snow Density</span>
                <span style={S.slVal}>{fx.snowfall_speed ?? 40}%</span>
              </div>
              <input type="range" min={10} max={120}
                value={fx.snowfall_speed ?? 40}
                onChange={e => upd('snowfall_speed', +e.target.value)}
                style={{ width:'100%', accentColor:'#FF2EAA' }} />
              <div style={S.slHints}><span>Light (10%)</span><span>Default (40%)</span><span>Heavy (120%)</span></div>
            </div>
          </>
        )}
      </div>

      <hr style={S.sep} />

      {/* ── OTHER EFFECTS ─────────────────────────────────────────── */}
      <div style={S.card}>
        {EFFECTS.map((e, i) => (
          <Toggle key={e.key} label={e.label} desc={e.desc}
            value={!!fx[e.key]}
            onChange={v => upd(e.key, v)}
            last={i === EFFECTS.length - 1} />
        ))}
      </div>

      <div style={S.tip}>
        <div style={S.tipTitle}>💡 Best Combos</div>
        <div style={S.tipTxt}>
          <strong style={{color:'#FF2EAA'}}>Romantic:</strong> Pink Snow + 4K Enhancement<br/>
          <strong style={{color:'#60a5fa'}}>Winter Night:</strong> Night Snow + Soft Blur Glow<br/>
          <strong style={{color:'#fff'}}>Full Effect:</strong> All 3 snows + Film Grain
        </div>
      </div>
    </div>
  );
}