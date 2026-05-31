import React, { useEffect, useRef, useState } from 'react';

// ── Engine constants — must match video_engine.py EXACTLY ─────────────────
const ENGINE = {
  W: 1920, H: 1080,
  TX_X: 960,       // default text X
  AV_X: -30,       // default avatar X
  FONT_SIZE: 255,  // default font size (px on 1920x1080)
  LOGO_H: 220,     // TikTok logo height
  TEXT_MAX_W: 920, // max text block width
};

// ── Font map — canvas font strings ────────────────────────────────────────
const FONT_MAP = {
  'Anton':         { google:'Anton',               canvas:'"Anton",Impact,sans-serif',          weight:400 },
  'Impact':        { google:null,                  canvas:'Impact,"Arial Narrow",sans-serif',   weight:400 },
  'Arial':         { google:null,                  canvas:'Arial,Helvetica,sans-serif',          weight:800 },
  'Bebas Neue':    { google:'Bebas+Neue',          canvas:'"Bebas Neue",Impact,sans-serif',      weight:400 },
  'Bangers':       { google:'Bangers',             canvas:'"Bangers",Impact,sans-serif',         weight:400 },
  'Oswald':        { google:'Oswald:wght@700',     canvas:'"Oswald","Arial Narrow",sans-serif',  weight:700 },
  'Montserrat':    { google:'Montserrat:wght@900', canvas:'"Montserrat",Arial,sans-serif',       weight:900 },
  'Righteous':     { google:'Righteous',           canvas:'"Righteous",Arial,sans-serif',        weight:400 },
  'Pacifico':      { google:'Pacifico',            canvas:'"Pacifico",cursive',                  weight:400 },
  'Prohibition':   { google:null,                  canvas:'Impact,"Arial Narrow",sans-serif',    weight:900 },
  'Black Ops One': { google:'Black+Ops+One',       canvas:'"Black Ops One",Impact,sans-serif',   weight:400 },
};

const loadedFonts = new Set();
function ensureFont(name) {
  const info = FONT_MAP[name];
  if (!info?.google || loadedFonts.has(name)) return;
  loadedFonts.add(name);
  const link = document.createElement('link');
  link.rel  = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${info.google}&display=swap`;
  document.head.appendChild(link);
}

// ── Mirrors _stack_lines() in video_engine.py EXACTLY ────────────────────
function stackLines(text) {
  const t = (text || '').trim();
  // Respect manual newlines (user pressed Enter in textarea)
  if (t.includes('\n')) {
    return t.split('\n').map(l => l.trim().toUpperCase()).filter(Boolean);
  }
  // Auto-split 2 words per line
  const words = t.toUpperCase().trim().split(/\s+/).filter(Boolean);
  const n = words.length;
  if (n === 6) {
    return [
      `${words[0]} ${words[1]}`,
      `${words[2]} ${words[3]}`,
      words[4],
      words[5],
    ];
  }
  const lines = [];
  for (let i = 0; i < n;) {
    if (i + 1 < n) { lines.push(`${words[i]} ${words[i+1]}`); i += 2; }
    else            { lines.push(words[i]); i++; }
  }
  return lines;
}

// ── Snow renderers ────────────────────────────────────────────────────────
function drawSnowPreview(ctx, type, CW, CH) {
  const rng = (() => { let s = type==='pink_snow'?42:type==='snow_dust'?99:7; return ()=>{ s=(s*1664525+1013904223)&0xFFFFFFFF; return (s>>>0)/0xFFFFFFFF; }; })();

  if (type === 'pink_snow') {
    for (let i=0; i<26; i++) {
      const x=rng()*CW, y=rng()*CH, r=1.2+rng()*3.5, a=0.35+rng()*0.5;
      const pink=rng()>0.5;
      const col= pink ? `rgba(255,${Math.floor(100+rng()*80)},${Math.floor(150+rng()*80)},${a})` : `rgba(255,255,255,${a})`;
      const grd=ctx.createRadialGradient(x,y,0,x,y,r*2.5);
      grd.addColorStop(0,col); grd.addColorStop(1,'rgba(255,120,180,0)');
      ctx.beginPath(); ctx.fillStyle=grd; ctx.arc(x,y,r*2.5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.fillStyle=col; ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }
  } else if (type === 'snow_dust') {
    for (let i=0; i<55; i++) {
      const x=rng()*CW, y=rng()*CH, r=0.5+rng()*1.8, a=0.25+rng()*0.6;
      ctx.beginPath(); ctx.fillStyle=`rgba(255,255,255,${a})`; ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      if(r>1.2){const g=ctx.createRadialGradient(x,y,0,x,y,r*3);g.addColorStop(0,`rgba(255,255,255,${a*0.4})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.beginPath();ctx.fillStyle=g;ctx.arc(x,y,r*3,0,Math.PI*2);ctx.fill();}
    }
  } else {
    for (let i=0; i<18; i++) {
      const x=rng()*CW, y=rng()*CH, r=2.0+rng()*4.5, a=0.4+rng()*0.45;
      const bl=Math.floor(210+rng()*45);
      const col=`rgba(200,230,${bl},${a})`;
      const grd=ctx.createRadialGradient(x,y,0,x,y,r*3);
      grd.addColorStop(0,`rgba(200,230,${bl},${a*0.5})`); grd.addColorStop(1,'rgba(100,150,255,0)');
      ctx.beginPath(); ctx.fillStyle=grd; ctx.arc(x,y,r*3,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.fillStyle=col; ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=`rgba(220,240,255,${a*0.7})`; ctx.lineWidth=0.6;
      for(let arm=0;arm<6;arm++){const ang=(arm*Math.PI)/3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(ang)*r*2.2,y+Math.sin(ang)*r*2.2);ctx.stroke();}
    }
  }
}

export default function PreviewCard({ config, avatarFile }) {
  const canvasRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Serialize full config for deep-change detection
  const configKey = JSON.stringify({
    text: config.text, gradient_colors: config.gradient_colors,
    effects: config.effects, layout: config.layout, preset: config.preset,
  });

  useEffect(() => { ensureFont(config.text?.font || 'Anton'); }, [config.text?.font]);

  useEffect(() => {
    if (avatarFile?.type?.startsWith('image')) {
      const url = URL.createObjectURL(avatarFile);
      setAvatarUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setAvatarUrl(null);
  }, [avatarFile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx   = canvas.getContext('2d');
    const CW = 280, CH = 157;
    const SX = CW / ENGINE.W;
    const SY = CH / ENGINE.H;

    ctx.clearRect(0, 0, CW, CH);

    // ── Background ──────────────────────────────────────────────
    const gc = config.gradient_colors;
    let c1='#FF2EAA', c2='#4A0080', c3='#0D021A';
    if (gc?.length >= 3) {
      c1=`rgb(${gc[0][0]},${gc[0][1]},${gc[0][2]})`;
      c2=`rgb(${gc[1][0]},${gc[1][1]},${gc[1][2]})`;
      c3=`rgb(${gc[2][0]},${gc[2][1]},${gc[2][2]})`;
    }
    const bg = ctx.createLinearGradient(0, 0, CW, CH);
    bg.addColorStop(0,c1); bg.addColorStop(0.5,c2); bg.addColorStop(1,c3);
    ctx.fillStyle=bg; ctx.fillRect(0,0,CW,CH);

    // ── Snow ─────────────────────────────────────────────────────
    const fx = config.effects || {};
    if (fx.snowfall !== false) {
      if (fx.snow_pink  !== false) drawSnowPreview(ctx,'pink_snow', CW,CH);
      if (fx.snow_dust  !== false) drawSnowPreview(ctx,'snow_dust', CW,CH);
      if (fx.snow_night !== false) drawSnowPreview(ctx,'night_snow',CW,CH);
    }

    // ── Layout ───────────────────────────────────────────────────
    const layout = config.layout || {};
    const scale  = layout.avatar_scale ?? 1.0;
    const engAX  = (layout.avatar_x >= 0) ? layout.avatar_x : ENGINE.AV_X;
    const engAY  = layout.avatar_y ?? 0;
    const engTX  = (layout.text_x !== 0)  ? layout.text_x  : ENGINE.TX_X;
    const engTYoff = (layout.text_y ?? 0) + (layout.text_y_offset ?? 0);

    // ── Text — mirrors engine pixel-perfect ───────────────────────
    const drawText = () => {
      const rawText  = config.text?.text   || 'SI TE SABES EL TIKTOK BAILAI';
      const color    = config.text?.color  || '#FFFFFF';
      const align    = config.text?.align  || 'left';
      const fsUser   = config.text?.font_size || 0;
      const fontName = config.text?.font   || 'Anton';
      const fi       = FONT_MAP[fontName]  || FONT_MAP['Anton'];

      // Use same line-splitting as engine
      const lines  = stackLines(rawText);
      const nLines = lines.length;

      // Scale engine default font size to canvas
      const engFS = fsUser > 0 ? fsUser : ENGINE.FONT_SIZE;
      const fs    = engFS * SY;

      // Scale engine gap (size * 0.08) to canvas
      const gap  = fs * 0.08;

      // Engine default FONT_SIZE=255 with auto-fit tries to fill 96% of H
      // We scale proportionally: if more lines, auto-reduce font slightly
      const totalH = nLines * fs + gap * (nLines - 1);
      const maxH   = CH * 0.96;
      const fitFS  = totalH > maxH ? fs * (maxH / totalH) : fs;
      const fitGap = fitFS * 0.08;

      ctx.font = `${fi.weight} ${fitFS}px ${fi.canvas}`;

      // Block X — mirrors engine TX_X logic
      const blockX = engTX * SX;

      // Block Y — engine centers vertically then applies offset
      const blockH = nLines * fitFS + fitGap * (nLines - 1);
      // Logo space (scaled)
      const logoH  = ENGINE.LOGO_H * SY;
      const totalBlock = logoH + 10*SY + blockH;
      const baseY  = (CH - totalBlock) / 2;
      const blockY = baseY + engTYoff * SY + logoH + 10*SY;

      // Set text align
      let tx;
      if (align === 'center')     { ctx.textAlign='center'; tx = blockX + (CW - blockX)/2; }
      else if (align === 'right') { ctx.textAlign='right';  tx = CW - 4; }
      else                        { ctx.textAlign='left';   tx = blockX; }

      // Draw each line
      lines.forEach((line, i) => {
        const ty = blockY + i * (fitFS + fitGap);
        // Glow
        ctx.shadowColor   = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur    = 8;
        ctx.strokeStyle   = 'rgba(0,0,0,0.95)';
        ctx.lineWidth     = Math.max(2, fitFS * 0.06);
        ctx.strokeText(line, tx, ty);
        ctx.fillStyle     = color;
        ctx.fillText(line, tx, ty);
        ctx.shadowBlur    = 0;
      });

      // TikTok logo dot — positioned above first line
      const lx = align==='center' ? tx : blockX + 12*SX;
      const ly = baseY + logoH * 0.55;
      if (ly > 4 && ly < CH - 4) {
        const dotG = ctx.createLinearGradient(lx-5,ly-5,lx+5,ly+5);
        dotG.addColorStop(0,'#69C9D0'); dotG.addColorStop(1,'#EE1D52');
        ctx.beginPath(); ctx.fillStyle=dotG;
        ctx.arc(lx, ly, Math.max(3, ENGINE.LOGO_H*SY*0.35), 0, Math.PI*2);
        ctx.fill();
      }
    };

    // ── Avatar ───────────────────────────────────────────────────
    const drawAvatar = (imgEl) => {
      const baseH = CH * scale;
      const baseW = imgEl ? baseH*(imgEl.width/imgEl.height) : baseH*0.55;
      const dx    = engAX * SX;
      const dy    = CH - baseH + engAY * SY;
      if (imgEl) {
        ctx.drawImage(imgEl, dx, dy, baseW, baseH);
      } else {
        ctx.fillStyle='rgba(255,255,255,0.04)';
        ctx.fillRect(dx, CH*0.05, baseW*0.6, CH*0.95);
        ctx.fillStyle='rgba(255,255,255,0.1)';
        ctx.font='8px sans-serif'; ctx.textAlign='center';
        ctx.fillText('Avatar', dx+baseW*0.3, CH*0.55);
      }
    };

    if (avatarUrl) {
      const img = new Image();
      // Wait for font to be ready before drawing
      document.fonts.ready.then(() => {
        img.onload = () => { drawAvatar(img); drawText(); };
        if (img.complete) { drawAvatar(img); drawText(); }
        else img.src = avatarUrl;
      });
      img.src = avatarUrl;
    } else {
      document.fonts.ready.then(() => { drawAvatar(null); drawText(); });
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, avatarUrl]);

  return (
    <div style={{ borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', position:'relative' }}>
      <canvas ref={canvasRef} width={280} height={157} style={{ display:'block', width:'100%' }} />
      <div style={{ position:'absolute', bottom:5, right:5, fontSize:9, fontWeight:600, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', padding:'2px 5px', borderRadius:3, color:'rgba(255,255,255,0.5)' }}>
        Live Preview · 16:9
      </div>
    </div>
  );
}