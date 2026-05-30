import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadAvatar, uploadBackground, uploadAudio, getAvatarColors } from '../utils/api';
import toast from 'react-hot-toast';

const PALETTE = [
  '#FFFFFF','#000000','#FF2EAA','#DC3296','#FF1744','#FF6B00','#FFE000','#FFB300',
  '#00FF88','#00C853','#00B4A0','#00CFFF','#40C4FF','#0066FF','#2979FF','#3D5AFE',
  '#8B2FC9','#4A0080','#B388FF','#FF80AB','#FF6E40','#795548','#0D021A','#212121',
];

const CONVERTERS = [
  { name:'ytmp3.cc',      url:()=>'https://ytmp3.cc/',                                                              icon:'🎵', desc:'Fast & simple' },
  { name:'cnvmp3.com',    url:()=>'https://cnvmp3.com/',                                                            icon:'⚡', desc:'No ads, safe' },
  { name:'toolsbear.com', url:(id)=>`https://toolsbear.com/youtube-to-mp3/?url=https://youtu.be/${id}`,             icon:'🎧', desc:'Auto-fills URL' },
  { name:'ezmp3.cc',      url:()=>'https://ezmp3.cc/',                                                              icon:'🔊', desc:'320kbps quality' },
];

/* ── Inline style objects ────────────────────────────── */
const S = {
  wrap:       { display:'flex', flexDirection:'column', gap:14 },
  label:      { fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.45)', marginBottom:6, display:'block' },
  input:      { width:'100%', background:'#161620', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#fff', outline:'none', boxSizing:'border-box' },
  dz:         { border:'1.5px dashed rgba(255,255,255,0.12)', borderRadius:10, padding:'14px 10px', textAlign:'center', cursor:'pointer', background:'#13131e', transition:'border-color 0.2s' },
  dzActive:   { border:'1.5px dashed #e040fb', background:'rgba(224,64,251,0.04)' },
  dzIco:      { fontSize:22, opacity:0.4, marginBottom:4 },
  dzTxt:      { fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.65)', margin:0 },
  dzDone:     { fontSize:12, fontWeight:500, color:'#C9A84C', margin:0 },
  dzHint:     { fontSize:10, color:'rgba(255,255,255,0.28)', marginTop:3, marginBottom:0 },
  grid2:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  sep:        { border:'none', borderTop:'1px solid rgba(255,255,255,0.07)', margin:'2px 0' },
  card:       { background:'#161620', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:10 },
  subLabel:   { fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:5 },
  // helper panel
  helper:     { background:'#0e0e1a', border:'1px solid rgba(201,168,76,0.25)', borderRadius:10, padding:12, marginTop:8 },
  helperTop:  { display:'flex', gap:10, marginBottom:10 },
  thumb:      { width:76, height:50, borderRadius:6, objectFit:'cover', border:'1px solid rgba(255,255,255,0.08)', flexShrink:0 },
  warn:       { fontSize:11, color:'#C9A84C', fontWeight:600, marginBottom:3 },
  sub:        { fontSize:10, color:'rgba(255,255,255,0.38)', lineHeight:1.4 },
  stepsBox:   { background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'8px 10px', marginBottom:8 },
  stepsTitle: { fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.6)', marginBottom:6 },
  step:       { display:'flex', alignItems:'flex-start', gap:7, marginBottom:5 },
  stepNum:    { background:'#e040fb', color:'#fff', borderRadius:'50%', width:16, height:16, fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 },
  stepTxt:    { fontSize:11, color:'rgba(255,255,255,0.45)', lineHeight:1.4 },
  copyBtn:    { width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'6px 10px', fontSize:11, color:'rgba(255,255,255,0.6)', cursor:'pointer', marginBottom:8, fontFamily:'inherit' },
  convGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 },
  convLink:   { display:'flex', flexDirection:'column', alignItems:'center', gap:3, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:8, padding:'8px 6px', textDecoration:'none', transition:'border-color 0.2s', cursor:'pointer' },
  convIco:    { fontSize:18 },
  convName:   { fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.75)' },
  convDesc:   { fontSize:9, color:'rgba(255,255,255,0.3)' },
  doneBadge:  { display:'flex', alignItems:'center', gap:6, background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.25)', borderRadius:8, padding:'6px 10px', marginTop:8, fontSize:11, color:'#4ade80' },
  // audio glow
  audioGlow:  { borderRadius:10, padding:3, background:'linear-gradient(135deg,rgba(201,168,76,0.18),rgba(201,168,76,0.04))', marginBottom:0 },
  audioLabel: { fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'#C9A84C', marginBottom:6, display:'block' },
  // color swatch
  swatch:     { width:32, height:32, borderRadius:8, border:'2px solid rgba(255,255,255,0.18)', cursor:'pointer', flexShrink:0, position:'relative', overflow:'hidden' },
  swatchInput:{ position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%' },
  colorGrid:  { display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:3, marginTop:8 },
  cdot:       { width:18, height:18, borderRadius:5, border:'2px solid transparent', cursor:'pointer', transition:'transform 0.15s' },
};

function DZ({ label, hint, accept, icon, file, onDrop }) {
  const [hover, setHover] = useState(false);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback(f => f[0] && onDrop(f[0]), [onDrop]),
    accept, multiple: false,
  });
  const style = { ...S.dz, ...(isDragActive || hover ? S.dzActive : {}) };
  return (
    <div {...getRootProps()} style={style}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <input {...getInputProps()} />
      <div style={S.dzIco}>{icon}</div>
      {file
        ? <p style={S.dzDone}>✓ {file.name}</p>
        : <p style={S.dzTxt}>{label}</p>}
      <p style={S.dzHint}>{hint}</p>
    </div>
  );
}

function ColorSlot({ label, color, index, onChange, onPreset }) {
  const hex = color.hex || '#000000';
  return (
    <div style={S.card}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <div style={{ ...S.swatch, background:hex }}>
          <input type="color" value={hex} style={S.swatchInput}
            onChange={e => onChange(index, e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.7)' }}>{label}</div>
          <div style={{ fontSize:10, fontFamily:'monospace', color:'rgba(255,255,255,0.35)' }}>{hex}</div>
        </div>
      </div>
      <div style={S.colorGrid}>
        {PALETTE.map(p => (
          <button key={p} title={p} onClick={() => onPreset(index, p)}
            style={{ ...S.cdot, background:p,
              border: hex.toLowerCase()===p.toLowerCase() ? '2px solid #fff' : '2px solid transparent',
              transform: hex.toLowerCase()===p.toLowerCase() ? 'scale(1.15)' : 'scale(1)' }} />
        ))}
      </div>
    </div>
  );
}

export default function SourcesTab({ config, setConfig, avatarFile, setAvatarFile, bgFile, setBgFile, audioFile, setAudioFile }) {
  const [gradientColors, setGradientColors] = useState(null);
  const [loadingColors, setLoadingColors]   = useState(false);
  const [logoFile, setLogoFile]             = useState(null);
  const [ytUrl, setYtUrl]                   = useState(config.youtube_url || '');
  const [ytInfo, setYtInfo]                 = useState(null);

  const extractId = url => { const m = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/); return m ? m[1] : null; };

  const handleYtChange = val => {
    setYtUrl(val);
    setConfig(p => ({ ...p, youtube_url: val }));
    const id = extractId(val);
    setYtInfo(id ? { videoId: id, thumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg` } : null);
  };

  const fetchColors = async () => {
    setLoadingColors(true);
    try {
      const r = await getAvatarColors();
      if (r.success) {
        const named = r.colors.map((c, i) => ({ ...c, name: ['Primary','Secondary','Accent'][i] }));
        setGradientColors(named);
        setConfig(p => ({ ...p, gradient_colors: named.map(c => [c.r, c.g, c.b]) }));
      }
    } catch {} finally { setLoadingColors(false); }
  };

  const handleAvatar = async f => {
    setAvatarFile(f);
    try { await uploadAvatar(f); toast.success('Avatar uploaded!'); await fetchColors(); }
    catch { toast.error('Upload failed'); }
  };

  const handleColorChange = (i, hex) => {
    const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    const u = gradientColors.map((c,j) => j===i ? { ...c,r,g,b,hex } : c);
    setGradientColors(u); setConfig(p => ({ ...p, gradient_colors: u.map(c=>[c.r,c.g,c.b]) }));
  };
  const handlePreset = (i, hex) => {
    const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    const u = gradientColors.map((c,j) => j===i ? { ...c,r,g,b,hex } : c);
    setGradientColors(u); setConfig(p => ({ ...p, gradient_colors: u.map(c=>[c.r,c.g,c.b]) }));
  };

  const prevGrad = gradientColors
    ? `linear-gradient(135deg,${gradientColors[0].hex},${gradientColors[1].hex},${gradientColors[2].hex})`
    : 'linear-gradient(135deg,#FF2EAA,#8B2FC9,#0D021A)';

  return (
    <div style={S.wrap}>

      {/* YouTube URL */}
      <div>
        <span style={S.label}>🔗 YouTube URL</span>
        <input style={S.input} placeholder="https://youtu.be/..."
          value={ytUrl} onChange={e => handleYtChange(e.target.value)} />

        {ytInfo && (
          <div style={S.helper}>
            <div style={S.helperTop}>
              <img src={ytInfo.thumb} alt="" style={S.thumb} onError={e => e.target.style.display='none'} />
              <div>
                <p style={S.warn}>⚠ Cloud servers block YouTube downloads</p>
                <p style={S.sub}>Use a free converter below → download MP3 → upload it in the Audio section.</p>
              </div>
            </div>
            <div style={S.stepsBox}>
              <p style={S.stepsTitle}>📋 3 simple steps:</p>
              {[
                'Click a converter — opens in new tab',
                'Download the MP3 file to your device',
                <>Upload it in <strong style={{color:'#C9A84C'}}>🎧 Audio Upload</strong> below</>,
              ].map((txt, i) => (
                <div key={i} style={S.step}>
                  <div style={S.stepNum}>{i+1}</div>
                  <span style={S.stepTxt}>{txt}</span>
                </div>
              ))}
            </div>
            <button style={S.copyBtn}
              onClick={() => { navigator.clipboard.writeText(ytUrl); toast.success('URL copied! Paste it in the converter'); }}>
              📋 Copy YouTube URL to clipboard
            </button>
            <div style={S.convGrid}>
              {CONVERTERS.map(c => (
                <a key={c.name} href={c.url(ytInfo.videoId)} target="_blank" rel="noopener noreferrer" style={S.convLink}>
                  <span style={S.convIco}>{c.icon}</span>
                  <span style={S.convName}>{c.name}</span>
                  <span style={S.convDesc}>{c.desc}</span>
                </a>
              ))}
            </div>
            {audioFile && (
              <div style={S.doneBadge}><span>✅</span>{audioFile.name}</div>
            )}
          </div>
        )}
      </div>

      <hr style={S.sep} />

      {/* Avatar + Background */}
      <div>
        <span style={S.label}>👤 Avatar & 🖼 Background</span>
        <div style={S.grid2}>
          <div>
            <p style={S.subLabel}>Avatar Image</p>
            <DZ label="Drop image or browse" hint="PNG JPG WebP" icon="🧍"
              accept={{ 'image/*': ['.png','.jpg','.jpeg','.webp'] }}
              file={avatarFile?.type?.startsWith('image') ? avatarFile : null}
              onDrop={handleAvatar} />
          </div>
          <div>
            <p style={S.subLabel}>Background</p>
            <DZ label="Drop image or browse" hint="PNG JPG WebP" icon="🌄"
              accept={{ 'image/*': ['.png','.jpg','.jpeg','.webp'] }}
              file={bgFile}
              onDrop={async f => { setBgFile(f); try { await uploadBackground(f); } catch {} }} />
          </div>
        </div>

      </div>

      <hr style={S.sep} />

      {/* Background Colors */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <span style={{ ...S.label, marginBottom:0 }}>🎨 Background Colors</span>
          {avatarFile && (
            <button onClick={fetchColors} disabled={loadingColors}
              style={{ fontSize:10, color:'#C9A84C', background:'none', border:'1px solid rgba(201,168,76,0.25)', borderRadius:5, padding:'2px 8px', cursor:'pointer', fontFamily:'inherit' }}>
              {loadingColors ? '⟳ Detecting…' : '↺ Auto-detect'}
            </button>
          )}
        </div>
        <div style={{ height:36, borderRadius:8, background:prevGrad, marginBottom:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.75)', fontWeight:600, textShadow:'0 1px 4px rgba(0,0,0,0.6)' }}>
            {gradientColors ? gradientColors.map(c=>c.name).join(' → ') : 'Auto gradient preview'}
          </span>
        </div>
        {gradientColors ? (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {gradientColors.map((c,i) => (
              <ColorSlot key={i} label={['Primary','Secondary','Accent'][i]}
                color={c} index={i} onChange={handleColorChange} onPreset={handlePreset} />
            ))}
          </div>
        ) : (
          <div style={{ ...S.card, textAlign:'center', padding:14 }}>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>Upload an avatar to auto-detect colors</p>
            <p style={{ fontSize:10, color:'rgba(255,255,255,0.2)', marginTop:3 }}>Or colors are generated automatically</p>
          </div>
        )}
      </div>

      <hr style={S.sep} />

      {/* Audio Upload — prominent section */}
      <div style={{ borderRadius:10, padding:'12px', background:'rgba(255,46,170,0.04)', border:'1px solid rgba(255,46,170,0.12)' }}>
        <span style={{ ...S.label, color: ytInfo ? '#FF2EAA' : 'rgba(255,255,255,0.45)', marginBottom:6 }}>
          🎧 {ytInfo ? '⬅ Upload Downloaded MP3 Here' : 'Audio Upload'}
        </span>
        <DZ label={ytInfo ? 'Drop your downloaded MP3 here' : 'Drop MP3, WAV or M4A'}
          hint="Overrides YouTube audio — required if no YouTube URL"
          icon="♫" file={audioFile}
          accept={{ 'audio/*': ['.mp3','.wav','.m4a','.ogg'] }}
          onDrop={async f => {
            setAudioFile(f);
            toast.success('Audio uploaded! 🎵');
            try { await uploadAudio(f); } catch {}
          }} />
      </div>

      <hr style={S.sep} />

      {/* Custom Logo */}
      <div>
        <span style={S.label}>🏷️ Custom Logo <span style={{ textTransform:'none', letterSpacing:0, color:'rgba(255,255,255,0.28)' }}>— replaces TikTok logo</span></span>
        <DZ label="Upload logo (optional)" hint="PNG with transparency recommended" icon="🎯"
          accept={{ 'image/*': ['.png','.jpg','.jpeg','.webp'] }}
          file={logoFile}
          onDrop={async f => {
            setLogoFile(f);
            try {
              const fd = new FormData(); fd.append('file', f);
              await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/upload/logo`, { method:'POST', body:fd });
              toast.success('Logo uploaded!');
            } catch { toast.error('Logo upload failed'); }
          }} />
      </div>

    </div>
  );
}