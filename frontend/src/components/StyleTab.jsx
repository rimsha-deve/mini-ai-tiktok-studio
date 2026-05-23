import React, { useState, useRef } from 'react';

const FONTS = [
  { name: 'Anton',        style: { fontFamily: 'Impact, sans-serif', fontWeight: 900 } },
  { name: 'Impact',       style: { fontFamily: 'Impact, sans-serif' } },
  { name: 'Bangers',      style: { fontFamily: 'Impact, sans-serif', letterSpacing: '2px' } },
  { name: 'Black Ops One',style: { fontFamily: 'Impact, sans-serif', fontWeight: 900 } },
  { name: 'Righteous',    style: { fontFamily: 'Arial, sans-serif', fontStyle: 'italic' } },
  { name: 'Pacifico',     style: { fontFamily: 'cursive' } },
  { name: 'Oswald',       style: { fontFamily: 'Arial Narrow, sans-serif', fontWeight: 700 } },
  { name: 'Montserrat',   style: { fontFamily: 'Arial, sans-serif', fontWeight: 800 } },
  { name: 'Bebas Neue',   style: { fontFamily: 'Impact, sans-serif', letterSpacing: '3px' } },
  { name: 'Prohibition',  style: { fontFamily: 'Impact, sans-serif', letterSpacing: '4px' } },
  { name: 'Jumper',       style: { fontFamily: 'Impact, sans-serif', fontStyle: 'italic', fontWeight: 900 } },
  { name: 'YWFT Backs',   style: { fontFamily: 'Impact, sans-serif', fontWeight: 900 } },
];

const PRESETS = [
  { id: 'mashup-style', label: 'Mashup',  grad: 'linear-gradient(135deg,#ff2eaa,#ff6b00)' },
  { id: 'tiktok-neon',  label: 'Neon',    grad: 'linear-gradient(135deg,#8b2fc9,#ff2eaa)' },
  { id: 'snow-aesthetic',label:'Snow',    grad: 'linear-gradient(135deg,#1a3a6b,#4a90d9)' },
  { id: 'dark-mood',    label: 'Dark',    grad: 'linear-gradient(135deg,#1a0533,#3d0066)' },
  { id: 'anime-glow',   label: 'Anime',   grad: 'linear-gradient(135deg,#ff2eaa,#00cfff)' },
  { id: 'glow',         label: 'Glow',    grad: 'linear-gradient(135deg,#8b2fc9,#00b4a0)' },
];

const TEXT_COLORS = [
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#FFE000', name: 'Yellow' },
  { hex: '#00CFFF', name: 'Cyan' },
  { hex: '#FF2EAA', name: 'Pink' },
  { hex: '#00FF88', name: 'Green' },
  { hex: '#FF3C00', name: 'Orange' },
  { hex: '#B388FF', name: 'Lavender' },
  { hex: '#FFB300', name: 'Gold' },
];

const glass = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };

// ── Drag-to-position canvas ──────────────────────────────────────────────────
function PositionCanvas({ config, setConfig }) {
  const canvasRef = useRef(null);
  const [dragging, setDragging] = useState(null); // 'avatar' | 'text'

  // Canvas is 320x180 (16:9 preview), maps to 1920x1080
  const CW = 320, CH = 180;
  const scaleX = 1920 / CW, scaleY = 1080 / CH;

  const layout = config.layout || { avatar_x: -1, text_x: 0, text_y: 0, logo_x: 0, logo_y: 0 };

  const avatarX = (config.layout?.avatar_x >= 0 ? config.layout.avatar_x : -30) * sx;
  const avatarYOff = (config.layout?.avatar_y || 0) * sy;
  const textCX   = (config.layout?.text_x || 960) * sx;
  const textYOff = (config.layout?.text_y_offset || 0) * sy;
  const logoCX   = (config.layout?.logo_x > 0 ? config.layout.logo_x : 960) * sx;
  const logoCY   = (config.layout?.logo_y > 0 ? config.layout.logo_y : 349) * sy;

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(CW, e.clientX - rect.left)),
      y: Math.max(0, Math.min(CH, e.clientY - rect.top)),
    };
  };

  const onMouseDown = (e) => {
    const { x, y } = getPos(e);
    // Check if clicking near avatar handle (left side)
    if (Math.abs(x - avatarCX - 30) < 30 && Math.abs(y - CH/2) < 50) {
      setDragging('avatar');
    } else if (Math.abs(x - logoCX) < 25 && Math.abs(y - logoCY) < 25) {
      setDragging('logo');
    } else if (Math.abs(x - textCX) < 40 && Math.abs(y - textCY) < 40) {
      setDragging('text');
    }
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    const { x, y } = getPos(e);
    if (dragging === 'avatar') {
      setConfig(p => ({ ...p, layout: { ...p.layout, avatar_x: Math.round(x * scaleX - 30) } }));
    } else if (dragging === 'logo') {
      setConfig(p => ({ ...p, layout: { ...p.layout,
        logo_x: Math.round(x * scaleX),
        logo_y: Math.round(y * scaleY),
      }}));
    } else if (dragging === 'text') {
      setConfig(p => ({ ...p, layout: { ...p.layout,
        text_x: Math.round(x * scaleX),
        text_y: Math.round(y * scaleY),
      }}));
    }
  };

  const onMouseUp = () => setDragging(null);

  return (
    <div>
      <p className="text-xs uppercase tracking-widest mb-2 font-medium"
         style={{ color: 'rgba(255,255,255,0.4)' }}>
        Position (drag to move)
      </p>
      <div className="relative rounded-2xl overflow-hidden cursor-crosshair select-none"
           style={{ width: CW, height: CH,
                    background: 'linear-gradient(135deg,#1a0533,#24243e)',
                    border: '1px solid rgba(255,255,255,0.15)' }}
           ref={canvasRef}
           onMouseDown={onMouseDown}
           onMouseMove={onMouseMove}
           onMouseUp={onMouseUp}
           onMouseLeave={onMouseUp}>

        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                      backgroundSize: '32px 18px' }} />

        {/* Center line */}
        <div className="absolute top-0 bottom-0 pointer-events-none"
             style={{ left: CW/2, width: 1, background: 'rgba(255,255,255,0.2)' }} />

        {/* Avatar handle */}
        <div className="absolute flex items-center justify-center rounded-lg text-xs font-bold cursor-grab active:cursor-grabbing"
             style={{ left: avatarCX, top: CH/2 - 20, width: 60, height: 40,
                      background: 'rgba(255,46,170,0.4)', border: '2px solid #ff2eaa',
                      transform: 'translateX(-50%)' }}>
          👤
        </div>

        {/* Logo handle */}
        <div className="absolute flex items-center justify-center rounded-full text-xs font-bold cursor-grab active:cursor-grabbing"
             style={{ left: logoCX, top: logoCY, width: 28, height: 28,
                      background: 'rgba(0,207,255,0.4)', border: '2px solid #00cfff',
                      transform: 'translate(-50%,-50%)' }}>
          ♪
        </div>

        {/* Text handle */}
        <div className="absolute flex items-center justify-center rounded-lg text-xs font-bold cursor-grab active:cursor-grabbing"
             style={{ left: textCX, top: textCY, width: 50, height: 30,
                      background: 'rgba(139,47,201,0.4)', border: '2px solid #8b2fc9',
                      transform: 'translate(-50%,-50%)' }}>
          T
        </div>

        {/* Labels */}
        <div className="absolute bottom-1 left-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Drag 👤 or T to reposition
        </div>
      </div>

      {/* Reset button */}
      <button onClick={() => setConfig(p => ({ ...p, layout: { avatar_x: -1, text_x: 0, text_y: 0, logo_x: 0, logo_y: 0 } }))}
        className="mt-2 text-xs px-3 py-1.5 rounded-lg transition-all"
        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
                 border: '1px solid rgba(255,255,255,0.1)' }}>
        ↺ Reset positions
      </button>
      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
        👤 Avatar &nbsp;|&nbsp; T Text &nbsp;|&nbsp; ♪ Logo
      </p>
    </div>
  );
}

// ── Main StyleTab ────────────────────────────────────────────────────────────
export default function StyleTab({ config, setConfig }) {
  const updateText = (k, v) => setConfig(p => ({ ...p, text: { ...p.text, [k]: v } }));
  const fontSize = config.text.font_size || 0;

  return (
    <div className="space-y-5">

      {/* Presets */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-3 font-medium"
           style={{ color: 'rgba(255,255,255,0.4)' }}>Style Preset</p>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map(pr => (
            <button key={pr.id} onClick={() => setConfig(p => ({ ...p, preset: pr.id }))}
              className="relative rounded-2xl py-3 text-xs font-bold overflow-hidden transition-all"
              style={{ background: pr.grad,
                       border: config.preset === pr.id ? '2px solid white' : '2px solid transparent',
                       boxShadow: config.preset === pr.id ? '0 0 20px rgba(255,255,255,0.2)' : 'none' }}>
              {pr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay Text */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-2 font-medium"
           style={{ color: 'rgba(255,255,255,0.4)' }}>Overlay Text</p>
        <input type="text" value={config.text.text}
          onChange={e => updateText('text', e.target.value)}
          className="w-full rounded-2xl px-4 py-3 text-sm focus:outline-none transition-all"
          style={{ ...glass, color: 'white' }} />
      </div>

      {/* Font Picker */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-2 font-medium"
           style={{ color: 'rgba(255,255,255,0.4)' }}>Font</p>
        <div className="rounded-2xl overflow-hidden" style={glass}>
          <div className="max-h-48 overflow-y-auto">
            {FONTS.map(f => (
              <button key={f.name} onClick={() => updateText('font', f.name)}
                className="w-full flex items-center justify-between px-4 py-2.5 transition-all text-left"
                style={config.text.font === f.name
                  ? { background: 'linear-gradient(135deg,rgba(255,46,170,0.25),rgba(139,47,201,0.25))',
                      borderLeft: '3px solid #ff2eaa' }
                  : { borderLeft: '3px solid transparent' }}>
                <span style={{ ...f.style, fontSize: '16px', color: 'white' }}>{f.name}</span>
                {config.text.font === f.name && (
                  <span className="text-xs" style={{ color: '#ff2eaa' }}>✓ Selected</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Font Size */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-2 font-medium"
           style={{ color: 'rgba(255,255,255,0.4)' }}>Font Size</p>
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white font-medium">
              {fontSize === 0 ? 'Auto (fills screen)' : `${fontSize}px`}
            </span>
            <button onClick={() => updateText('font_size', 0)}
              className="text-xs px-2 py-0.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              Auto
            </button>
          </div>
          <input type="range" min={0} max={300} step={5}
            value={fontSize}
            onChange={e => updateText('font_size', +e.target.value)}
            className="w-full" style={{ accentColor: '#ff2eaa' }} />
          <div className="flex justify-between text-xs mt-1"
               style={{ color: 'rgba(255,255,255,0.3)' }}>
            <span>Auto</span><span>100px</span><span>200px</span><span>300px</span>
          </div>
        </div>
      </div>

      {/* Text Color */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-2 font-medium"
           style={{ color: 'rgba(255,255,255,0.4)' }}>Text Color</p>
        <div className="rounded-2xl p-4 space-y-3" style={glass}>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer relative">
              <div className="w-12 h-12 rounded-xl border-2 border-white/20 hover:border-white/50 transition-all"
                   style={{ backgroundColor: config.text.color || '#FFFFFF' }} />
              <input type="color" value={config.text.color || '#FFFFFF'}
                onChange={e => updateText('color', e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            </label>
            <div>
              <p className="text-sm font-mono font-bold">{config.text.color || '#FFFFFF'}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Click to open picker</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {TEXT_COLORS.map(c => (
              <button key={c.hex} onClick={() => updateText('color', c.hex)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={config.text.color === c.hex
                  ? { background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.5)', color: 'white' }
                  : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: c.hex }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Text Alignment */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-2 font-medium"
           style={{ color: 'rgba(255,255,255,0.4)' }}>Text Alignment</p>
        <div className="flex gap-2">
          {[['left','⬅ Left'],['center','↔ Center'],['right','➡ Right']].map(([v,l]) => (
            <button key={v} onClick={() => updateText('align', v)}
              className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
              style={config.text.align === v || (!config.text.align && v === 'left')
                ? { background: 'linear-gradient(135deg,rgba(255,46,170,0.3),rgba(139,47,201,0.3))',
                    border: '1px solid rgba(255,46,170,0.5)', color: 'white' }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Outro Settings */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-2 font-medium"
           style={{ color: 'rgba(255,255,255,0.4)' }}>Outro Screen (last 60s)</p>
        <div className="rounded-2xl p-4 space-y-3" style={glass}>
          <div>
            <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Outro Text</p>
            <input type="text"
              value={config.outro?.text || 'Sígueme para ver más'}
              onChange={e => setConfig(p => ({ ...p, outro: { ...p.outro, text: e.target.value } }))}
              className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Text Color</p>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer relative">
                  <div className="w-8 h-8 rounded-lg border border-white/20"
                       style={{ backgroundColor: config.outro?.color || '#FFFFFF' }} />
                  <input type="color" value={config.outro?.color || '#FFFFFF'}
                    onChange={e => setConfig(p => ({ ...p, outro: { ...p.outro, color: e.target.value } }))}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </label>
                <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {config.outro?.color || '#FFFFFF'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Font</p>
              <select value={config.outro?.font || 'Anton'}
                onChange={e => setConfig(p => ({ ...p, outro: { ...p.outro, font: e.target.value } }))}
                className="w-full rounded-xl px-2 py-2 text-xs focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                {['Anton','Impact','Bangers','Righteous','Pacifico'].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Alignment</p>
            <div className="flex gap-2">
              {[['left','Left'],['center','Center'],['right','Right']].map(([v,l]) => (
                <button key={v}
                  onClick={() => setConfig(p => ({ ...p, outro: { ...p.outro, align: v } }))}
                  className="flex-1 py-1.5 rounded-lg text-xs transition-all"
                  style={(config.outro?.align || 'center') === v
                    ? { background: 'rgba(255,46,170,0.3)', border: '1px solid rgba(255,46,170,0.5)', color: 'white' }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── POSITION & SIZE — numbered, clear sections ── */}
      <div>
        <p className="text-xs uppercase tracking-widest mb-3 font-medium"
           style={{ color: 'rgba(255,255,255,0.4)' }}>Position & Size</p>

        {/* 1. TEXT SIZE */}
        <div className="rounded-2xl p-4 mb-3" style={glass}>
          <p className="text-xs font-bold mb-3" style={{ color: '#ff2eaa' }}>① TEXT SIZE</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setConfig(p => ({ ...p, text: { ...p.text, font_size: Math.max(0, (p.text?.font_size||200) - 10) } }))}
              className="w-10 h-10 rounded-xl text-xl font-bold flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,46,170,0.2)', border: '1px solid rgba(255,46,170,0.4)', color: '#ff2eaa' }}>−</button>
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-white">
                {config.text?.font_size > 0 ? `${config.text.font_size}px` : 'Auto'}
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>0 = fills screen automatically</p>
            </div>
            <button onClick={() => setConfig(p => ({ ...p, text: { ...p.text, font_size: Math.min(350, (p.text?.font_size||200) + 10) } }))}
              className="w-10 h-10 rounded-xl text-xl font-bold flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,46,170,0.2)', border: '1px solid rgba(255,46,170,0.4)', color: '#ff2eaa' }}>+</button>
          </div>
          <input type="range" min={0} max={350} step={5}
            value={config.text?.font_size || 0}
            onChange={e => setConfig(p => ({ ...p, text: { ...p.text, font_size: +e.target.value } }))}
            className="w-full mt-2" style={{ accentColor: '#ff2eaa' }} />
        </div>

        {/* 2. AVATAR SIZE */}
        <div className="rounded-2xl p-4 mb-3" style={glass}>
          <p className="text-xs font-bold mb-3" style={{ color: '#8b2fc9' }}>② AVATAR SIZE</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setConfig(p => ({ ...p, layout: { ...p.layout, avatar_scale: Math.max(0.5, ((p.layout?.avatar_scale||1.0) - 0.05)) } }))}
              className="w-10 h-10 rounded-xl text-xl font-bold flex items-center justify-center shrink-0"
              style={{ background: 'rgba(139,47,201,0.2)', border: '1px solid rgba(139,47,201,0.4)', color: '#8b2fc9' }}>−</button>
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-white">
                {Math.round((config.layout?.avatar_scale || 1.0) * 100)}%
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>100% = default full height</p>
            </div>
            <button onClick={() => setConfig(p => ({ ...p, layout: { ...p.layout, avatar_scale: Math.min(1.5, ((p.layout?.avatar_scale||1.0) + 0.05)) } }))}
              className="w-10 h-10 rounded-xl text-xl font-bold flex items-center justify-center shrink-0"
              style={{ background: 'rgba(139,47,201,0.2)', border: '1px solid rgba(139,47,201,0.4)', color: '#8b2fc9' }}>+</button>
          </div>
          <input type="range" min={50} max={150} step={5}
            value={Math.round((config.layout?.avatar_scale || 1.0) * 100)}
            onChange={e => setConfig(p => ({ ...p, layout: { ...p.layout, avatar_scale: +e.target.value / 100 } }))}
            className="w-full mt-2" style={{ accentColor: '#8b2fc9' }} />
        </div>

        {/* 3. TIKTOK LOGO SIZE */}
        <div className="rounded-2xl p-4 mb-3" style={glass}>
          <p className="text-xs font-bold mb-3" style={{ color: '#00cfff' }}>③ TIKTOK LOGO SIZE</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setConfig(p => ({ ...p, layout: { ...p.layout, logo_size: Math.max(60, (p.layout?.logo_size||220) - 10) } }))}
              className="w-10 h-10 rounded-xl text-xl font-bold flex items-center justify-center shrink-0"
              style={{ background: 'rgba(0,207,255,0.2)', border: '1px solid rgba(0,207,255,0.4)', color: '#00cfff' }}>−</button>
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-white">{config.layout?.logo_size || 220}px</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>TikTok logo next to SI TE</p>
            </div>
            <button onClick={() => setConfig(p => ({ ...p, layout: { ...p.layout, logo_size: Math.min(400, (p.layout?.logo_size||220) + 10) } }))}
              className="w-10 h-10 rounded-xl text-xl font-bold flex items-center justify-center shrink-0"
              style={{ background: 'rgba(0,207,255,0.2)', border: '1px solid rgba(0,207,255,0.4)', color: '#00cfff' }}>+</button>
          </div>
          <input type="range" min={60} max={400} step={10}
            value={config.layout?.logo_size || 220}
            onChange={e => setConfig(p => ({ ...p, layout: { ...p.layout, logo_size: +e.target.value } }))}
            className="w-full mt-2" style={{ accentColor: '#00cfff' }} />
        </div>

        {/* 4. TEXT POSITION */}
        <div className="rounded-2xl p-4 mb-3" style={glass}>
          <p className="text-xs font-bold mb-3" style={{ color: '#ff2eaa' }}>④ TEXT POSITION</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>← Left / Right →</span>
                <span className="font-mono text-white">{config.layout?.text_x || 960}px</span>
              </div>
              <input type="range" min={500} max={1400} step={10}
                value={config.layout?.text_x || 960}
                onChange={e => setConfig(p => ({ ...p, layout: { ...p.layout, text_x: +e.target.value } }))}
                className="w-full" style={{ accentColor: '#ff2eaa' }} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>↑ Up / Down ↓</span>
                <span className="font-mono text-white">{config.layout?.text_y_offset || 0}px</span>
              </div>
              <input type="range" min={-300} max={300} step={10}
                value={config.layout?.text_y_offset || 0}
                onChange={e => setConfig(p => ({ ...p, layout: { ...p.layout, text_y_offset: +e.target.value } }))}
                className="w-full" style={{ accentColor: '#ff2eaa' }} />
            </div>
          </div>
        </div>

        {/* 5. AVATAR POSITION */}
        <div className="rounded-2xl p-4 mb-3" style={glass}>
          <p className="text-xs font-bold mb-3" style={{ color: '#8b2fc9' }}>⑤ AVATAR POSITION</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>← Left / Right →</span>
                <span className="font-mono text-white">{config.layout?.avatar_x >= 0 ? config.layout.avatar_x : 'Auto'}px</span>
              </div>
              <input type="range" min={-100} max={600} step={10}
                value={config.layout?.avatar_x >= 0 ? config.layout.avatar_x : -30}
                onChange={e => setConfig(p => ({ ...p, layout: { ...p.layout, avatar_x: +e.target.value } }))}
                className="w-full" style={{ accentColor: '#8b2fc9' }} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>↑ Up / Down ↓</span>
                <span className="font-mono text-white">{config.layout?.avatar_y || 0}px</span>
              </div>
              <input type="range" min={-200} max={200} step={10}
                value={config.layout?.avatar_y || 0}
                onChange={e => setConfig(p => ({ ...p, layout: { ...p.layout, avatar_y: +e.target.value } }))}
                className="w-full" style={{ accentColor: '#8b2fc9' }} />
            </div>
          </div>
        </div>

        {/* Reset All */}
        <button
          onClick={() => setConfig(p => ({ ...p,
            text: { ...p.text, font_size: 0 },
            layout: { avatar_x: -1, avatar_y: 0, avatar_scale: 1.0, text_x: 960, text_y: 0, text_y_offset: 0, logo_x: 0, logo_y: 0, logo_size: 220 }
          }))}
          className="w-full py-2.5 rounded-xl text-xs font-medium transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
                   border: '1px solid rgba(255,255,255,0.1)' }}>
          ↺ Reset All to Default
        </button>
      </div>
    </div>
  );
}
