import React, { useEffect, useRef, useState } from 'react';

/**
 * Live Preview Card — shows real-time layout preview
 * Renders a 16:9 canvas (320x180) showing:
 * - Background gradient
 * - Avatar position (if uploaded)
 * - Text position and content
 * - Logo position
 * - Snowflake dots
 */
export default function PreviewCard({ config, avatarFile }) {
  const canvasRef  = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Create object URL for avatar preview
  useEffect(() => {
    if (avatarFile && avatarFile.type?.startsWith('image')) {
      const url = URL.createObjectURL(avatarFile);
      setAvatarUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setAvatarUrl(null);
  }, [avatarFile]);

  // Draw preview on canvas whenever config changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const CW = 320, CH = 180;

    // Scale factors (canvas → real 1920x1080)
    const sx = CW / 1920, sy = CH / 1080;

    // Clear
    ctx.clearRect(0, 0, CW, CH);

    // ── Background gradient ──────────────────────────────────────────────
    const gc = config.gradient_colors;
    let c1 = '#FF2EAA', c2 = '#4A0080', c3 = '#0D021A';
    if (gc && gc.length >= 3) {
      c1 = `rgb(${gc[0][0]},${gc[0][1]},${gc[0][2]})`;
      c2 = `rgb(${gc[1][0]},${gc[1][1]},${gc[1][2]})`;
      c3 = `rgb(${gc[2][0]},${gc[2][1]},${gc[2][2]})`;
    }
    const grad = ctx.createLinearGradient(0, 0, CW, CH);
    grad.addColorStop(0,    c1);
    grad.addColorStop(0.5,  c2);
    grad.addColorStop(1,    c3);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CW, CH);

    // ── Snowflakes ───────────────────────────────────────────────────────
    if (config.effects?.snowfall) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      const seed = 42;
      for (let i = 0; i < 20; i++) {
        const x = ((seed * (i * 37 + 11)) % 1920) * sx;
        const y = ((seed * (i * 23 + 7))  % 1080) * sy;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Avatar ───────────────────────────────────────────────────────────
    const avatarX = (config.layout?.avatar_x >= 0 ? config.layout.avatar_x : -30) * sx;
    const avatarYOff = (config.layout?.avatar_y || 0) * sy;
    const avatarScale = config.layout?.avatar_scale || 1.0;
    if (avatarUrl) {
      const img = new Image();
      img.onload = () => {
        const ah = CH * avatarScale;
        const aw = (img.width / img.height) * ah * 1.12;
        ctx.drawImage(img, avatarX, avatarYOff, aw, ah);
        drawTextAndLogo(ctx, config, CW, CH, sx, sy);
      };
      img.src = avatarUrl;
    } else {
      // Placeholder avatar silhouette
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(avatarX, 0, 80 * sx * 1920/320, CH);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = `${14}px sans-serif`;
      ctx.fillText('👤', avatarX + 20, CH / 2);
    }

    drawTextAndLogo(ctx, config, CW, CH, sx, sy);

  }, [config, avatarUrl]);

  return (
    <div className="relative rounded-2xl overflow-hidden"
         style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
      <canvas ref={canvasRef} width={320} height={180}
              style={{ display: 'block', width: '100%' }} />
      <div className="absolute bottom-1 right-1 text-xs px-1.5 py-0.5 rounded"
           style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.5)' }}>
        Live Preview · 16:9
      </div>
    </div>
  );
}

function drawTextAndLogo(ctx, config, CW, CH, sx, sy) {
  const textX    = (config.layout?.text_x || 960) * sx;
  const textYOff = (config.layout?.text_y_offset || 0) * sy;
  const logoSize = (config.layout?.logo_size || 220) * sy;

  // Text lines
  const lines    = stackText(config.text?.text || 'SI TE SABES EL TIKTOK BAILAI');
  const color    = config.text?.color || '#FFFFFF';

  // Use user font_size if set, otherwise auto
  const userSize = config.text?.font_size || 0;
  const autoSize = Math.min(32, (CH * 0.85) / lines.length * 0.8);
  const fontSize = userSize > 0 ? (userSize * sy * 0.85) : autoSize;

  const lineH  = fontSize * 1.15;
  const totalH = lines.length * lineH;
  const startY = (CH - totalH) / 2 + textYOff;

  // TikTok logo — left of first line
  ctx.font = `bold ${Math.max(8, logoSize * 0.7)}px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('♪', Math.max(0, textX - logoSize * 0.8), startY + fontSize);

  // Text
  ctx.font = `900 ${Math.max(6, fontSize)}px Impact, sans-serif`;
  ctx.fillStyle = color;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(1, fontSize * 0.12);

  lines.forEach((line, i) => {
    const y = startY + i * lineH + fontSize;
    ctx.strokeText(line, textX, y);
    ctx.fillText(line, textX, y);
  });
}

function stackText(text) {
  const words = text.toUpperCase().trim().split(' ');
  const n = words.length;
  if (n === 6) return [
    `${words[0]} ${words[1]}`,
    `${words[2]} ${words[3]}`,
    words[4], words[5],
  ];
  const lines = [];
  for (let i = 0; i < n; i += 2) {
    if (i + 1 < n) lines.push(`${words[i]} ${words[i+1]}`);
    else lines.push(words[i]);
  }
  return lines;
}
