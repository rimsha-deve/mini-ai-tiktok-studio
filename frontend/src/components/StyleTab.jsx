import React, { useState } from 'react';

// Engine constants (must match video_engine.py)
const TX_X = 960;   // default text X on 1920 canvas
const TX_Y = 0;     // default text Y (engine centers vertically)
const AV_X = 0;     // default avatar X
const AV_Y = 0;     // default avatar Y
const STEP = 40;    // px per arrow click on 1920x1080 canvas

const FONTS = [
  { name:'Anton',      preview:'ANTON',      style:{ fontFamily:'Impact,sans-serif', fontWeight:900, letterSpacing:'1px' } },
  { name:'Impact',     preview:'IMPACT',     style:{ fontFamily:'Impact,sans-serif' } },
  { name:'Bebas Neue', preview:'BEBAS NEUE', style:{ fontFamily:'Impact,sans-serif', letterSpacing:'4px' } },
  { name:'Bangers',    preview:'BANGERS',    style:{ fontFamily:'Impact,sans-serif', letterSpacing:'3px' } },
  { name:'Oswald',     preview:'Oswald',     style:{ fontFamily:'Arial Narrow,sans-serif', fontWeight:700 } },
  { name:'Montserrat', preview:'Montserrat', style:{ fontFamily:'Arial,sans-serif', fontWeight:800 } },
  { name:'Righteous',  preview:'Righteous',  style:{ fontFamily:'Arial,sans-serif', fontStyle:'italic', fontWeight:700 } },
  { name:'Pacifico',   preview:'Pacifico',   style:{ fontFamily:'cursive' } },
];

const PRESETS = [
  { id:'mashup-style',   label:'Mashup', grad:'linear-gradient(135deg,#ff2eaa,#ff6b00)' },
  { id:'tiktok-neon',    label:'Neon',   grad:'linear-gradient(135deg,#8b2fc9,#ff2eaa)' },
  { id:'snow-aesthetic', label:'Snow',   grad:'linear-gradient(135deg,#1a3a6b,#4a90d9)' },
  { id:'dark-mood',      label:'Dark',   grad:'linear-gradient(135deg,#1a0533,#3d0066)' },
  { id:'anime-glow',     label:'Anime',  grad:'linear-gradient(135deg,#ff2eaa,#00cfff)' },
  { id:'glow',           label:'Glow',   grad:'linear-gradient(135deg,#8b2fc9,#00b4a0)' },
];

const TEXT_COLORS = [
  '#FFFFFF','#FFE000','#00CFFF','#FF2EAA','#00FF88','#FF3C00',
  '#B388FF','#FFB300','#FF4081','#40C4FF','#69F0AE','#FFEA00',
  '#FF6D00','#E040FB','#00E5FF','#76FF03',
];

const S = {
  wrap:       { display:'flex', flexDirection:'column', gap:14 },
  sec:        { fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.35)', marginBottom:8, display:'block' },
  sep:        { border:'none', borderTop:'1px solid rgba(255,255,255,0.06)', margin:'4px 0' },
  presetGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 },
  presetCard: { background:'#111120', border:'1px solid rgba(255,255,255,0.06)', borderRadius:9, padding:'6px', cursor:'pointer', textAlign:'center', transition:'all 0.15s' },
  presetOn:   { border:'1px solid rgba(255,46,170,0.5)', background:'rgba(255,46,170,0.06)' },
  swatch:     { height:30, borderRadius:6, marginBottom:5 },
  presetName: { fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.55)' },
  presetNameOn:{ fontSize:11, fontWeight:600, color:'#FF2EAA' },
  textarea:   { width:'100%', background:'#111120', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'9px 12px', fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'rgba(255,255,255,0.85)', outline:'none', resize:'vertical', lineHeight:1.5, boxSizing:'border-box' },
  fontGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 },
  fontBtn:    { background:'#111120', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'9px 10px', cursor:'pointer', transition:'all 0.15s', textAlign:'center' },
  fontBtnOn:  { border:'1px solid rgba(255,46,170,0.4)', background:'rgba(255,46,170,0.06)' },
  colorGrid:  { display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:5, marginBottom:10 },
  cdot:       { width:24, height:24, borderRadius:6, border:'2px solid transparent', cursor:'pointer', transition:'transform 0.15s' },
  cdotOn:     { border:'2px solid #fff', transform:'scale(1.2)' },
  colorRow:   { display:'flex', gap:8, alignItems:'center' },
  colorSwatch:{ width:32, height:32, borderRadius:7, border:'1px solid rgba(255,255,255,0.15)', cursor:'pointer', flexShrink:0, position:'relative', overflow:'hidden' },
  colorInput: { position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%' },
  hexInput:   { flex:1, background:'#111120', border:'1px solid rgba(255,255,255,0.08)', borderRadius:7, padding:'6px 10px', fontFamily:'monospace', fontSize:12, color:'rgba(255,255,255,0.7)', outline:'none' },
  alignGroup: { display:'flex', gap:5 },
  alignBtn:   { flex:1, background:'#111120', border:'1px solid rgba(255,255,255,0.06)', borderRadius:7, padding:'7px', fontSize:12, cursor:'pointer', textAlign:'center', transition:'all 0.15s', color:'rgba(255,255,255,0.45)' },
  alignBtnOn: { background:'rgba(255,46,170,0.08)', border:'1px solid rgba(255,46,170,0.35)', color:'#FF2EAA', fontWeight:600 },
  // Layout card
  layoutCard: { background:'#111120', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'14px' },
  layoutBlock:{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:8, padding:'12px', marginBottom:10 },
  blockHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  blockLabel: { fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.35)' },
  // Arrow pad
  padWrap:    { display:'flex', alignItems:'center', gap:20 },
  arrowPad:   { display:'grid', gridTemplateColumns:'repeat(3,36px)', gridTemplateRows:'repeat(3,36px)', gap:4 },
  arrowBtn:   { width:36, height:36, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, cursor:'pointer', transition:'all 0.15s', userSelect:'none', color:'rgba(255,255,255,0.7)' },
  arrowHov:   { background:'rgba(255,46,170,0.18)', border:'1px solid rgba(255,46,170,0.4)', color:'#FF2EAA' },
  arrowCtr:   { background:'rgba(255,46,170,0.05)', border:'1px solid rgba(255,46,170,0.2)', cursor:'pointer', color:'rgba(255,46,170,0.7)', fontSize:14 },
  arrowBlank: { background:'transparent', border:'1px solid transparent', cursor:'default' },
  posPanel:   { flex:1 },
  posRow:     { display:'flex', gap:8, marginBottom:8 },
  posChip:    { display:'flex', flexDirection:'column', alignItems:'center', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, padding:'6px 12px', minWidth:64 },
  posAxis:    { fontSize:9, color:'rgba(255,255,255,0.25)', marginBottom:2 },
  posVal:     { fontSize:13, fontWeight:700, color:'#FF2EAA', fontFamily:'monospace' },
  posDefault: { fontSize:9, color:'rgba(255,255,255,0.2)', marginTop:2 },
  stepRow:    { display:'flex', alignItems:'center', gap:8 },
  stepLabel:  { fontSize:10, color:'rgba(255,255,255,0.3)' },
  stepBtns:   { display:'flex', gap:4 },
  stepBtn:    { fontSize:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:5, padding:'3px 8px', cursor:'pointer', color:'rgba(255,255,255,0.4)' },
  stepBtnOn:  { background:'rgba(255,46,170,0.1)', border:'1px solid rgba(255,46,170,0.25)', color:'#FF2EAA' },
  // Sliders
  slWrap:     { display:'flex', flexDirection:'column', gap:12 },
  slRow:      { display:'flex', flexDirection:'column', gap:5 },
  slHead:     { display:'flex', justifyContent:'space-between' },
  slName:     { fontSize:11, color:'rgba(255,255,255,0.5)' },
  slVal:      { fontSize:11, fontWeight:700, color:'#FF2EAA' },
  slHints:    { display:'flex', justifyContent:'space-between', fontSize:9, color:'rgba(255,255,255,0.2)', marginTop:2 },
  resetBtn:   { width:'100%', padding:'8px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:7, fontSize:11, color:'rgba(255,255,255,0.3)', cursor:'pointer', marginTop:6 },
};

function ArrowPad({ label, icon, x, y, defaultX, defaultY, onX, onY, step, setStep }) {
  const [hov, setHov] = useState(null);
  const isDefault = x === defaultX && y === defaultY;

  const AB = (dir, onClick, children) => (
    <div style={{ ...S.arrowBtn, ...(hov === dir ? S.arrowHov : {}) }}
      onMouseEnter={() => setHov(dir)} onMouseLeave={() => setHov(null)}
      onMouseDown={() => onClick()}>
      {children}
    </div>
  );

  return (
    <div style={S.layoutBlock}>
      <div style={S.blockHeader}>
        <span style={S.blockLabel}>{icon} {label}</span>
        <button style={{ ...S.resetBtn, width:'auto', padding:'3px 10px', fontSize:9, marginTop:0, opacity: isDefault ? 0.3 : 1 }}
          onClick={() => { onX(defaultX); onY(defaultY); }}>
          ↺ Reset
        </button>
      </div>

      <div style={S.padWrap}>
        {/* Arrow pad */}
        <div style={S.arrowPad}>
          <div style={S.arrowBlank} />
          {AB('up',    () => onY(y - step), '↑')}
          <div style={S.arrowBlank} />
          {AB('left',  () => onX(x - step), '←')}
          <div style={{ ...S.arrowBtn, ...S.arrowCtr }}
            onMouseEnter={() => setHov('c')} onMouseLeave={() => setHov(null)}
            onClick={() => { onX(defaultX); onY(defaultY); }}
            title="Reset to default">⊙</div>
          {AB('right', () => onX(x + step), '→')}
          <div style={S.arrowBlank} />
          {AB('down',  () => onY(y + step), '↓')}
          <div style={S.arrowBlank} />
        </div>

        {/* Position display */}
        <div style={S.posPanel}>
          <div style={S.posRow}>
            <div style={S.posChip}>
              <span style={S.posAxis}>X</span>
              <span style={S.posVal}>{x}</span>
              <span style={S.posDefault}>def: {defaultX}</span>
            </div>
            <div style={S.posChip}>
              <span style={S.posAxis}>Y</span>
              <span style={S.posVal}>{y}</span>
              <span style={S.posDefault}>def: {defaultY}</span>
            </div>
          </div>
          <div style={S.stepRow}>
            <span style={S.stepLabel}>Step:</span>
            <div style={S.stepBtns}>
              {[10,30,60,120].map(s => (
                <button key={s} style={{ ...S.stepBtn, ...(step === s ? S.stepBtnOn : {}) }}
                  onClick={() => setStep(s)}>{s}px</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StyleTab({ config, setConfig }) {
  const [textStep,   setTextStep]   = useState(40);
  const [avatarStep, setAvatarStep] = useState(40);

  const updT = (k, v) => setConfig(p => ({ ...p, text:   { ...p.text,   [k]: v } }));
  const updL = (k, v) => setConfig(p => ({ ...p, layout: { ...p.layout, [k]: v } }));

  const layout = config.layout || {};
  // 0 means "use engine default" — show that as the default in the pad
  const textX   = layout.text_x   ?? 0;   // 0 → engine uses TX_X=960
  const textY   = layout.text_y   ?? 0;   // 0 → engine centers vertically
  const avatarX = layout.avatar_x >= 0 ? layout.avatar_x : -1; // -1 → engine default
  const avatarY = layout.avatar_y ?? 0;

  return (
    <div style={S.wrap}>

      {/* Style Presets */}
      <div>
        <span style={S.sec}>Style Preset</span>
        <div style={S.presetGrid}>
          {PRESETS.map(pr => (
            <div key={pr.id}
              style={{ ...S.presetCard, ...(config.preset === pr.id ? S.presetOn : {}) }}
              onClick={() => setConfig(p => ({ ...p, preset: pr.id }))}>
              <div style={{ ...S.swatch, background: pr.grad }} />
              <span style={config.preset === pr.id ? S.presetNameOn : S.presetName}>{pr.label}</span>
            </div>
          ))}
        </div>
      </div>

      <hr style={S.sep} />

      {/* Overlay Text */}
      <div>
        <span style={S.sec}>Overlay Text</span>
        <textarea style={S.textarea} rows={3}
          value={config.text?.text ?? ''}
          onChange={e => updT('text', e.target.value)}
          placeholder="SI TE SABES EL TIKTOK BAILAI" />
      </div>

      {/* Font */}
      <div>
        <span style={S.sec}>Font Family</span>
        <div style={S.fontGrid}>
          {FONTS.map(f => (
            <div key={f.name}
              style={{ ...S.fontBtn, ...(config.text?.font === f.name ? S.fontBtnOn : {}) }}
              onClick={() => updT('font', f.name)}>
              <div style={{ fontSize:13, color: config.text?.font === f.name ? '#FF2EAA' : 'rgba(255,255,255,0.7)', ...f.style, marginBottom:2 }}>
                {f.preview}
              </div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)' }}>{f.name}</div>
            </div>
          ))}
        </div>
      </div>

      <hr style={S.sep} />

      {/* Text Color */}
      <div>
        <span style={S.sec}>Text Color</span>
        <div style={S.colorGrid}>
          {TEXT_COLORS.map(c => (
            <div key={c}
              style={{ ...S.cdot, background: c, ...(config.text?.color === c ? S.cdotOn : {}) }}
              onClick={() => updT('color', c)} />
          ))}
        </div>
        <div style={S.colorRow}>
          <div style={{ ...S.colorSwatch, background: config.text?.color || '#fff' }}>
            <input type="color" style={S.colorInput}
              value={config.text?.color || '#FFFFFF'}
              onChange={e => updT('color', e.target.value)} />
          </div>
          <input style={S.hexInput}
            value={config.text?.color || '#FFFFFF'}
            onChange={e => updT('color', e.target.value)} />
        </div>
      </div>

      {/* Text Alignment */}
      <div>
        <span style={S.sec}>Text Alignment</span>
        <div style={S.alignGroup}>
          {[['left','⬅ Left'],['center','↔ Center'],['right','➡ Right']].map(([a,l]) => (
            <div key={a}
              style={{ ...S.alignBtn, ...((config.text?.align || 'left') === a ? S.alignBtnOn : {}) }}
              onClick={() => updT('align', a)}>{l}</div>
          ))}
        </div>
      </div>

      <hr style={S.sep} />

      {/* Layout & Position */}
      <div>
        <span style={S.sec}>Layout & Position</span>
        <div style={S.layoutCard}>

          {/* Text arrow pad — default 0,0 means engine uses TX_X=960 */}
          <ArrowPad
            label="Text Position" icon="✍️"
            x={textX}   y={textY}
            defaultX={0} defaultY={0}
            onX={v => updL('text_x', v)}
            onY={v => updL('text_y', v)}
            step={textStep} setStep={setTextStep}
          />

          {/* Avatar arrow pad — default -1,0 means engine uses AV_X=-30 */}
          <ArrowPad
            label="Avatar Position" icon="👤"
            x={avatarX >= 0 ? avatarX : 0} y={avatarY}
            defaultX={0} defaultY={0}
            onX={v => updL('avatar_x', v)}
            onY={v => updL('avatar_y', v)}
            step={avatarStep} setStep={setAvatarStep}
          />

          {/* Fine tune sliders */}
          <div style={S.layoutBlock}>
            <div style={S.blockLabel}>🔧 Fine Tune</div>
            <div style={S.slWrap}>

              <div style={S.slRow}>
                <div style={S.slHead}>
                  <span style={S.slName}>Font Size</span>
                  <span style={S.slVal}>{config.text?.font_size || 0}{config.text?.font_size ? 'px' : ' (Auto)'}</span>
                </div>
                <input type="range" min={0} max={300} value={config.text?.font_size || 0}
                  onChange={e => updT('font_size', +e.target.value)}
                  style={{ width:'100%', accentColor:'#FF2EAA' }} />
                <div style={S.slHints}><span>0 = Auto</span><span>300px</span></div>
              </div>

              <div style={S.slRow}>
                <div style={S.slHead}>
                  <span style={S.slName}>Avatar Scale</span>
                  <span style={S.slVal}>{(layout.avatar_scale ?? 1.0).toFixed(2)}x</span>
                </div>
                <input type="range" min={0.3} max={2.5} step={0.01}
                  value={layout.avatar_scale ?? 1.0}
                  onChange={e => updL('avatar_scale', +e.target.value)}
                  style={{ width:'100%', accentColor:'#FF2EAA' }} />
                <div style={S.slHints}><span>0.3x small</span><span>1.0x default</span><span>2.5x large</span></div>
              </div>

              <div style={S.slRow}>
                <div style={S.slHead}>
                  <span style={S.slName}>Logo Size</span>
                  <span style={S.slVal}>{layout.logo_size || 0}{layout.logo_size ? 'px' : ' (Auto)'}</span>
                </div>
                <input type="range" min={0} max={500}
                  value={layout.logo_size || 0}
                  onChange={e => updL('logo_size', +e.target.value)}
                  style={{ width:'100%', accentColor:'#FF2EAA' }} />
                <div style={S.slHints}><span>0 = Auto</span><span>500px max</span></div>
              </div>

            </div>
          </div>

          <button style={S.resetBtn}
            onClick={() => setConfig(p => ({ ...p,
              text:   { ...p.text, font_size: 0 },
              layout: { avatar_x:-1, avatar_y:0, avatar_scale:1.0, text_x:0, text_y:0, text_y_offset:0, logo_x:0, logo_y:0, logo_size:0 }
            }))}>
            ↺ Reset All to Defaults
          </button>
        </div>
      </div>

    </div>
  );
}