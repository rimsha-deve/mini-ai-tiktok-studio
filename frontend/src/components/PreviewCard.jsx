import React, { useEffect, useRef, useState } from 'react';

// Must match video_engine.py constants exactly
const ENGINE = {
  W: 1920, H: 1080,
  TX_X: 960,    // default text X — RIGHT half
  AV_X: -30,    // default avatar X — left bleed
  AV_Y: 0,
};

export default function PreviewCard({ config, avatarFile }) {
  const canvasRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

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
    const ctx = canvas.getContext('2d');
    const CW = 280, CH = 157;
    // Scale factors: canvas px per engine px
    const SX = CW / ENGINE.W;
    const SY = CH / ENGINE.H;

    ctx.clearRect(0, 0, CW, CH);

    // ── Background gradient ──────────────────────────────────────
    const gc = config.gradient_colors;
    let c1 = '#FF2EAA', c2 = '#4A0080', c3 = '#0D021A';
    if (gc?.length >= 3) {
      c1 = `rgb(${gc[0][0]},${gc[0][1]},${gc[0][2]})`;
      c2 = `rgb(${gc[1][0]},${gc[1][1]},${gc[1][2]})`;
      c3 = `rgb(${gc[2][0]},${gc[2][1]},${gc[2][2]})`;
    }
    const bg = ctx.createLinearGradient(0, 0, CW, CH);
    bg.addColorStop(0, c1); bg.addColorStop(0.5, c2); bg.addColorStop(1, c3);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CW, CH);

    // ── Snow ──────────────────────────────────────────────────────
    if (config.effects?.snowfall) {
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 0.7;
      for (let i = 0; i < 20; i++) {
        const sx = ((42 * (i * 37 + 11)) % ENGINE.W) * SX;
        const sy = ((42 * (i * 23 + 7)) % ENGINE.H) * SY;
        const sz = 1 + (i % 3) * 0.6;
        for (let a = 0; a < 6; a++) {
          const ang = (a * Math.PI) / 3;
          ctx.beginPath(); ctx.moveTo(sx, sy);
          ctx.lineTo(sx + Math.cos(ang) * sz * 2.5, sy + Math.sin(ang) * sz * 2.5);
          ctx.stroke();
        }
      }
    }

    // ── Layout values — match engine logic exactly ─────────────────
    const layout  = config.layout || {};
    const scale   = layout.avatar_scale ?? 1.0;
    // Avatar: engine uses AV_X=-30 when avatar_x < 0
    const engAvatarX = (layout.avatar_x >= 0) ? layout.avatar_x : ENGINE.AV_X;
    const engAvatarY = layout.avatar_y ?? ENGINE.AV_Y;
    // Text: engine uses TX_X=960 when text_x=0
    const engTextX   = (layout.text_x && layout.text_x !== 0) ? layout.text_x : ENGINE.TX_X;
    const engTextY   = layout.text_y ?? 0;
    const engTextYOff = layout.text_y_offset ?? 0;

    // Convert engine coords → canvas coords
    const avatarCX = engAvatarX * SX;
    const avatarCY = engAvatarY * SY;
    const textCX   = engTextX * SX;
    const textCY   = (engTextY + engTextYOff) * SY;

    // ── Text draw ─────────────────────────────────────────────────
    const drawText = () => {
      const text   = config.text?.text || 'SI TE SABES EL TIKTOK BAILAI';
      const color  = config.text?.color || '#FFFFFF';
      const align  = config.text?.align || 'left';
      const fsEng  = config.text?.font_size || 0;
      const fs     = fsEng ? fsEng * SY * 1.3 : Math.round(CH * 0.135);

      const words  = text.trim().split(/\s+/);
      const lines  = [];
      for (let i = 0; i < words.length; i += 2) lines.push(words.slice(i, i + 2).join(' '));

      ctx.font = `900 ${fs}px Impact,sans-serif`;

      // Map alignment — engine puts text on right half by default
      let tx;
      if (align === 'center') { ctx.textAlign = 'center'; tx = textCX + (CW - textCX) / 2; }
      else if (align === 'right') { ctx.textAlign = 'right'; tx = CW - 4; }
      else { ctx.textAlign = 'left'; tx = textCX; }

      // Vertical center in right-half area
      const totalH = lines.length * fs * 1.15;
      const startY = textCY > 0 ? textCY + fs : (CH - totalH) / 2 + fs;

      lines.forEach((line, i) => {
        const ty = startY + i * (fs * 1.15);
        ctx.strokeStyle = 'rgba(0,0,0,0.95)'; ctx.lineWidth = 3.5;
        ctx.strokeText(line, tx, ty);
        ctx.fillStyle = color;
        ctx.fillText(line, tx, ty);
      });

      // TikTok logo dot (above text area)
      const lx = textCX + (align === 'center' ? (CW - textCX) / 2 : 14);
      const ly = startY - fs * 1.3;
      if (ly > 4) {
        const dotG = ctx.createLinearGradient(lx - 5, ly - 5, lx + 5, ly + 5);
        dotG.addColorStop(0, '#69C9D0'); dotG.addColorStop(1, '#EE1D52');
        ctx.beginPath(); ctx.fillStyle = dotG;
        ctx.arc(lx, ly, CH * 0.045, 0, Math.PI * 2); ctx.fill();
      }
    };

    // ── Avatar draw ───────────────────────────────────────────────
    const drawAvatar = (imgEl) => {
      const baseH = CH * scale;
      const baseW = imgEl ? baseH * (imgEl.width / imgEl.height) : baseH * 0.55;
      const drawX = avatarCX;
      const drawY = CH - baseH + avatarCY;
      if (imgEl) {
        ctx.drawImage(imgEl, drawX, drawY, baseW, baseH);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(drawX, CH * 0.05, baseW * 0.6, CH * 0.95);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Avatar', drawX + baseW * 0.3, CH * 0.55);
      }
    };

    if (avatarUrl) {
      const img = new Image();
      img.onload = () => { drawAvatar(img); drawText(); };
      img.src = avatarUrl;
    } else {
      drawAvatar(null);
      drawText();
    }
  }, [config, avatarUrl]);

  return (
    <div style={{ borderRadius:8, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', position:'relative' }}>
      <canvas ref={canvasRef} width={280} height={157} style={{ display:'block', width:'100%' }} />
      <div style={{ position:'absolute', bottom:5, right:5, fontSize:9, fontWeight:600, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', padding:'2px 5px', borderRadius:3, color:'rgba(255,255,255,0.5)' }}>
        Live Preview · 16:9
      </div>
    </div>
  );
}