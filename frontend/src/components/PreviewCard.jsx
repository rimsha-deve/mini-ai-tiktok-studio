import React, { useEffect, useRef, useState } from 'react';

// Engine constants — must match video_engine.py EXACTLY
const ENGINE = {
  W: 1920, H: 1080,
  TX_X: 960,
  AV_X: -30,
  AV_Y: 0,
  FONT_SIZE: 255,
  LOGO_H: 220,
};

const FONT_MAP = {
  'Anton':         { gUrl:'Anton',               canvas:'"Anton",Impact,sans-serif',           weight:400 },
  'Impact':        { gUrl:null,                   canvas:'Impact,"Arial Narrow",sans-serif',    weight:400 },
  'Arial':         { gUrl:null,                   canvas:'Arial,Helvetica,sans-serif',           weight:800 },
  'Bebas Neue':    { gUrl:'Bebas+Neue',           canvas:'"Bebas Neue",Impact,sans-serif',       weight:400 },
  'Bangers':       { gUrl:'Bangers',              canvas:'"Bangers",Impact,sans-serif',          weight:400 },
  'Oswald':        { gUrl:'Oswald:wght@700',      canvas:'"Oswald","Arial Narrow",sans-serif',  weight:700 },
  'Montserrat':    { gUrl:'Montserrat:wght@900',  canvas:'"Montserrat",Arial,sans-serif',       weight:900 },
  'Righteous':     { gUrl:'Righteous',            canvas:'"Righteous",Arial,sans-serif',        weight:400 },
  'Pacifico':      { gUrl:'Pacifico',             canvas:'"Pacifico",cursive',                  weight:400 },
  'Prohibition':   { gUrl:null,                   canvas:'Impact,"Arial Narrow",sans-serif',    weight:900 },
  'Black Ops One': { gUrl:'Black+Ops+One',        canvas:'"Black Ops One",Impact,sans-serif',   weight:400 },
};

const loaded = new Set();
function ensureFont(name) {
  const f = FONT_MAP[name];
  if (!f?.gUrl || loaded.has(name)) return;
  loaded.add(name);
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${f.gUrl}&display=swap`;
  document.head.appendChild(l);
}

// Mirrors _stack_lines() in video_engine.py EXACTLY
function stackLines(text) {
  const t = (text || '').trim();
  if (t.includes('\n')) return t.split('\n').map(l => l.trim().toUpperCase()).filter(Boolean);
  const words = t.toUpperCase().trim().split(/\s+/).filter(Boolean);
  const n = words.length;
  if (n === 6) return [`${words[0]} ${words[1]}`, `${words[2]} ${words[3]}`, words[4], words[5]];
  const lines = [];
  for (let i = 0; i < n;) {
    if (i + 1 < n) { lines.push(`${words[i]} ${words[i+1]}`); i += 2; }
    else { lines.push(words[i]); i++; }
  }
  return lines;
}

// Real TikTok logo PNG — embedded directly from assets/stickers/tiktok_logo.png
const TIKTOK_LOGO_SRC = 'data:image/png;base64,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';
const PREVIEW_TIKTOK_LOGO_SRC = '/tiktok_sticker.png?v=real-logo';
let _logoImg = null;
let _logoReady = false;
const _logoReadyListeners = new Set();
function getTikTokLogoImg() {
  if (_logoImg) return _logoImg;
  _logoImg = new Image();
  _logoImg.onload = () => {
    _logoReady = true;
    _logoReadyListeners.forEach((listener) => listener());
  };
  _logoImg.src = PREVIEW_TIKTOK_LOGO_SRC;
  return _logoImg;
}
// Pre-load immediately
getTikTokLogoImg();

function drawTikTokLogo(ctx, x, y, height) {
  const img = getTikTokLogoImg();
  if (!img || !_logoReady) return;
  const width = height * (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
  ctx.drawImage(img, x, y, width, height);
}

function getTrimmedImageSource(img) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0);
  const data = x.getImageData(0, 0, c.width, c.height).data;
  let minX = c.width, minY = c.height, maxX = -1, maxY = -1;
  for (let py = 0; py < c.height; py++) {
    for (let px = 0; px < c.width; px++) {
      const i = (py * c.width + px) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Ignore fully white/light-grey pixels to better match Python's rembg trimming
      const isWhiteOrGrey = (r > 230 && g > 230 && b > 230);

      if (a > 12 && !isWhiteOrGrey) {
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
      }
    }
  }
  if (maxX < minX || maxY < minY) {
    return { sx:0, sy:0, sw:c.width, sh:c.height };
  }
  return { sx:minX, sy:minY, sw:maxX - minX + 1, sh:maxY - minY + 1 };
}

// Snow preview renderers
function drawSnowPreview(ctx, type, CW, CH) {
  const rng = (() => { let s = type==='pink_snow'?42:type==='snow_dust'?99:7; return ()=>{ s=(s*1664525+1013904223)&0xFFFFFFFF; return (s>>>0)/0xFFFFFFFF; }; })();
  if (type === 'pink_snow') {
    for (let i=0;i<26;i++){const x=rng()*CW,y=rng()*CH,r=1.2+rng()*3.5,a=0.35+rng()*0.5;const pink=rng()>0.5;const col=pink?`rgba(255,${Math.floor(100+rng()*80)},${Math.floor(150+rng()*80)},${a})`:`rgba(255,255,255,${a})`;const grd=ctx.createRadialGradient(x,y,0,x,y,r*2.5);grd.addColorStop(0,col);grd.addColorStop(1,'rgba(255,120,180,0)');ctx.beginPath();ctx.fillStyle=grd;ctx.arc(x,y,r*2.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.fillStyle=col;ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  } else if (type === 'snow_dust') {
    for (let i=0;i<55;i++){const x=rng()*CW,y=rng()*CH,r=0.5+rng()*1.8,a=0.25+rng()*0.6;ctx.beginPath();ctx.fillStyle=`rgba(255,255,255,${a})`;ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  } else {
    for (let i=0;i<18;i++){const x=rng()*CW,y=rng()*CH,r=2.0+rng()*4.5,a=0.4+rng()*0.45;const bl=Math.floor(210+rng()*45);const col=`rgba(200,230,${bl},${a})`;const grd=ctx.createRadialGradient(x,y,0,x,y,r*3);grd.addColorStop(0,`rgba(200,230,${bl},${a*0.5})`);grd.addColorStop(1,'rgba(100,150,255,0)');ctx.beginPath();ctx.fillStyle=grd;ctx.arc(x,y,r*3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.fillStyle=col;ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  }
}

export default function PreviewCard({ config, avatarFile }) {
  const canvasRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [logoReady, setLogoReady] = useState(_logoReady);

  const configKey = JSON.stringify({
    text:config.text, gradient_colors:config.gradient_colors,
    effects:config.effects, layout:config.layout, preset:config.preset,
  });

  useEffect(() => { ensureFont(config.text?.font || 'Anton'); }, [config.text?.font]);

  useEffect(() => {
    if (_logoReady) {
      setLogoReady(true);
      return undefined;
    }
    const markReady = () => setLogoReady(true);
    _logoReadyListeners.add(markReady);
    getTikTokLogoImg();
    return () => _logoReadyListeners.delete(markReady);
  }, []);

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
    const bg = ctx.createLinearGradient(0,0,CW,CH);
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
    const layout      = config.layout || {};
    const userScale   = layout.avatar_scale ?? 1.0;
    // Engine caps avatar to fit within canvas height when bottom-anchored
    // If scale > 1: avatar would go above canvas → cap to 1.0 to match engine behavior
    // Use actual scale — canvas clips anything outside bounds naturally
    const effectiveScale = userScale;
    const engAX = (layout.avatar_x >= 0) ? layout.avatar_x : ENGINE.AV_X;
    const engAY = layout.avatar_y ?? 0;
    const engTXoff = (layout.text_x !== 0) ? layout.text_x : ENGINE.TX_X;
    const engTYoff = (layout.text_y ?? 0) + (layout.text_y_offset ?? 0);

    // ── Text ─────────────────────────────────────────────────────
    const drawText = (avatarRightEdge) => {
      const txt      = config.text?.text   || 'SI TE SABES EL TIKTOK BAILAI';
      const color    = config.text?.color  || '#FFFFFF';
      const align    = config.text?.align  || 'left';
      const fsUser   = config.text?.font_size || 0;
      const fontName = config.text?.font   || 'Anton';
      const fi       = FONT_MAP[fontName]  || FONT_MAP['Anton'];

      const lines  = stackLines(txt);
      const engFS  = fsUser > 0 ? fsUser : ENGINE.FONT_SIZE;
      let fitFS    = engFS * SY;

      // Auto-adjust text start X to be right of avatar (mirrors engine logic)
      let textStartX = engTXoff * SX;
      if (layout.text_x === 0 && avatarRightEdge > 0) {
        textStartX = Math.max(ENGINE.TX_X * SX, avatarRightEdge + 4);
      }

      const maxH = CH * 0.96;
      const maxW = Math.max(16, CW - textStartX - 3);
      while (fitFS > 6) {
        ctx.font = `${fi.weight} ${fitFS}px ${fi.canvas}`;
        const fitGap = fitFS * 0.08;
        const blockH = lines.length * fitFS + fitGap * (lines.length - 1);
        const maxLineW = Math.max(...lines.map(line => ctx.measureText(line).width));
        if (blockH <= maxH && maxLineW <= maxW) break;
        fitFS -= 0.75;
      }
      
      const fitGap  = fitFS * 0.08;
      ctx.font = `${fi.weight} ${fitFS}px ${fi.canvas}`;
      ctx.textBaseline = 'top'; // Prevents text from shifting upwards

      let tx;
      if (align === 'center')     { ctx.textAlign='center'; tx = textStartX + (CW - textStartX)/2; }
      else if (align === 'right') { ctx.textAlign='right';  tx = CW - 4; }
      else                        { ctx.textAlign='left';   tx = textStartX; }

      const blockH  = lines.length * fitFS + fitGap * (lines.length - 1);
      const total   = blockH;
      const baseY   = (CH - total) / 2;
      const blockY  = Math.max(2, baseY + engTYoff * SY);

      // Draw text lines
      lines.forEach((line, i) => {
        const ty = blockY + i * (fitFS + fitGap);
        ctx.strokeStyle='rgba(0,0,0,0.95)'; ctx.lineWidth=Math.max(2, fitFS*0.06);
        ctx.strokeText(line, tx, ty);
        ctx.fillStyle=color; ctx.fillText(line, tx, ty);
      });

    };

    const drawLogo = () => {
      const logoH = ((layout.logo_size || 0) > 0 ? layout.logo_size : ENGINE.LOGO_H) * SY;
      const logoW = logoH;
      const lx = Math.max(0, Math.min(CW - logoW, (ENGINE.W * 0.36 + (layout.logo_x || 0)) * SX));
      const ly = Math.max(0, Math.min(CH - logoH, (ENGINE.H * 0.19 + (layout.logo_y || 0)) * SY));
      drawTikTokLogo(ctx, lx, ly, logoH);
    };

    // ── Avatar — bottom-anchored, mirrors engine exactly ─────────
    const drawAvatar = (imgEl) => {
      // Engine: AV_H = 1080, avatar scaled to full canvas height × scale
      // Bottom-anchored: dy = CH - baseH + engAY*SY
      // Scale > 1.0: top of avatar clips above canvas (same as engine)
      const source = imgEl ? getTrimmedImageSource(imgEl) : null;
      const baseH  = CH * effectiveScale;
      const baseW  = source ? baseH * (source.sw / source.sh) * 1.12 : CH * 0.48;
      const dx = (engAX === ENGINE.AV_X) ? Math.max(-(baseW * 0.05), engAX * SX) : engAX * SX;
      const dy = Math.max(-baseH / 4, CH - baseH + engAY * SY);  // bottom-anchor with engine clamp
      const rightEdge = dx + baseW;

      if (imgEl && source) {
        ctx.drawImage(imgEl, source.sx, source.sy, source.sw, source.sh, dx, dy, baseW, baseH);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(0, 0, CW * 0.45, CH);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Avatar', CW * 0.225, CH * 0.5);
      }
      return rightEdge;
    };

    const doRender = (imgEl) => {
      const rightEdge = drawAvatar(imgEl);
      drawLogo();
      drawText(rightEdge);
    };

    if (avatarUrl) {
      const img = new Image();
      document.fonts.ready.then(() => {
        img.onload = () => doRender(img);
        if (img.complete && img.naturalWidth > 0) doRender(img);
      });
      img.src = avatarUrl;
    } else {
      document.fonts.ready.then(() => doRender(null));
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, avatarUrl, logoReady]);

  return (
    <div style={{ borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', position:'relative' }}>
      <canvas ref={canvasRef} width={280} height={157} style={{ display:'block', width:'100%' }} />
      <div style={{ position:'absolute', bottom:5, right:5, fontSize:9, fontWeight:600, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', padding:'2px 5px', borderRadius:3, color:'rgba(255,255,255,0.5)' }}>
        Live Preview · 16:9
      </div>
    </div>
  );
}