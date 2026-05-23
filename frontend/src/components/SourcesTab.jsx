import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadAvatar, uploadBackground, uploadAudio, getAvatarColors } from '../utils/api';
import toast from 'react-hot-toast';

// Full color palette with names — all 3 slots
const FULL_PALETTE = [
  { name: 'White',       hex: '#FFFFFF' },
  { name: 'Black',       hex: '#000000' },
  { name: 'Hot Pink',    hex: '#FF2EAA' },
  { name: 'Magenta',     hex: '#DC3296' },
  { name: 'Red',         hex: '#FF1744' },
  { name: 'Orange',      hex: '#FF6B00' },
  { name: 'Yellow',      hex: '#FFE000' },
  { name: 'Gold',        hex: '#FFB300' },
  { name: 'Lime',        hex: '#00FF88' },
  { name: 'Green',       hex: '#00C853' },
  { name: 'Teal',        hex: '#00B4A0' },
  { name: 'Cyan',        hex: '#00CFFF' },
  { name: 'Sky Blue',    hex: '#40C4FF' },
  { name: 'Neon Blue',   hex: '#0066FF' },
  { name: 'Royal Blue',  hex: '#2979FF' },
  { name: 'Indigo',      hex: '#3D5AFE' },
  { name: 'Purple',      hex: '#8B2FC9' },
  { name: 'Deep Violet', hex: '#4A0080' },
  { name: 'Lavender',    hex: '#B388FF' },
  { name: 'Pink',        hex: '#FF80AB' },
  { name: 'Coral',       hex: '#FF6E40' },
  { name: 'Brown',       hex: '#795548' },
  { name: 'Dark Navy',   hex: '#0D021A' },
  { name: 'Dark Gray',   hex: '#212121' },
];

function DropZone({ label, hint, accept, icon, file, onDrop, accent = 'pink' }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback(files => files[0] && onDrop(files[0]), [onDrop]),
    accept, multiple: false,
  });
  const borderColor = isDragActive ? 'border-pink-500 bg-pink-500/5' : 'border-white/10 hover:border-white/25 bg-[#161616]';
  return (
    <div {...getRootProps()}
      className={`border border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${borderColor}`}>
      <input {...getInputProps()} />
      <div className="text-3xl mb-2 opacity-50">{icon}</div>
      <p className="text-sm text-white/70 font-medium">{file ? `✓ ${file.name}` : label}</p>
      <p className="text-xs text-white/30 mt-1">{hint}</p>
    </div>
  );
}

function ColorSlot({ label, color, index, onColorChange, onPresetClick }) {
  return (
    <div className="bg-[#161616] rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <label className="cursor-pointer relative">
          <div className="w-10 h-10 rounded-xl border-2 border-white/20 hover:border-white/50 transition-all shadow-lg"
               style={{ backgroundColor: color.hex }} />
          <input type="color" value={color.hex}
            onChange={e => onColorChange(index, e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
        </label>
        <div>
          <p className="text-xs font-semibold text-white/90">{label}</p>
          <p className="text-xs text-white/40 font-mono">{color.hex}</p>
        </div>
      </div>
      {/* Full palette grid */}
      <div className="grid grid-cols-8 gap-1">
        {FULL_PALETTE.map(p => (
          <button key={p.hex} title={p.name}
            onClick={() => onPresetClick(index, p)}
            className={`w-5 h-5 rounded-md border transition-all hover:scale-110
              ${color.hex.toLowerCase() === p.hex.toLowerCase()
                ? 'border-white scale-110' : 'border-white/10'}`}
            style={{ backgroundColor: p.hex }} />
        ))}
      </div>
    </div>
  );
}

export default function SourcesTab({ config, setConfig, avatarFile, setAvatarFile, bgFile, setBgFile, audioFile, setAudioFile }) {
  const [gradientColors, setGradientColors] = useState(null);
  const [loadingColors, setLoadingColors]   = useState(false);
  const [logoFile, setLogoFile]             = useState(null);

  const fetchColors = async () => {
    setLoadingColors(true);
    try {
      const result = await getAvatarColors();
      if (result.success) {
        const named = result.colors.map((c, i) => ({
          ...c, name: ['Primary', 'Secondary', 'Accent'][i],
        }));
        setGradientColors(named);
        setConfig(p => ({ ...p, gradient_colors: named.map(c => [c.r, c.g, c.b]) }));
      }
    } catch {} finally { setLoadingColors(false); }
  };

  const handleAvatarDrop = async (file) => {
    setAvatarFile(file);
    try { await uploadAvatar(file); toast.success('Avatar uploaded!'); await fetchColors(); }
    catch { toast.error('Upload failed'); }
  };

  const handleColorChange = (index, hex) => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    const updated = gradientColors.map((c,i) => i===index ? {...c,r,g,b,hex} : c);
    setGradientColors(updated);
    setConfig(p => ({ ...p, gradient_colors: updated.map(c => [c.r,c.g,c.b]) }));
  };

  const handlePresetClick = (index, preset) => {
    const r = parseInt(preset.hex.slice(1,3),16), g = parseInt(preset.hex.slice(3,5),16), b = parseInt(preset.hex.slice(5,7),16);
    const updated = gradientColors.map((c,i) => i===index ? {...c,r,g,b,hex:preset.hex,name:preset.name} : c);
    setGradientColors(updated);
    setConfig(p => ({ ...p, gradient_colors: updated.map(c => [c.r,c.g,c.b]) }));
  };

  const previewGradient = gradientColors
    ? `linear-gradient(135deg, ${gradientColors[0].hex} 0%, ${gradientColors[1].hex} 50%, ${gradientColors[2].hex} 100%)`
    : 'linear-gradient(135deg, #FF2EAA, #8B2FC9, #0D021A)';

  return (
    <div className="space-y-4">
      {/* YouTube URL */}
      <div>
        <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">🔗 YouTube URL</label>
        <input type="text" placeholder="Paste YouTube URL here…"
          value={config.youtube_url}
          onChange={e => setConfig(p => ({ ...p, youtube_url: e.target.value }))}
          className="w-full bg-[#161616] border border-white/10 rounded-2xl px-4 py-3 text-sm
            placeholder-white/20 focus:outline-none focus:border-pink-500/60 transition-colors" />
      </div>

      {/* Avatar + Background */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">👤 Avatar</label>
          <div className="space-y-2">
            <DropZone label="Drop image or browse" hint="PNG, JPG, WebP"
              accept={{ 'image/*': ['.png','.jpg','.jpeg','.webp'] }}
              icon="🧍" file={avatarFile && avatarFile.type?.startsWith('image') ? avatarFile : null}
              onDrop={handleAvatarDrop} />
            <DropZone label="Or drop video avatar" hint="MP4, WebM, MOV (animated)"
              accept={{ 'video/*': ['.mp4','.webm','.mov','.avi'] }}
              icon="🎬" file={avatarFile && avatarFile.type?.startsWith('video') ? avatarFile : null}
              onDrop={handleAvatarDrop} />
          </div>
        </div>
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">🖼 Background</label>
          <DropZone label="Drop or browse" hint="PNG, JPG, WebP"
            accept={{ 'image/*': ['.png','.jpg','.jpeg','.webp'] }}
            icon="🌄" file={bgFile}
            onDrop={async f => { setBgFile(f); try { await uploadBackground(f); } catch {} }} />
        </div>
      </div>

      {/* Background Colors */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-white/50 uppercase tracking-wider">🎨 Background Colors</label>
          {avatarFile && (
            <button onClick={fetchColors} disabled={loadingColors}
              className="text-xs text-pink-400 hover:text-pink-300 border border-pink-500/30 px-2.5 py-1 rounded-lg transition-colors">
              {loadingColors ? '⟳ Detecting…' : '↺ Auto-detect'}
            </button>
          )}
        </div>

        {/* Live gradient preview */}
        <div className="rounded-2xl overflow-hidden h-14 mb-3 flex items-center justify-center"
             style={{ background: previewGradient }}>
          <span className="text-xs text-white/80 font-semibold drop-shadow-lg">
            {gradientColors ? gradientColors.map(c=>c.name).join(' → ') : 'Auto gradient preview'}
          </span>
        </div>

        {gradientColors ? (
          <div className="space-y-2">
            {gradientColors.map((color, i) => (
              <ColorSlot key={i} label={['Primary Color','Secondary Color','Accent Color'][i]}
                color={color} index={i}
                onColorChange={handleColorChange} onPresetClick={handlePresetClick} />
            ))}
          </div>
        ) : (
          <div className="bg-[#161616] rounded-2xl p-4 text-center">
            <p className="text-sm text-white/40">Upload an avatar to auto-detect colors</p>
            <p className="text-xs text-white/25 mt-1">Or colors will be extracted automatically</p>
          </div>
        )}
      </div>

      {/* Custom Audio */}
      <div>
        <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">🎧 Custom Audio</label>
        <DropZone label="Upload audio (optional)" hint="MP3, WAV, M4A — overrides YouTube audio"
          accept={{ 'audio/*': ['.mp3','.wav','.m4a','.ogg'] }}
          icon="♫" file={audioFile}
          onDrop={async f => { setAudioFile(f); try { await uploadAudio(f); } catch {} }} />
      </div>

      {/* Custom Logo */}
      <div>
        <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">
          🎵 Custom Logo <span style={{ color: 'rgba(255,255,255,0.3)' }}>(replaces TikTok logo)</span>
        </label>
        <DropZone label="Upload your logo (optional)" hint="PNG with transparency recommended"
          accept={{ 'image/*': ['.png','.jpg','.jpeg','.webp'] }}
          icon="🏷️" file={logoFile}
          onDrop={async f => {
            setLogoFile(f);
            try {
              const fd = new FormData(); fd.append('file', f);
              await fetch('http://127.0.0.1:8000/api/upload/logo', { method: 'POST', body: fd });
              toast.success('Custom logo uploaded!');
            } catch { toast.error('Logo upload failed'); }
          }} />
      </div>
    </div>
  );
}
